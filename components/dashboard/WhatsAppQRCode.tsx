'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { FiCheckCircle, FiWifi, FiWifiOff, FiRefreshCw, FiSmartphone, FiAlertCircle, FiZap, FiLoader, FiPower } from 'react-icons/fi';
import { initWhatsAppConnection, getWhatsAppStatus, disconnectWhatsApp } from '@/lib/api';

interface WhatsAppQRCodeProps {
  onConnectionChange?: (connected: boolean) => void;
}

export default function WhatsAppQRCode({ onConnectionChange }: WhatsAppQRCodeProps) {
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'authenticating' | 'connected'>('disconnected');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await getWhatsAppStatus();
      const wasConnected = status === 'connected';
      
      if (response.data.connected) {
        setStatus('connected');
        setQrCodeData(null);
        setError(null);
        setScanning(false);
        if (response.data.userInfo) {
          setConnectedDevice(response.data.userInfo);
        }
        if (scanTimeout) {
          clearTimeout(scanTimeout);
          setScanTimeout(null);
        }
        
        if (!wasConnected && onConnectionChange) {
          onConnectionChange(true);
        }
      } else if (response.data.qrCode) {
        if (status === 'connected') {
          setConnectionAttempts(prev => prev + 1);
        }
        setQrCodeData(response.data.qrCode);
        setStatus('authenticating');
        
        if (wasConnected && onConnectionChange) {
          onConnectionChange(false);
        }
      } else {
        if (wasConnected) {
          setConnectionAttempts(prev => prev + 1);
          if (onConnectionChange) {
            onConnectionChange(false);
          }
        }
        setStatus('disconnected');
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err);
    }
  }, [status, onConnectionChange, scanTimeout]);

  const debugQRCode = () => {
    console.log("QR Code Data:", qrCodeData);
    console.log("Data length:", qrCodeData?.length);
    console.log("Status:", status);
    console.log("Scanning:", scanning);
    console.log("Connection attempts:", connectionAttempts);
  };

  useEffect(() => {
    if (qrCodeData && status === 'authenticating' && !scanning) {
      setScanning(true);
      
      const timeout = setTimeout(() => {
        setScanning(false);
        setQrCodeData(null);
        setError("QR code scan timeout. Please try again.");
      }, 120000);
      
      setScanTimeout(timeout);
    }
  }, [qrCodeData, scanning, scanTimeout, status, connectionAttempts]);

  const initConnection = async () => {
    setLoading(true);
    setError(null);
    setQrCodeData(null);
    setAttemptCount(0);
    
    try {
      await initWhatsAppConnection();
      // Start polling directly after init
      startPolling();
    } catch (err) {
      console.error('Failed to initialize WhatsApp connection:', err);
      setError('Failed to connect to WhatsApp');
      setLoading(false);
    }
  };

  const startPolling = () => {
    let attempts = 0;
    const maxAttempts = 20;
    
    const poll = async () => {
      try {
        const response = await getWhatsAppStatus();
        console.log('Poll response:', response.data);
        
        if (response.data.qrCode) {
          console.log('QR Code received! Length:', response.data.qrCode.length);
          setQrCodeData(response.data.qrCode);
          setStatus('authenticating');
          setLoading(false);
          setError(null);
          return; // Stop polling
        } else if (response.data.connected) {
          setStatus('connected');
          setLoading(false);
          return; // Stop polling
        }
        
        attempts++;
        setAttemptCount(attempts);
        console.log(`Polling attempt ${attempts}/${maxAttempts}, authenticating: ${response.data.authenticating}`);
        
        if (attempts >= maxAttempts) {
          setError("No QR code was generated after multiple attempts. Please check if backend is running.");
          setLoading(false);
          return;
        }
        
        // Continue polling
        setTimeout(poll, 2000);
      } catch (err) {
        console.error("Error checking for QR code:", err);
        setError("Error getting QR code from server");
        setLoading(false);
      }
    };
    
    // Start first poll after a short delay to let backend initialize
    setTimeout(poll, 1000);
  };
  
  const forceReconnect = async () => {
    setScanning(false);
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      setScanTimeout(null);
    }
    await initConnection();
  };

  useEffect(() => {
    fetchStatus();
    
    const interval = setInterval(() => {
      if (scanning) {
        fetchStatus();
      } else {
        fetchStatus();
      }
    }, scanning ? 2000 : 10000);
    
    return () => clearInterval(interval);
  }, [fetchStatus, scanning]);

  useEffect(() => {
    return () => {
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, [scanTimeout]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 sm:p-6 lg:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          status === 'connected' ? 'bg-emerald-500/20' : 'bg-slate-800'
        }`}>
          {status === 'connected' ? (
            <FiWifi className="w-5 h-5 text-emerald-400" />
          ) : (
            <FiWifiOff className="w-5 h-5 text-slate-400" />
          )}
        </div>
        <h2 className="text-xl font-semibold text-white">WhatsApp Connection</h2>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center py-12">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-slate-700"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-6 text-slate-400">
            {attemptCount > 0 ? `Checking for QR code (Attempt ${attemptCount}/20)...` : 'Initializing...'}
          </p>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6"
        >
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400">{error}</p>
              <div className="flex gap-3 mt-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  onClick={() => initConnection()}
                >
                  Try Again
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                  onClick={forceReconnect}
                >
                  Force Reconnect
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6 ${
            status === 'connected' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : status === 'authenticating'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {status === 'connected' ? (
              <FiCheckCircle className="w-4 h-4" />
            ) : status === 'authenticating' ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <FiWifiOff className="w-4 h-4" />
            )}
            <span className="font-medium">
              {status === 'connected' 
                ? 'Connected' 
                : status === 'authenticating'
                  ? 'Authenticating'
                  : 'Disconnected'}
            </span>
          </div>
          
          {status === 'connected' && connectionAttempts > 0 && (
            <div className="text-sm text-amber-400 mb-4 flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4" />
              <span>
                Connection has been reestablished {connectionAttempts} time{connectionAttempts > 1 ? 's' : ''}.
                {connectionAttempts > 2 && ' Connection may be unstable.'}
              </span>
            </div>
          )}

          {status === 'connected' && connectionAttempts > 2 && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mb-6 px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors flex items-center gap-2"
              onClick={() => {
                setConnectionAttempts(0);
                forceReconnect();
              }}
            >
              <FiZap className="w-4 h-4" />
              Stabilize Connection
            </motion.button>
          )}

          <AnimatePresence mode="wait">
            {status === 'connected' ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                  <FiCheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <p className="text-lg text-white font-medium mb-2">WhatsApp Connected!</p>
                {connectedDevice && (
                  <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 mx-auto w-fit">
                    <FiSmartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300">+{connectedDevice.split(':')[0]}</span>
                  </div>
                )}
                <p className="text-slate-400 mb-8">Ready to send messages</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2 justify-center"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await disconnectWhatsApp();
                        setStatus('disconnected');
                        setConnectedDevice(null);
                        setConnectionAttempts(0);
                        if (onConnectionChange) onConnectionChange(false);
                      } catch (err) {
                        console.error('Failed to disconnect:', err);
                        setError('Failed to disconnect');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <FiPower className="w-4 h-4" />
                    Disconnect
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 justify-center"
                    onClick={() => initConnection()}
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Reconnect
                  </motion.button>
                </div>
              </motion.div>
            ) : qrCodeData ? (
              <motion.div
                key="qrcode"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <p className="text-slate-400 mb-6">Scan this QR code with your WhatsApp mobile app</p>
                
                <div className="inline-block p-4 sm:p-6 bg-white rounded-2xl shadow-xl shadow-black/20 mb-6">
                  <QRCodeSVG 
                    value={qrCodeData}
                    size={200}
                    level="H"
                    includeMargin={false}
                    className="w-48 h-48 sm:w-60 sm:h-60"
                  />
                </div>
                
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 mb-6 px-2">
                  <FiSmartphone className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">WhatsApp → Menu → Linked devices → Link a device</span>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                    onClick={fetchStatus}
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Refresh Status
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                    onClick={debugQRCode}
                  >
                    Debug QR
                  </motion.button>
                </div>
                
                {scanning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 py-3 px-4 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg inline-flex items-center gap-2"
                  >
                    <FiLoader className="w-4 h-4 animate-spin" />
                    QR code scanned! Establishing connection...
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="disconnected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-6">
                  <FiWifiOff className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-slate-400 mb-6">No QR code available. Initialize the connection to get started.</p>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={initConnection}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 mx-auto font-medium"
                >
                  <FiWifi className="w-5 h-5" />
                  Initialize WhatsApp Connection
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
