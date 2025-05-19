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
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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
  const { user } = useAuth();
  const [emailCampaigns, setEmailCampaigns] = useState<Campaign[]>([]);
  const [whatsappCampaigns, setWhatsappCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('form');

  // Fetch appropriate campaigns when tab changes
  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchEmailCampaigns();
    } else if (activeTab === 'whatsapp-history') {
      fetchWhatsAppCampaigns();
    }
    
    // Set up polling to refresh campaign status every 10 seconds when viewing history
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
    if (showLoading) {
      setIsLoading(true);
    }
    
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
    if (showLoading) {
      setIsLoading(true);
    }
    
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

  // Handler for when email campaign is created successfully
  const handleEmailCampaignSuccess = () => {
    toast.success('Email campaign submitted successfully!');
    fetchEmailCampaigns();
    setActiveTab('campaigns');
  };
  
  // Handler for when WhatsApp campaign is created successfully
  const handleWhatsAppCampaignSuccess = () => {
    toast.success('WhatsApp campaign created successfully!');
    fetchWhatsAppCampaigns();
    setActiveTab('whatsapp-history');
  };

  return (
    <>
      {/* Sidebar */}
      <div className="w-[240px] flex-shrink-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 bg-[#edf5fb] overflow-auto">
        <header className="bg-white py-4 px-8 flex justify-between items-center shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-800">
            {activeTab === 'form' && 'Create Email Campaign'}
            {activeTab === 'campaigns' && 'Email Campaign History'}
            {activeTab === 'whatsapp-form' && 'Create WhatsApp Campaign'}
            {activeTab === 'whatsapp-history' && 'WhatsApp Campaign History'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">{user?.username || 'adeeb'}</span>
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <span className="font-bold">{(user?.username || 'A').charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>
        
        <motion.div 
          className="p-6"
          initial="hidden"
          animate="visible"
          key={activeTab}
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
        </motion.div>
      </div>
    </>
  );
}