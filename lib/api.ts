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

// Username check function
export const checkUsername = async (username: string) => {
  return await api.post('/auth/check-username', { username });
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
  posterImage?: File;
  scheduledAt?: string; // ISO date string for scheduling
}

export interface Campaign {
  _id: string;
  subject: string;
  provider: string;
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'failed' | 'partially-failed';
  totalRecipients: number;
  sentCount: number;
  failedCount?: number;
  openCount?: number;
  clickCount?: number;
  scheduledAt?: string;
  createdAt: string;
}

export interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  content: string;
  category: 'marketing' | 'newsletter' | 'announcement' | 'promotional' | 'transactional' | 'other';
  variables: string[];
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
  
  // Add scheduled time if specified
  if (formData.scheduledAt) {
    data.append('scheduledAt', formData.scheduledAt);
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

// Email AI Generation
export const generateEmailContent = async (prompt: string, tone?: string, type?: string) => {
  return await api.post('/email/generate-content', { prompt, tone, type });
};

export const generateEmailSubjects = async (topic: string) => {
  return await api.post('/email/generate-subjects', { topic });
};

// Email Templates
export const getEmailTemplates = async (): Promise<{ data: { success: boolean; data: EmailTemplate[] } }> => {
  return await api.get('/email/templates');
};

export const getEmailTemplateById = async (id: string): Promise<{ data: { success: boolean; data: EmailTemplate } }> => {
  return await api.get(`/email/templates/${id}`);
};

export const createEmailTemplate = async (template: { name: string; subject: string; content: string; category?: string }) => {
  return await api.post('/email/templates', template);
};

export const updateEmailTemplate = async (id: string, template: { name?: string; subject?: string; content?: string; category?: string }) => {
  return await api.put(`/email/templates/${id}`, template);
};

export const deleteEmailTemplate = async (id: string) => {
  return await api.delete(`/email/templates/${id}`);
};

// Email Campaign Reports
export const getCampaignReport = async (id: string) => {
  return await api.get(`/email/campaign/${id}/report`);
};

export const retryFailedEmails = async (id: string) => {
  return await api.post(`/email/campaign/${id}/retry`);
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
  video?: File;
   scheduledAt?: string;
  templateId?: string;
  links?: string;
}

export interface RecipientStatus {
  phone: string;
  name?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  error?: string;
  sentAt?: string;
  retryCount?: number;
}

export interface WhatsAppCampaign {
  _id: string;
  subject: string;
  message: string;
  provider: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'scheduled' | 'cancelled';
  totalRecipients: number;
  sentCount: number;
  failedCount?: number;
  deliveredCount?: number;
  scheduledAt?: string;
  isScheduled?: boolean;
  createdAt: string;
  recipientDetails?: RecipientStatus[];
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
  video?: {
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

  if (formData.video) {
    data.append('video', formData.video);
  }

  if (formData.scheduledAt) {
    data.append('scheduledAt', formData.scheduledAt);
  }

  if (formData.templateId) {
    data.append('templateId', formData.templateId);
  }

  if (formData.links) {
    data.append('links', formData.links);
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

export const disconnectWhatsApp = async () => {
  return await api.post('/whatsapp/disconnect');
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

// ==================== DELIVERY REPORTS ====================
export interface DeliveryReport {
  success: boolean;
  campaignId: string;
  subject: string;
  status: string;
  stats: {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  };
  failedByError: Record<string, number>;
  recipients: RecipientStatus[];
}

export const getDeliveryReport = async (campaignId: string) => {
  return await api.get<DeliveryReport>(`/whatsapp/campaign/${campaignId}/delivery-report`);
};

// ==================== RETRY FAILED MESSAGES ====================
export const retryFailedMessages = async (campaignId: string) => {
  return await api.post(`/whatsapp/campaign/${campaignId}/retry`);
};

// ==================== CANCEL SCHEDULED CAMPAIGN ====================
export const cancelScheduledCampaign = async (campaignId: string) => {
  return await api.post(`/whatsapp/campaign/${campaignId}/cancel`);
};

// ==================== DELETE CAMPAIGN ====================
export const deleteWhatsAppCampaign = async (campaignId: string) => {
  return await api.delete(`/whatsapp/campaign/${campaignId}`);
};

// ==================== AI FEATURES ====================
export interface AIGenerateMessageParams {
  type: 'whatsapp' | 'email';
  purpose: string;
  tone?: 'professional' | 'friendly' | 'casual' | 'formal';
  length?: 'short' | 'medium' | 'long';
  includeEmoji?: boolean;
  targetAudience?: string;
}

export interface AIGeneratedMessage {
  message: string;
  subject?: string;
}

export const generateAIMessage = async (params: AIGenerateMessageParams) => {
  return await api.post<{ success: boolean; data: AIGeneratedMessage }>('/ai/generate-message', params);
};

export const generateSubjectLines = async (content: string, count?: number) => {
  return await api.post<{ success: boolean; subjects: string[] }>('/ai/generate-subjects', { content, count });
};

export const improveMessage = async (message: string, improvements: string[]) => {
  return await api.post<{ success: boolean; improvedMessage: string; changes: string[] }>('/ai/improve-message', { message, improvements });
};

export const getAnalyticsSummary = async (campaignData: object) => {
  return await api.post<{ success: boolean; summary: string; insights: string[]; recommendations: string[] }>('/ai/analytics-summary', { campaignData });
};

// ==================== TEMPLATES ====================
export interface Template {
  _id: string;
  user: string;
  name: string;
  type: 'whatsapp' | 'email';
  subject?: string;
  message: string;
  category?: string;
  variables: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateParams {
  name: string;
  type: 'whatsapp' | 'email';
  subject?: string;
  message: string;
  category?: string;
}

export const getTemplates = async (type?: 'whatsapp' | 'email', category?: string) => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (category) params.append('category', category);
  return await api.get<{ success: boolean; data: Template[] }>(`/templates?${params.toString()}`);
};

export const getTemplateById = async (templateId: string) => {
  return await api.get<{ success: boolean; data: Template }>(`/templates/${templateId}`);
};

export const createTemplate = async (params: CreateTemplateParams) => {
  return await api.post<Template>('/templates', params);
};

export const updateTemplate = async (templateId: string, params: Partial<CreateTemplateParams>) => {
  return await api.put<Template>(`/templates/${templateId}`, params);
};

export const deleteTemplate = async (templateId: string) => {
  return await api.delete(`/templates/${templateId}`);
};

export const useTemplate = async (templateId: string) => {
  return await api.post<Template>(`/templates/${templateId}/use`);
};

// ==================== NOTIFICATIONS ====================
export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: {
    campaignId?: string;
    campaignType?: string;
    link?: string;
  };
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

export const getNotifications = async (page = 1, limit = 20, unreadOnly = false) => {
  return await api.get<NotificationsResponse>(`/notifications?page=${page}&limit=${limit}&unread=${unreadOnly}`);
};

export const getUnreadNotificationCount = async () => {
  return await api.get<{ success: boolean; count: number }>('/notifications/unread-count');
};

export const markNotificationAsRead = async (id: string) => {
  return await api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async () => {
  return await api.put('/notifications/read-all');
};

export const deleteNotification = async (id: string) => {
  return await api.delete(`/notifications/${id}`);
};

export const clearAllNotifications = async () => {
  return await api.delete('/notifications/clear/all');
};

export const registerFCMToken = async (token: string) => {
  return await api.post('/notifications/fcm/register', { token });
};

export const unregisterFCMToken = async (token: string) => {
  return await api.post('/notifications/fcm/unregister', { token });
};

export interface NotificationPreferences {
  campaignCompleted: boolean;
  campaignFailed: boolean;
  whatsappStatus: boolean;
  quotaWarnings: boolean;
}

export const getNotificationPreferences = async () => {
  return await api.get<{ success: boolean; preferences: NotificationPreferences }>('/notifications/preferences');
};

export const updateNotificationPreferences = async (prefs: Partial<NotificationPreferences>) => {
  return await api.put<{ success: boolean; preferences: NotificationPreferences }>('/notifications/preferences', prefs);
};

export default api;