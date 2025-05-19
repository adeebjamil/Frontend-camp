import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    
    // Get the authorization header from the incoming request
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }
    
    // Get any cookies (may contain session information)
    const cookieStore = cookies();
    const allCookies = Object.fromEntries(
      cookieStore.getAll().map(c => [c.name, c.value])
    );
    
    // Make a request to your backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/whatsapp/campaigns/${campaignId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Forward the auth header
        // Add cookies as a Cookie header if needed
        ...(Object.keys(allCookies).length > 0 
          ? { Cookie: Object.entries(allCookies)
              .map(([name, value]) => `${name}=${value}`)
              .join('; ') 
            }
          : {})
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to send campaign' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error sending WhatsApp campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}