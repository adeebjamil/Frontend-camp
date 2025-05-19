"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getWhatsAppStatus, initWhatsAppConnection } from '../../lib/api';
import QRCode from 'react-qr-code';

export default function WhatsAppQRCode() {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connected' | 'authenticating'>('disconnected');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const debugQRCode = () => {
    console.log('Current QR Code Data:', qrCodeData);
    console.log('Current Status:', status);
    console.log('Authentication Status:', status === 'authenticating');
    
    fetchStatus();
  };

  const fetchStatus = useCallback(async () => {
    try {
      const response = await getWhatsAppStatus();
      const { qrCode, connected, authenticating } = response.data;
      
      console.log("WhatsApp status:", { 
        hasQrCode: !!qrCode, 
        qrCodeLength: qrCode ? qrCode.length : 0,
        connected, 
        authenticating 
      });
      
      // If previously connected and now disconnected, increment counter
      if (status === 'connected' && !connected) {
        setConnectionAttempts(prev => prev + 1);
        console.log("Connection lost, attempt count:", connectionAttempts + 1);
        
        // Auto-reconnect if disconnections are happening too frequently
        if (connectionAttempts > 2) {
          console.log("Too many disconnections, trying to stabilize connection...");
          // Don't auto-reconnect here, just show a warning
        }
      }

      if (qrCodeData && !qrCode && !connected) {
        console.log("QR code was scanned, waiting for connection...");
        setScanning(true);
        
        if (!scanTimeout) {
          const timeout = setTimeout(() => {
            console.log("Connection taking too long after QR scan");
            setScanning(false);
            setError("Connection timeout after scanning QR code. Please try again.");
          }, 30000);
          
          setScanTimeout(timeout);
        }
      }
      
      if (connected && scanning) {
        console.log("Connection established after scanning!");
        setScanning(false);
        if (scanTimeout) {
          clearTimeout(scanTimeout);
          setScanTimeout(null);
        }
      }
      
      if (connected) {
        setStatus('connected');
        setScanning(false);
        if (scanTimeout) {
          clearTimeout(scanTimeout);
          setScanTimeout(null);
        }
      } else if (authenticating || qrCode) {
        setStatus('authenticating');
      } else {
        setStatus('disconnected');
      }
      
      if (qrCode) {
        setQrCodeData(qrCode);
        setError(null);
      } else if (connected) {
        setQrCodeData(null);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err);
      setError('Failed to get connection status');
      setLoading(false);
    }
  }, [qrCodeData, scanning, scanTimeout, status, connectionAttempts]);

  const initConnection = async () => {
    setLoading(true);
    setError(null);
    setQrCodeData(null);
    setAttemptCount(0);
    setPollingActive(true);
    
    try {
      console.log("Starting WhatsApp connection initialization");
      await initWhatsAppConnection();
      console.log("WhatsApp connection initialization triggered");
      
      pollForQrCode();
    } catch (err) {
      console.error('Failed to initialize WhatsApp connection:', err);
      setError('Failed to connect to WhatsApp');
      setLoading(false);
      setPollingActive(false);
    }
  };
  
  const pollForQrCode = useCallback(async () => {
    if (!pollingActive) return;
    
    try {
      console.log(`Checking for QR code (attempt ${attemptCount + 1}/15)`);
      const response = await getWhatsAppStatus();
      
      if (response.data.qrCode) {
        setQrCodeData(response.data.qrCode);
        setStatus('authenticating');
        setLoading(false);
        setPollingActive(false);
        setError(null);
        console.log("QR code obtained successfully");
        return;
      } else if (response.data.connected) {
        setStatus('connected');
        setLoading(false);
        setPollingActive(false);
        console.log("Already connected to WhatsApp");
        return;
      }
      
      setAttemptCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 15) {
          setPollingActive(false);
          setError("No QR code was generated after multiple attempts. Please check server logs and try again.");
          setLoading(false);
          console.log("Failed to get QR code after maximum attempts");
          return newCount;
        }
        
        setTimeout(pollForQrCode, 2000);
        return newCount;
      });
    } catch (err) {
      console.error("Error checking for QR code:", err);
      setPollingActive(false);
      setError("Error getting QR code from server");
      setLoading(false);
    }
  }, [attemptCount, pollingActive]);
  
  const forceReconnect = async () => {
    // Clear scanning state
    setScanning(false);
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      setScanTimeout(null);
    }
    
    // Start initialization
    await initConnection();
  };

  useEffect(() => {
    fetchStatus();
    
    const interval = setInterval(() => {
      if (scanning) {
        // Poll more frequently when we're in the scanning state (after QR scan)
        fetchStatus();
      } else if (!pollingActive) {
        // Regular polling when not actively polling for QR
        fetchStatus();
      }
    }, scanning ? 2000 : 10000); // Poll every 2 seconds during scanning, otherwise every 10 seconds
    
    return () => clearInterval(interval);
  }, [fetchStatus, pollingActive, scanning]);

  useEffect(() => {
    return () => {
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, [scanTimeout]);

  return (
    <div className="p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">WhatsApp Connection Status</h2>
      
      {loading ? (
        <div className="flex flex-col items-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">
            {pollingActive ? `Checking for QR code (Attempt ${attemptCount}/15)...` : 'Loading...'}
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-700 mb-4">
          <p>{error}</p>
          <button 
            className="block mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
            onClick={() => initConnection()}
          >
            Try Again
          </button>
          <button 
            className="ml-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
            onClick={forceReconnect}
          >
            Force Reconnect
          </button>
        </div>
      ) : (
        <>
          <div className={`p-3 rounded-md mb-6 ${
            status === 'connected' 
              ? 'bg-green-50 text-green-700' 
              : status === 'authenticating'
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-gray-50 text-gray-700'
          }`}>
            Status: <span className="font-medium">
              {status === 'connected' 
                ? 'Connected' 
                : status === 'authenticating'
                  ? 'Authenticating'
                  : 'Disconnected'}
            </span>
          </div>
          
          {status === 'connected' && (
            <div className="mt-2 text-sm text-gray-600">
              {connectionAttempts > 0 && (
                <p className="text-orange-600">
                  Note: Connection has been reestablished {connectionAttempts} time{connectionAttempts > 1 ? 's' : ''}.
                  {connectionAttempts > 2 && ' Connection may be unstable.'}
                </p>
              )}
            </div>
          )}

          {status === 'connected' && connectionAttempts > 2 && (
            <button 
              className="mt-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200"
              onClick={() => {
                setConnectionAttempts(0);
                forceReconnect();
              }}
            >
              Stabilize Connection
            </button>
          )}

          {status === 'connected' ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-lg">WhatsApp is connected and ready to send messages!</p>
              
              <button 
                className="mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={() => initConnection()}
              >
                Disconnect & Reconnect
              </button>
            </div>
          ) : qrCodeData ? (
            <div className="text-center">
              <p className="mb-4">Scan this QR code with your WhatsApp mobile app:</p>
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                <div style={{ width: "256px", height: "256px", margin: "0 auto" }}>
                  <QRCode 
                    value={qrCodeData}
                    size={256}
                    level="H"
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Open WhatsApp on your phone → Menu (⋮) or Settings → Linked devices → Link a device
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={fetchStatus}
                >
                  Refresh Status
                </button>
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  onClick={debugQRCode}
                >
                  Debug QR Display
                </button>
              </div>
              {scanning && (
                <div className="mt-4 py-2 px-4 bg-blue-50 text-blue-700 rounded-md">
                  <p className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    QR code scanned! Establishing connection...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="mb-4">No QR code available. Initialize the connection to get a QR code.</p>
              <button
                onClick={initConnection}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Initialize WhatsApp Connection
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}