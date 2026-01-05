'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiRefreshCw, FiSend, FiMessageCircle, FiChevronLeft, FiChevronRight, FiInbox, FiClock, FiCheckCircle, FiXCircle, FiLoader, FiEye, FiRotateCcw, FiCalendar, FiX, FiTrash2 } from 'react-icons/fi';
import { getDeliveryReport, retryFailedMessages, cancelScheduledCampaign, deleteWhatsAppCampaign, DeliveryReport, RecipientStatus } from '../../lib/api';
import toast from 'react-hot-toast';

interface Campaign {
  _id: string;
  subject: string;
  provider: string;
  status: string;
  sentCount: number;
  failedCount?: number;
  totalRecipients: number;
  createdAt: string;
  scheduledAt?: string;
  isScheduled?: boolean;
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
  
  // Delivery Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DeliveryReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
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
      case 'scheduled':
        return { 
          bg: 'bg-purple-500/20', 
          text: 'text-purple-400', 
          border: 'border-purple-500/30',
          icon: FiCalendar 
        };
      case 'cancelled':
        return { 
          bg: 'bg-slate-500/20', 
          text: 'text-slate-400', 
          border: 'border-slate-500/30',
          icon: FiX 
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
  
  // View delivery report
  const handleViewReport = async (campaignId: string) => {
    setLoadingReport(true);
    try {
      const response = await getDeliveryReport(campaignId);
      setSelectedReport(response.data);
      setShowReportModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load delivery report');
    } finally {
      setLoadingReport(false);
    }
  };
  
  // Retry failed messages
  const handleRetry = async (campaignId: string) => {
    setRetryingId(campaignId);
    try {
      const response = await retryFailedMessages(campaignId);
      toast.success(response.data.message);
      onRefresh?.();
      if (showReportModal && selectedReport?.campaignId === campaignId) {
        handleViewReport(campaignId); // Refresh the report
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to retry messages');
    } finally {
      setRetryingId(null);
    }
  };
  
  // Cancel scheduled campaign
  const handleCancelScheduled = async (campaignId: string) => {
    setCancellingId(campaignId);
    try {
      await cancelScheduledCampaign(campaignId);
      toast.success('Scheduled campaign cancelled and deleted');
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel campaign');
    } finally {
      setCancellingId(null);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }
    
    setDeletingId(campaignId);
    try {
      await deleteWhatsAppCampaign(campaignId);
      toast.success('Campaign deleted successfully');
      onRefresh?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete campaign');
    } finally {
      setDeletingId(null);
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
                            {campaign.failedCount ? ` (${campaign.failedCount} failed)` : ''}
                          </span>
                        </div>
                        
                        {/* Action Buttons - Mobile */}
                        <div className="flex items-center gap-2 flex-wrap">
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
                          {campaign.status === 'scheduled' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCancelScheduled(campaign._id)}
                              disabled={cancellingId === campaign._id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {cancellingId === campaign._id ? (
                                <FiLoader className="w-3 h-3 animate-spin" />
                              ) : (
                                <FiX className="w-3 h-3" />
                              )}
                              Cancel
                            </motion.button>
                          )}
                          {campaign.status === 'cancelled' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteCampaign(campaign._id)}
                              disabled={deletingId === campaign._id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {deletingId === campaign._id ? (
                                <FiLoader className="w-3 h-3 animate-spin" />
                              ) : (
                                <FiTrash2 className="w-3 h-3" />
                              )}
                              Delete
                            </motion.button>
                          )}
                          {(campaign.status === 'completed' || campaign.status === 'failed') && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleViewReport(campaign._id)}
                                disabled={loadingReport}
                                className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md text-xs font-medium transition-colors"
                              >
                                <FiEye className="w-3 h-3" />
                                Report
                              </motion.button>
                              {campaign.failedCount && campaign.failedCount > 0 && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleRetry(campaign._id)}
                                  disabled={retryingId === campaign._id}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  {retryingId === campaign._id ? (
                                    <FiLoader className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <FiRotateCcw className="w-3 h-3" />
                                  )}
                                  Retry
                                </motion.button>
                              )}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteCampaign(campaign._id)}
                                disabled={deletingId === campaign._id}
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                {deletingId === campaign._id ? (
                                  <FiLoader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FiTrash2 className="w-3 h-3" />
                                )}
                                Delete
                              </motion.button>
                            </>
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
                          <div className="flex items-center gap-2 flex-wrap">
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
                            {campaign.status === 'scheduled' && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCancelScheduled(campaign._id)}
                                disabled={cancellingId === campaign._id}
                                className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                {cancellingId === campaign._id ? (
                                  <FiLoader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FiX className="w-3 h-3" />
                                )}
                                Cancel
                              </motion.button>
                            )}
                            {campaign.status === 'cancelled' && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteCampaign(campaign._id)}
                                disabled={deletingId === campaign._id}
                                className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                {deletingId === campaign._id ? (
                                  <FiLoader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FiTrash2 className="w-3 h-3" />
                                )}
                              </motion.button>
                            )}
                            {(campaign.status === 'completed' || campaign.status === 'failed') && (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleViewReport(campaign._id)}
                                  className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md text-xs font-medium transition-colors"
                                >
                                  <FiEye className="w-3 h-3" />
                                </motion.button>
                                {campaign.failedCount && campaign.failedCount > 0 && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleRetry(campaign._id)}
                                    disabled={retryingId === campaign._id}
                                    className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                                  >
                                    {retryingId === campaign._id ? (
                                      <FiLoader className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <FiRotateCcw className="w-3 h-3" />
                                    )}
                                  </motion.button>
                                )}
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleDeleteCampaign(campaign._id)}
                                  disabled={deletingId === campaign._id}
                                  className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  {deletingId === campaign._id ? (
                                    <FiLoader className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <FiTrash2 className="w-3 h-3" />
                                  )}
                                </motion.button>
                              </>
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
      
      {/* Delivery Report Modal */}
      <AnimatePresence>
        {showReportModal && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl border border-slate-700 max-h-[85vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Delivery Report</h3>
                  <p className="text-sm text-slate-400">{selectedReport.subject}</p>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <FiX className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{selectedReport.stats.total}</p>
                  <p className="text-xs text-slate-400">Total</p>
                </div>
                <div className="bg-emerald-500/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{selectedReport.stats.sent}</p>
                  <p className="text-xs text-slate-400">Sent</p>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{selectedReport.stats.delivered}</p>
                  <p className="text-xs text-slate-400">Delivered</p>
                </div>
                <div className="bg-red-500/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{selectedReport.stats.failed}</p>
                  <p className="text-xs text-slate-400">Failed</p>
                </div>
              </div>
              
              {/* Failed Errors Summary */}
              {Object.keys(selectedReport.failedByError).length > 0 && (
                <div className="mb-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <h4 className="text-sm font-medium text-red-400 mb-2">Failure Reasons</h4>
                  <div className="space-y-1">
                    {Object.entries(selectedReport.failedByError).map(([error, count]) => (
                      <div key={error} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 truncate flex-1">{error}</span>
                        <span className="text-red-400 ml-2">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recipients List */}
              <div className="flex-1 overflow-y-auto">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Recipients</h4>
                <div className="space-y-2">
                  {selectedReport.recipients.map((recipient, idx) => {
                    const statusColors = {
                      pending: 'bg-amber-500/20 text-amber-400',
                      sent: 'bg-blue-500/20 text-blue-400',
                      delivered: 'bg-emerald-500/20 text-emerald-400',
                      failed: 'bg-red-500/20 text-red-400'
                    };
                    return (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                            {recipient.name ? recipient.name[0].toUpperCase() : '#'}
                          </div>
                          <div>
                            <p className="text-sm text-white">{recipient.name || recipient.phone}</p>
                            <p className="text-xs text-slate-500">{recipient.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[recipient.status]}`}>
                            {recipient.status}
                          </span>
                          {recipient.retryCount && recipient.retryCount > 0 && (
                            <span className="text-xs text-slate-500">
                              {recipient.retryCount} retries
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700">
                {selectedReport.stats.failed > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRetry(selectedReport.campaignId)}
                    disabled={retryingId === selectedReport.campaignId}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {retryingId === selectedReport.campaignId ? (
                      <FiLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiRotateCcw className="w-4 h-4" />
                    )}
                    Retry {selectedReport.stats.failed} Failed
                  </motion.button>
                )}
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
