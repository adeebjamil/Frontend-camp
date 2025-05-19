import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

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

  return (
    <div className="bg-[#10192d] text-white h-screen w-full flex flex-col">
      {/* Logo area */}
      <div className="p-5 border-b border-gray-700 flex items-center">
        <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center mr-3">
          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-lg font-semibold">Campaign Dashboard</span>
      </div>
      
      {/* User profile */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-xl font-bold">{user?.username?.charAt(0).toUpperCase() || 'A'}</span>
        </div>
        <div>
          <p className="font-medium">{user?.username || 'adeeb'}</p>
          <p className="text-xs text-gray-400">Admin</p>
        </div>
      </div>
      
      <div className="mt-3">
        {/* Email Campaign Section */}
        <p className="uppercase text-xs font-semibold text-gray-500 px-5 mb-2">EMAIL CAMPAIGNS</p>
        
        <div className="px-4">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center w-full px-4 py-3 ${
              activeTab === 'form'
                ? 'bg-blue-600 text-white rounded-md'
                : 'text-gray-300 hover:bg-gray-800/50 rounded-md'
            } transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Email Campaign
          </button>
          
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex items-center w-full px-4 py-3 mt-2 ${
              activeTab === 'campaigns'
                ? 'bg-blue-600 text-white rounded-md'
                : 'text-gray-300 hover:bg-gray-800/50 rounded-md'
            } transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Email History
          </button>
        </div>
        
        {/* WhatsApp Campaign Section */}
        <p className="uppercase text-xs font-semibold text-gray-500 px-5 mb-2 mt-6">WHATSAPP CAMPAIGNS</p>
        
        <div className="px-4">
          <button
            onClick={() => setActiveTab('whatsapp-form')}
            className={`flex items-center w-full px-4 py-3 ${
              activeTab === 'whatsapp-form'
                ? 'bg-green-600 text-white rounded-md'
                : 'text-gray-300 hover:bg-gray-800/50 rounded-md'
            } transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New WhatsApp Campaign
          </button>
          
          <button
            onClick={() => setActiveTab('whatsapp-history')}
            className={`flex items-center w-full px-4 py-3 mt-2 ${
              activeTab === 'whatsapp-history'
                ? 'bg-green-600 text-white rounded-md'
                : 'text-gray-300 hover:bg-gray-800/50 rounded-md'
            } transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            WhatsApp History
          </button>

          <button
            onClick={() => setActiveTab('whatsapp-connect')}
            className={`flex items-center w-full px-4 py-3 mt-2 ${
              activeTab === 'whatsapp-connect'
                ? 'bg-green-600 text-white rounded-md'
                : 'text-gray-300 hover:bg-gray-800/50 rounded-md'
            } transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Connect WhatsApp
          </button>
        </div>
      </div>
      
      {/* Logout button */}
      <div className="mt-auto mb-5 px-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
        >
          <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;