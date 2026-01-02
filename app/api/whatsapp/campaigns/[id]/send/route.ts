import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const sendCampaign = async (id: string, token: string) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-camp-rikl.onrender.com/api';
    const response = await fetch(`${apiUrl}/whatsapp/campaigns/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send campaign');
    }

    return data;
  } catch (error) {
    console.error("Error sending campaign:", error);
    throw error;
  }
};

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
    
    // Call the sendCampaign function
    const data = await sendCampaign(campaignId, authHeader);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error sending WhatsApp campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}