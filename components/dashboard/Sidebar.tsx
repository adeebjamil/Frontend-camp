import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const menuItems = [
    {
      section: 'EMAIL CAMPAIGNS',
      items: [
        {
          id: 'form',
          label: 'New Campaign',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          color: 'primary'
        },
        {
          id: 'campaigns',
          label: 'Email History',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          color: 'primary'
        }
      ]
    },
    {
      section: 'WHATSAPP',
      items: [
        {
          id: 'whatsapp-form',
          label: 'New WhatsApp',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ),
          color: 'emerald'
        },
        {
          id: 'whatsapp-history',
          label: 'WhatsApp History',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
          color: 'emerald'
        },
        {
          id: 'whatsapp-connect',
          label: 'Connect Device',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ),
          color: 'emerald'
        }
      ]
    },
    {
      section: 'ACCOUNT',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          color: 'primary'
        }
      ]
    }
  ];

  const getButtonClasses = (itemId: string, color: string) => {
    const isActive = activeTab === itemId;
    const baseClasses = "flex items-center w-full px-4 py-3 rounded-xl transition-all duration-300 group";
    
    if (isActive) {
      return `${baseClasses} bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25`;
    }
    
    return `${baseClasses} text-dark-300 hover:bg-dark-700/50 hover:text-white`;
  };

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed top-0 left-0 bg-dark-900 border-r border-dark-700 text-white h-screen w-[280px] flex flex-col z-40"
    >
      {/* Logo */}
      <div className="h-[73px] px-5 border-b border-dark-700 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Campaign Tool</h1>
            <p className="text-xs text-dark-400">Marketing Platform</p>
          </div>
        </div>
      </div>
      
      {/* User Profile */}
      <div className="p-4 mx-3 mt-4 rounded-xl bg-dark-800/50 border border-dark-700">
        <div className="flex items-center gap-3">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt="Profile" 
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary-500/30 shadow-lg"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/25">
              {getInitials()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">
              {user?.firstName || user?.username || 'User'}
            </p>
            <p className="text-xs text-dark-400 truncate">{user?.email || 'user@email.com'}</p>
          </div>
        </div>
        
        {/* Quota Mini Display */}
        <div className="mt-3 pt-3 border-t border-dark-600">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dark-400">Daily Quota</span>
            <span className="text-primary-400">
              {user?.quota?.emailsUsedToday || 0}/{user?.quota?.emailsPerDay || 100}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 bg-dark-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(((user?.quota?.emailsUsedToday || 0) / (user?.quota?.emailsPerDay || 100)) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <p className="px-4 mb-2 text-xs font-semibold text-dark-500 uppercase tracking-wider">
              {section.section}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={getButtonClasses(item.id, item.color)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={`mr-3 transition-colors ${activeTab === item.id ? 'text-white' : 'text-dark-400 group-hover:text-primary-400'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-dark-700">
        <motion.button
          onClick={handleLogout}
          className="flex w-full items-center px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 group"
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-5 h-5 mr-3 transition-colors group-hover:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium group-hover:text-red-300">Logout</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
