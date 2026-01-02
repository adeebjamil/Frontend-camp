'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiRefreshCw, FiSend, FiMessageCircle, FiChevronLeft, FiChevronRight, FiInbox, FiClock, FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';

interface Campaign {
  _id: string;
  subject: string;
  provider: string;
  status: string;
  sentCount: number;
  totalRecipients: number;
  createdAt: string;
}

interface WhatsAppCampaignsListProps {
  campaigns: Campaign[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function WhatsAppCampaignsList({ campaigns, onRefresh, isLoading = false }: WhatsAppCampaignsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>(campaigns);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem);
  
  useEffect(() => {
    if (campaigns) {
      const filtered = campaigns.filter(campaign => 
        campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCampaigns(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, campaigns]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getProgressPercent = (sent: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((sent / total) * 100);
  };
  
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { 
          bg: 'bg-emerald-500/20', 
          text: 'text-emerald-400', 
          border: 'border-emerald-500/30',
          icon: FiCheckCircle 
        };
      case 'in-progress':
      case 'sending':
        return { 
          bg: 'bg-blue-500/20', 
          text: 'text-blue-400', 
          border: 'border-blue-500/30',
          icon: FiLoader 
        };
      case 'pending':
        return { 
          bg: 'bg-amber-500/20', 
          text: 'text-amber-400', 
          border: 'border-amber-500/30',
          icon: FiClock 
        };
      case 'failed':
        return { 
          bg: 'bg-red-500/20', 
          text: 'text-red-400', 
          border: 'border-red-500/30',
          icon: FiXCircle 
        };
      default:
        return { 
          bg: 'bg-slate-500/20', 
          text: 'text-slate-400', 
          border: 'border-slate-500/30',
          icon: FiMessageCircle 
        };
    }
  };
  
  const handleSendCampaign = async (campaignId: string) => {
    setProcessingId(campaignId);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in');
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-camp-rikl.onrender.com/api';
      
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
      
      setFilteredCampaigns(prev => 
        prev.map(campaign => 
          campaign._id === campaignId 
            ? { ...campaign, status: 'in-progress' }
            : campaign
        )
      );
      
      setTimeout(() => onRefresh?.(), 1000);
      
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      alert(error.message || 'Failed to send campaign');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 lg:p-4 border-b border-slate-700/50 flex justify-between items-center gap-2 lg:gap-4">
        <div className="relative flex-1 lg:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            className="w-full pl-10 pr-4 py-2 lg:py-2.5 text-sm lg:text-base bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        {onRefresh && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            className="p-2 lg:p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
            title="Refresh campaigns"
          >
            <FiRefreshCw className={`w-4 h-4 lg:w-5 lg:h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        )}
      </div>
      
      {/* Table Headers - Desktop Only */}
      <div className="hidden lg:grid grid-cols-5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 bg-slate-800/30">
        <div className="px-6 py-3 col-span-1">Subject</div>
        <div className="px-6 py-3 col-span-1">Provider</div>
        <div className="px-6 py-3 col-span-1">Status</div>
        <div className="px-6 py-3 col-span-1">Progress</div>
        <div className="px-6 py-3 col-span-1">Date</div>
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-slate-700"></div>
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-sm">Loading campaigns...</p>
        </div>
      ) : (
        <>
          {/* Empty State */}
          {filteredCampaigns.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <FiInbox className="w-8 h-8" />
              </div>
              <p className="font-medium text-white">No WhatsApp campaigns found</p>
              <p className="text-sm mt-1">Create a new campaign to get started</p>
            </div>
          ) : (
            <>
              {/* Campaigns List */}
              <AnimatePresence mode="popLayout">
                {currentItems.map((campaign, index) => {
                  const statusConfig = getStatusConfig(campaign.status);
                  const StatusIcon = statusConfig.icon;
                  const progressPercent = getProgressPercent(campaign.sentCount, campaign.totalRecipients);
                  
                  return (
                    <motion.div 
                      key={campaign._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Mobile Card View */}
                      <div className="lg:hidden p-4 border-b border-slate-700/30 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FiMessageCircle className="text-emerald-400 flex-shrink-0 w-4 h-4" />
                            <span className="font-medium text-white text-sm truncate">{campaign.subject}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <StatusIcon className={`w-3 h-3 ${campaign.status === 'in-progress' || campaign.status === 'sending' ? 'animate-spin' : ''}`} />
                            {campaign.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800/50">
                            {campaign.provider === 'baileys' ? 'WhatsApp Web' : campaign.provider}
                          </span>
                          <span>{formatDate(campaign.createdAt)}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                            />
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {campaign.sentCount}/{campaign.totalRecipients}
                          </span>
                          {campaign.status === 'pending' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSendCampaign(campaign._id)}
                              disabled={processingId === campaign._id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {processingId === campaign._id ? (
                                <FiLoader className="w-3 h-3 animate-spin" />
                              ) : (
                                <FiSend className="w-3 h-3" />
                              )}
                              Send
                            </motion.button>
                          )}
                        </div>
                      </div>
                      
                      {/* Desktop Table View */}
                      <div className="hidden lg:grid grid-cols-5 text-sm border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                        <div className="px-6 py-4 col-span-1">
                          <div className="flex items-center gap-2">
                            <FiMessageCircle className="text-emerald-400 flex-shrink-0" />
                            <span className="font-medium text-white truncate">{campaign.subject}</span>
                          </div>
                        </div>
                        <div className="px-6 py-4 col-span-1 text-slate-400">
                          <span className="px-2 py-1 rounded-md bg-slate-800/50 text-xs">
                            {campaign.provider === 'baileys' ? 'WhatsApp Web' : campaign.provider}
                          </span>
                        </div>
                        <div className="px-6 py-4 col-span-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                              <StatusIcon className={`w-3 h-3 ${campaign.status === 'in-progress' || campaign.status === 'sending' ? 'animate-spin' : ''}`} />
                              {campaign.status}
                            </span>
                            {campaign.status === 'pending' && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSendCampaign(campaign._id)}
                                disabled={processingId === campaign._id}
                                className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                {processingId === campaign._id ? (
                                  <FiLoader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FiSend className="w-3 h-3" />
                                )}
                                Send
                              </motion.button>
                            )}
                          </div>
                        </div>
                        <div className="px-6 py-4 col-span-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                              />
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap min-w-[60px]">
                              {campaign.sentCount}/{campaign.totalRecipients}
                            </span>
                          </div>
                        </div>
                        <div className="px-6 py-4 col-span-1 text-slate-400 text-xs">
                          {formatDate(campaign.createdAt)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* Pagination */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-slate-700/50 bg-slate-800/20">
                <p className="text-sm text-slate-400">
                  Showing <span className="text-white font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="text-white font-medium">{Math.min(indexOfLastItem, filteredCampaigns.length)}</span> of{' '}
                  <span className="text-white font-medium">{filteredCampaigns.length}</span> results
                </p>
                
                <div className="flex items-center gap-1">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </motion.button>
                  
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
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                          currentPage === pageNum 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
