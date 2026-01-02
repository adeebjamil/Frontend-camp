"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCampaigns, getWhatsAppCampaigns } from '../../lib/api';
import CampaignForm from '../../components/dashboard/CampaignForm';
import CampaignsList from '../../components/dashboard/CampaignsList';
import WhatsAppCampaignForm from '../../components/dashboard/WhatsAppCampaignForm';
import WhatsAppCampaignsList from '../../components/dashboard/WhatsAppCampaignsList';
import Sidebar from '../../components/dashboard/Sidebar';
import WhatsAppQRCode from '../../components/dashboard/WhatsAppQRCode';
import Settings from '../../components/dashboard/Settings';
import toast from 'react-hot-toast';
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

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [emailCampaigns, setEmailCampaigns] = useState<Campaign[]>([]);
  const [whatsappCampaigns, setWhatsappCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('form');

  // Refresh user data on mount
  useEffect(() => {
    refreshUser();
  }, []);

  // Fetch appropriate campaigns when tab changes
  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchEmailCampaigns();
    } else if (activeTab === 'whatsapp-history') {
      fetchWhatsAppCampaigns();
    }
    
    const interval = setInterval(() => {
      if (activeTab === 'campaigns') {
        fetchEmailCampaigns(false);
      } else if (activeTab === 'whatsapp-history') {
        fetchWhatsAppCampaigns(false);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [activeTab]);
  
  const fetchEmailCampaigns = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    
    try {
      const response = await getCampaigns();
      setEmailCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      toast.error('Failed to load email campaigns');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchWhatsAppCampaigns = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    
    try {
      const response = await getWhatsAppCampaigns();
      setWhatsappCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching WhatsApp campaigns:', error);
      toast.error('Failed to load WhatsApp campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailCampaignSuccess = () => {
    toast.success('Email campaign submitted successfully!');
    fetchEmailCampaigns();
    setActiveTab('campaigns');
  };
  
  const handleWhatsAppCampaignSuccess = () => {
    toast.success('WhatsApp campaign created successfully!');
    fetchWhatsAppCampaigns();
    setActiveTab('whatsapp-history');
  };

  const getPageTitle = () => {
    const titles: { [key: string]: { title: string; subtitle: string } } = {
      'form': { title: 'Create Email Campaign', subtitle: 'Design and send email campaigns to your audience' },
      'campaigns': { title: 'Email History', subtitle: 'View and manage your email campaigns' },
      'whatsapp-form': { title: 'Create WhatsApp Campaign', subtitle: 'Send WhatsApp messages to your contacts' },
      'whatsapp-history': { title: 'WhatsApp History', subtitle: 'Track your WhatsApp campaign performance' },
      'whatsapp-connect': { title: 'Connect WhatsApp', subtitle: 'Link your WhatsApp account to send messages' },
      'settings': { title: 'Settings', subtitle: 'Manage your account and preferences' }
    };
    return titles[activeTab] || { title: 'Dashboard', subtitle: '' };
  };

  const pageInfo = getPageTitle();

  return (
    <>
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main content area */}
      <div className="ml-[280px] min-h-screen bg-dark-950">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-30 h-[73px] bg-dark-900/95 backdrop-blur-xl border-b border-dark-700 px-8 flex items-center"
        >
          <div className="flex justify-between items-center w-full">
            {/* Page Title */}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">{pageInfo.title}</h1>
              <p className="text-dark-400 text-sm mt-0.5 truncate">{pageInfo.subtitle}</p>
            </div>
            
            {/* Right Section - pushed to far right */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Quota indicator */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-800/50 border border-dark-700">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">
                    <span className="text-primary-400">{user?.quota?.emailsUsedToday || 0}</span>
                    <span className="text-dark-500">/{user?.quota?.emailsPerDay || 100}</span>
                  </span>
                </div>
                <div className="w-px h-5 bg-dark-600" />
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">
                    <span className="text-emerald-400">{user?.quota?.whatsappUsedToday || 0}</span>
                    <span className="text-dark-500">/{user?.quota?.whatsappPerDay || 50}</span>
                  </span>
                </div>
              </div>

              {/* User profile */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-dark-700">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white leading-tight">
                    {user?.firstName || user?.username || 'User'}
                  </p>
                  <p className="text-xs text-dark-400 leading-tight">{user?.role || 'user'}</p>
                </div>
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-9 h-9 rounded-lg object-cover ring-2 ring-primary-500/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary-500/25">
                    {(user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.header>
        
        {/* Content */}
        <div className="relative p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Email Campaign Form */}
              {activeTab === 'form' && (
                <CampaignForm onSuccess={handleEmailCampaignSuccess} />
              )}
              
              {/* Email Campaign History */}
              {activeTab === 'campaigns' && (
                <CampaignsList 
                  campaigns={emailCampaigns} 
                  isLoading={isLoading}
                  onRefresh={() => fetchEmailCampaigns(false)}
                />
              )}
              
              {/* WhatsApp Campaign Form */}
              {activeTab === 'whatsapp-form' && (
                <WhatsAppCampaignForm onSuccess={handleWhatsAppCampaignSuccess} />
              )}
              
              {/* WhatsApp Campaign History */}
              {activeTab === 'whatsapp-history' && (
                <WhatsAppCampaignsList 
                  campaigns={whatsappCampaigns} 
                  isLoading={isLoading}
                  onRefresh={() => fetchWhatsAppCampaigns(false)}
                />
              )}

              {/* WhatsApp QR Code */}
              {activeTab === 'whatsapp-connect' && (
                <WhatsAppQRCode />
              )}

              {/* Settings */}
              {activeTab === 'settings' && (
                <Settings />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
