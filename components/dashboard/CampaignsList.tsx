"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Campaign {
  _id: string;
  subject: string;
  provider: string;
  status: string;
  sentCount: number;
  totalRecipients: number;
  createdAt: string;
}

interface CampaignsListProps {
  campaigns: Campaign[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export default function CampaignsList({ campaigns, isLoading, onRefresh }: CampaignsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const results = campaigns.filter(campaign => 
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
      campaign.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCampaigns(results);
    setCurrentPage(1);
  }, [searchTerm, campaigns]);

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          bg: 'bg-primary-500/20', 
          text: 'text-primary-400', 
          border: 'border-primary-500/30',
          icon: 'M5 13l4 4L19 7'
        };
      case 'in-progress':
        return { 
          bg: 'bg-yellow-500/20', 
          text: 'text-yellow-400', 
          border: 'border-yellow-500/30',
          icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        };
      case 'failed':
        return { 
          bg: 'bg-red-500/20', 
          text: 'text-red-400', 
          border: 'border-red-500/30',
          icon: 'M6 18L18 6M6 6l12 12'
        };
      default:
        return { 
          bg: 'bg-dark-600', 
          text: 'text-dark-400', 
          border: 'border-dark-500',
          icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        };
    }
  };
  
  const getProgressPercent = (sent: number, total: number) => {
    if (total === 0) return 0;
    return (sent / total) * 100;
  };

  if (isLoading) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-primary-500/30" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
        </div>
        <p className="text-dark-400">Loading campaigns...</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-12 text-center"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-dark-700 flex items-center justify-center">
          <svg className="w-10 h-10 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
        <p className="text-dark-400 max-w-sm mx-auto">
          Create your first email campaign to start engaging with your audience.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Search and Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search campaigns..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-dark-400">
              {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
            </span>
            {onRefresh && (
              <motion.button 
                onClick={onRefresh}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-xl bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-dark-400 hover:text-primary-400 transition-colors"
                title="Refresh campaigns"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              <AnimatePresence>
                {currentItems.length > 0 ? (
                  currentItems.map((campaign, index) => {
                    const statusConfig = getStatusConfig(campaign.status);
                    const progress = getProgressPercent(campaign.sentCount, campaign.totalRecipients);
                    
                    return (
                      <motion.tr 
                        key={campaign._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-dark-700/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="font-medium text-white">{campaign.subject}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-dark-300 capitalize">{campaign.provider}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusConfig.icon} />
                            </svg>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-dark-400">{campaign.sentCount}/{campaign.totalRecipients}</span>
                              <span className="text-primary-400">{progress.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-dark-400">
                          {formatDate(campaign.createdAt)}
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-dark-400">No campaigns found matching your search.</p>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredCampaigns.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-dark-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-dark-400">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCampaigns.length)} of {filteredCampaigns.length}
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  currentPage === 1 
                    ? 'bg-dark-700 text-dark-500 cursor-not-allowed' 
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentPage === number 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                  }`}
                >
                  {number}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  currentPage === totalPages 
                    ? 'bg-dark-700 text-dark-500 cursor-not-allowed' 
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
