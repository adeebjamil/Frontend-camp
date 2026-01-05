'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBell, FiX, FiCheck, FiCheckCircle, FiXCircle, FiAlertTriangle, 
  FiMessageCircle, FiMail, FiCalendar, FiSettings, FiTrash2, FiLoader 
} from 'react-icons/fi';
import { 
  getNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  clearAllNotifications,
  registerFCMToken,
  Notification as NotificationType 
} from '../../lib/api';
import { 
  requestNotificationPermission, 
  onForegroundMessage, 
  isNotificationSupported,
  getNotificationPermissionStatus,
  initializeFirebase
} from '../../lib/firebase';
import toast from 'react-hot-toast';

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check push notification support
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isNotificationSupported();
      setPushSupported(supported);
      
      const permission = getNotificationPermissionStatus();
      setPushEnabled(permission === 'granted');
    };
    checkSupport();
  }, []);

  // Initialize Firebase and listen for messages
  useEffect(() => {
    const setupFirebase = async () => {
      await initializeFirebase();
      
      // Listen for foreground messages
      const unsubscribe = onForegroundMessage((payload) => {
        // Show toast for foreground notifications
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 max-w-sm ${t.visible ? '' : 'hidden'}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-full">
                <FiBell className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white text-sm">{payload.notification?.title}</p>
                <p className="text-slate-400 text-xs mt-1">{payload.notification?.body}</p>
              </div>
              <button onClick={() => toast.dismiss(t.id)} className="text-slate-400 hover:text-white">
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ), { duration: 5000 });

        // Refresh notifications
        fetchUnreadCount();
        if (isOpen) {
          fetchNotifications();
        }
      });

      return unsubscribe;
    };

    setupFirebase();
  }, [isOpen]);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications(1, 10);
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const enablePushNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        await registerFCMToken(token);
        setPushEnabled(true);
        toast.success('Push notifications enabled!');
      } else {
        toast.error('Could not enable push notifications');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast.error('Failed to enable push notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'campaign_completed':
        return <FiCheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'campaign_failed':
        return <FiXCircle className="w-4 h-4 text-red-400" />;
      case 'campaign_scheduled':
        return <FiCalendar className="w-4 h-4 text-purple-400" />;
      case 'whatsapp_connected':
        return <FiMessageCircle className="w-4 h-4 text-emerald-400" />;
      case 'whatsapp_disconnected':
        return <FiAlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <FiBell className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className="relative p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
      >
        <FiBell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    title="Clear all"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Push notification prompt */}
            {pushSupported && !pushEnabled && (
              <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-full">
                    <FiBell className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Enable push notifications</p>
                    <p className="text-xs text-slate-400">Get alerts even when you're away</p>
                  </div>
                  <button
                    onClick={enablePushNotifications}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                  >
                    Enable
                  </button>
                </div>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FiBell className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-4 py-3 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-slate-800/30' : ''
                      }`}
                      onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          notification.type.includes('completed') ? 'bg-emerald-500/20' :
                          notification.type.includes('failed') ? 'bg-red-500/20' :
                          notification.type.includes('scheduled') ? 'bg-purple-500/20' :
                          notification.type.includes('disconnected') ? 'bg-amber-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${
                              notification.read ? 'text-slate-300' : 'text-white'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/30">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to full notifications page if you have one
                  }}
                  className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors py-1"
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
