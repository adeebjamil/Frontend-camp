"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { sendWhatsAppCampaignById } from '../../lib/api';

interface WhatsAppCampaign {
  _id: string;
  subject: string;
  provider: string;
  status: string;
  sentCount: number;
  totalRecipients: number;
  createdAt: string;
}

interface WhatsAppCampaignsListProps {
  campaigns: WhatsAppCampaign[];
  isLoading: boolean;
  onRefresh?: () => void;
}

function showNotification(message: string, type: 'success' | 'error' = 'success') {
  // You could use a simple alert for now
  alert(message);
  
  // Later you can implement a more sophisticated notification system
  // or install react-toastify properly
}

export default function WhatsAppCampaignsList({ campaigns, isLoading, onRefresh }: WhatsAppCampaignsListProps) {
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filteredCampaigns, setFilteredCampaigns] = useState<WhatsAppCampaign[]>([]);
  
  // Processing state
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Handle search and filtering
  useEffect(() => {
    const results = campaigns.filter(campaign => 
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
      campaign.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCampaigns(results);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, campaigns]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Status badge styles
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'in-progress':
      case 'sending': // Add this case
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };
  
  // Progress bar styles
  const getProgressPercent = (sent: number, total: number) => {
    if (total === 0) return 0;
    return (sent / total) * 100;
  };

  // Handle sending campaign
  const handleSendCampaign = async (campaignId: string) => {
    try {
      setProcessingId(campaignId);
      
      // Get the token
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        return;
      }
      
      // Use the correct API URL
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-camp-rikl.onrender.com/api';
      
      // Remove the /api part since it's already included in backendUrl
      const response = await fetch(`${backendUrl}/whatsapp/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send campaign');
      }
      
      const result = await response.json();
      alert('Campaign sending started successfully!');
      
      // Update local state to reflect a valid status change
      setFilteredCampaigns(prev => 
        prev.map(campaign => 
          campaign._id === campaignId 
            ? { ...campaign, status: 'in-progress' } // Use 'in-progress' instead of 'sending'
            : campaign
        )
      );
      
      // Refresh the list after a delay
      setTimeout(() => onRefresh?.(), 1000);
      
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      alert(error.message || 'Failed to send campaign');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center bg-gray-50 rounded-md w-full max-w-md">
          <div className="pl-3">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search campaigns..."
            className="w-full p-2 bg-gray-50 outline-none focus:ring-0"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Refresh button */}
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="ml-4 flex items-center justify-center h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"
            title="Refresh campaigns"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Table Headers */}
      <div className="grid grid-cols-5 text-sm font-medium text-gray-500 border-b">
        <div className="px-6 py-3 col-span-1">SUBJECT</div>
        <div className="px-6 py-3 col-span-1">PROVIDER</div>
        <div className="px-6 py-3 col-span-1">STATUS</div>
        <div className="px-6 py-3 col-span-1">PROGRESS</div>
        <div className="px-6 py-3 col-span-1">DATE</div>
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          <p className="mt-3">Loading campaigns...</p>
        </div>
      ) : (
        <>
          {/* Empty State */}
          {filteredCampaigns.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mt-3 font-medium">No WhatsApp campaigns found</p>
              <p className="text-sm">Create a new campaign to get started</p>
            </div>
          ) : (
            <>
              {/* Campaigns Table */}
              {currentItems.map((campaign) => (
                <div key={campaign._id} className="grid grid-cols-5 text-sm border-b hover:bg-gray-50">
                  <div className="px-6 py-4 col-span-1 font-medium text-gray-900 truncate">
                    {campaign.subject}
                  </div>
                  <div className="px-6 py-4 col-span-1 text-gray-600">
                    {campaign.provider === 'baileys' ? 'WhatsApp Web' : campaign.provider}
                  </div>
                  <div className="px-6 py-4 col-span-1">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(campaign.status)}`}>
                      {campaign.status}
                    </span>
                    {campaign.status === 'pending' && (
                      <button
                        onClick={() => handleSendCampaign(campaign._id)}
                        className="ml-2 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm"
                        title="Send this campaign"
                      >
                        Send
                      </button>
                    )}
                  </div>
                  <div className="px-6 py-4 col-span-1">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full" 
                          style={{ width: `${getProgressPercent(campaign.sentCount, campaign.totalRecipients)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs whitespace-nowrap">
                        {campaign.sentCount} / {campaign.totalRecipients}
                      </span>
                    </div>
                  </div>
                  <div className="px-6 py-4 col-span-1 text-gray-600">
                    {formatDate(campaign.createdAt)}
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCampaigns.length)} of {filteredCampaigns.length} results
                </div>
                
                <div className="flex space-x-1">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 text-gray-600 disabled:opacity-50"
                  >
                    &lt;
                  </button>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded ${
                          currentPage === pageNum 
                            ? 'bg-green-600 text-white' 
                            : 'border border-gray-300 text-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 text-gray-600 disabled:opacity-50"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}