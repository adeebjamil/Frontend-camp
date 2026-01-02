import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://backend-camp-rikl.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to request headers
    if (token) {
      // Make sure we have headers object
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// OTP functions
export const sendOTP = async (email: string) => {
  return await api.post('/auth/send-otp', { email });
};

export const verifyOTP = async (email: string, otp: string) => {
  return await api.post('/auth/verify-otp', { email, otp });
};

// Avatar functions
export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  return await api.post('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const deleteAvatar = async () => {
  return await api.delete('/auth/avatar');
};

export interface CampaignFormData {
  subject: string;
  message: string;
  provider: 'brevo';  // Only Brevo is supported now
  csvFile: File;
  posterImage?: File; // Add this line for the poster image
}

export interface Campaign {
  _id: string;
  subject: string;
  provider: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  totalRecipients: number;
  sentCount: number;
  createdAt: string;
}

export const sendCampaign = async (formData: CampaignFormData) => {
  const data = new FormData();
  data.append('subject', formData.subject);
  data.append('message', formData.message);
  data.append('provider', formData.provider);
  data.append('csvFile', formData.csvFile);
  
  // Add poster image if it exists
  if (formData.posterImage) {
    data.append('posterImage', formData.posterImage);
  }

  return await api.post('/email/campaign', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getCampaigns = async () => {
  return await api.get('/email/campaigns');
};

export const sendTestEmail = async (email: string) => {
  // Use Brevo as the default provider
  return await api.post('/email/test', { email, provider: 'brevo' });
};

export interface WhatsAppCampaignFormData {
  subject: string;
  message: string;
  provider: 'baileys';
  csvFile: File;
  posterImage?: File;
  pdfCatalog?: File;
}

export interface WhatsAppCampaign {
  _id: string;
  subject: string;
  provider: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  totalRecipients: number;
  sentCount: number;
  createdAt: string;
  posterImage?: {
    filename: string;
    path: string;
    originalName: string;
  };
  pdfCatalog?: {
    filename: string;
    path: string;
    originalName: string;
  };
}

export const sendWhatsAppCampaign = async (formData: WhatsAppCampaignFormData) => {
  const data = new FormData();
  data.append('subject', formData.subject);
  data.append('message', formData.message);
  data.append('provider', formData.provider);
  data.append('csvFile', formData.csvFile);
  
  if (formData.posterImage) {
    data.append('posterImage', formData.posterImage);
  }
  
  if (formData.pdfCatalog) {
    data.append('pdfCatalog', formData.pdfCatalog);
  }

  return await api.post('/whatsapp/campaign', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getWhatsAppCampaigns = async () => {
  return await api.get('/whatsapp/campaigns');
};

export const getWhatsAppCampaignById = async (id: string) => {
  return await api.get(`/whatsapp/campaign/${id}`);
};

export const getWhatsAppStatus = async () => {
  return await api.get('/whatsapp/status');
};

export const initWhatsAppConnection = async () => {
  return await api.post('/whatsapp/init');
};

export const sendWhatsAppCampaignById = async (campaignId: string) => {
  try {
    // Get the authentication token from localStorage or wherever you store it
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token missing. Please log in again.');
    }
    
    const response = await fetch(`/api/whatsapp/campaigns/${campaignId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Add the token here
      },
      credentials: 'include' // Include cookies too for additional security
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to send campaign');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('API error:', error);
    throw error;
  }
};

export default api;