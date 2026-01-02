"use client";

import { useState, useEffect } from 'react';

export default function ServerStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
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