"use client";

import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { uploadAvatar, deleteAvatar } from '../../lib/api';
import { FiCamera, FiTrash2, FiUpload } from 'react-icons/fi';

const Settings: React.FC = () => {
  const { user, updateProfile, changePassword, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await updateProfile(profileForm);
      if (success) {
        await refreshUser();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      await refreshUser();
      toast.success('Profile picture updated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.avatar) return;
    
    setIsUploadingAvatar(true);
    try {
      await deleteAvatar();
      await refreshUser();
      toast.success('Profile picture removed');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'quota', label: 'Usage & Quota', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ];

  const QuotaCard = ({ 
    title, 
    used, 
    total, 
    icon, 
    color 
  }: { 
    title: string; 
    used: number; 
    total: number; 
    icon: string; 
    color: string;
  }) => {
    const percentage = Math.min((used / total) * 100, 100);
    const remaining = total - used;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 card-hover"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-white">{title}</h4>
            <p className="text-sm text-dark-400 mt-1">Daily limit resets at midnight</p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold text-white">{used}</span>
              <span className="text-dark-400 ml-1">/ {total}</span>
            </div>
            <span className={`text-sm font-medium ${percentage > 80 ? 'text-red-400' : percentage > 50 ? 'text-yellow-400' : 'text-primary-400'}`}>
              {percentage.toFixed(0)}% used
            </span>
          </div>
          
          <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full ${
                percentage > 80 ? 'bg-gradient-to-r from-red-500 to-red-400' : 
                percentage > 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                'bg-gradient-to-r from-primary-500 to-primary-400'
              }`}
            />
          </div>
          
          <p className="text-sm text-dark-400">
            <span className="text-primary-400 font-medium">{remaining}</span> remaining for today
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-dark-400">Manage your account settings and preferences</p>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar Navigation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-12 md:col-span-3"
        >
          <div className="card p-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  activeSection === section.id 
                    ? 'bg-primary-500/20 text-primary-400' 
                    : 'text-dark-400 hover:bg-dark-700/50 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                </svg>
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="col-span-12 md:col-span-9">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-6">Profile Information</h3>
              
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-dark-700">
                {/* Avatar Image */}
                <div className="relative group">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Profile" 
                      className="w-28 h-28 rounded-2xl object-cover shadow-lg shadow-primary-500/20 ring-4 ring-dark-700"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-primary-500/25 ring-4 ring-dark-700">
                      {getInitials()}
                    </div>
                  )}
                  
                  {/* Upload overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <label className="cursor-pointer p-3 rounded-full bg-primary-500/20 hover:bg-primary-500/40 transition-all">
                      <FiCamera className="w-6 h-6 text-white" />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={isUploadingAvatar}
                      />
                    </label>
                  </div>

                  {/* Loading spinner */}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 rounded-2xl bg-black/70 flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* User info and actions */}
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-xl font-semibold text-white">{user?.username}</h4>
                  <p className="text-dark-400 mb-3">{user?.email}</p>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 cursor-pointer transition-all text-sm font-medium">
                      <FiUpload className="w-4 h-4" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={isUploadingAvatar}
                      />
                    </label>
                    
                    {user?.avatar && (
                      <button
                        type="button"
                        onClick={handleDeleteAvatar}
                        disabled={isUploadingAvatar}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-50"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-dark-500 mt-3">JPG, PNG or GIF. Max 5MB.</p>
                  
                  <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-sm">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {user?.role === 'admin' ? 'Administrator' : 'User'}
                  </span>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="input-field"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="input-field"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="input-field"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="input-field opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-dark-500 mt-1">Username cannot be changed</p>
                </div>

                <div className="flex justify-end pt-4">
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Changes</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-6">Change Password</h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="input-field"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="input-field"
                    placeholder="Enter new password (min 6 characters)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="input-field"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span>Update Password</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>

              {/* Security Tips */}
              <div className="mt-8 p-4 rounded-xl bg-dark-700/50 border border-dark-600">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Security Tips
                </h4>
                <ul className="text-sm text-dark-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-primary-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Use a combination of letters, numbers, and symbols
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-primary-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Avoid using personal information
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-primary-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Change your password regularly
                  </li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Quota Section */}
          {activeSection === 'quota' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuotaCard
                  title="Email Campaigns"
                  used={user?.quota?.emailsUsedToday || 0}
                  total={user?.quota?.emailsPerDay || 100}
                  icon="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  color="bg-gradient-to-br from-primary-500 to-primary-600"
                />
                <QuotaCard
                  title="WhatsApp Messages"
                  used={user?.quota?.whatsappUsedToday || 0}
                  total={user?.quota?.whatsappPerDay || 50}
                  icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
              </div>

              {/* Quota Info */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">About Your Quota</h3>
                <div className="space-y-4 text-dark-400">
                  <p>Your daily quota limits the number of campaigns you can send each day. This helps ensure reliable delivery and prevents spam.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 rounded-xl bg-dark-700/50 border border-dark-600">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Reset Time</h4>
                          <p className="text-sm">Daily at midnight UTC</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-dark-700/50 border border-dark-600">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Account Type</h4>
                          <p className="text-sm capitalize">{user?.role || 'User'} Plan</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
