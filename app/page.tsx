"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ServerStatus component inline for simplicity
function ServerStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  // Optional: Add actual server check logic
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch('/api/health', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
      }
    };
    
    checkServerStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center ml-4 px-3 py-1 rounded-full bg-white shadow-sm border">
      <div className="relative mr-2">
        <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} absolute top-0 left-0 animate-ping opacity-75`}></div>
      </div>
      <span className="text-sm text-gray-600">
        API Server {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Add a small delay to ensure smooth transition
    const redirectTimer = setTimeout(() => {
      router.push('/login');
    }, 2000); // Extended to 2 seconds to see the status indicator
    
    return () => clearTimeout(redirectTimer);
  }, [router]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex items-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-800">Email Dashboard</h1>
        <ServerStatus />
      </div>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-600">Redirecting to login...</p>
    </div>
  );
}