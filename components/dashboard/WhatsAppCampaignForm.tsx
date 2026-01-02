"use client";

import React, { useState, useRef } from 'react';
import { sendWhatsAppCampaign } from '../../lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface WhatsAppCampaignFormProps {
  onSuccess?: () => void;
}

export default function WhatsAppCampaignForm({ onSuccess }: WhatsAppCampaignFormProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [posterImage, setPosterImage] = useState<File | null>(null);
  const [pdfCatalog, setPdfCatalog] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const csvInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !message || !csvFile) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await sendWhatsAppCampaign({
        subject,
        message,
        provider: 'baileys',
        csvFile,
        posterImage: posterImage || undefined,
        pdfCatalog: pdfCatalog || undefined
      });
      
      toast.success('WhatsApp campaign created successfully!');
      
      setSubject('');
      setMessage('');
      setCsvFile(null);
      setPosterImage(null);
      setPdfCatalog(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating WhatsApp campaign:', error);
      toast.error('Failed to create WhatsApp campaign');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const UploadZone = ({ 
    file, 
    onFileChange, 
    onRemove, 
    inputRef, 
    accept, 
    icon, 
    title, 
    subtitle,
    isImage = false 
  }: {
    file: File | null;
    onFileChange: (file: File) => void;
    onRemove: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    accept: string;
    icon: string;
    title: string;
    subtitle: string;
    isImage?: boolean;
  }) => (
    <div 
      className={`border-2 ${file ? 'border-emerald-500 bg-emerald-500/5' : 'border-dashed border-dark-600'} 
        rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 transition-all duration-300 group`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          onFileChange(e.dataTransfer.files[0]);
        }
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            onFileChange(e.target.files[0]);
          }
        }}
        accept={accept}
        className="hidden"
      />
      
      {file ? (
        <div className="flex flex-col items-center">
          {isImage ? (
            <img 
              src={URL.createObjectURL(file)} 
              alt="Preview" 
              className="h-24 object-contain rounded-lg mb-3" 
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
            </div>
          )}
          <p className="text-sm text-emerald-400 font-medium truncate max-w-full">{file.name}</p>
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="mt-3 text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-xl bg-dark-700 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
            <svg className="w-7 h-7 text-dark-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          </div>
          <p className="text-emerald-400 font-medium">{title}</p>
          <p className="text-xs text-dark-500 mt-1">or drag and drop</p>
          <p className="text-xs text-dark-500 mt-1">{subtitle}</p>
        </div>
      )}
    </div>
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="card p-4 md:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Campaign Name <span className="text-red-400">*</span>
            </label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter campaign name" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>
          
          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea 
              className="input-field min-h-[160px] resize-y" 
              placeholder="Enter your WhatsApp message here"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>
          
          {/* File Uploads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Poster Image */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Poster Image
                <span className="text-dark-500 font-normal ml-1">(Optional)</span>
              </label>
              <UploadZone
                file={posterImage}
                onFileChange={(file) => {
                  if (file.type.startsWith('image/')) {
                    setPosterImage(file);
                  } else {
                    toast.error('Please upload an image file');
                  }
                }}
                onRemove={() => setPosterImage(null)}
                inputRef={imageInputRef as React.RefObject<HTMLInputElement>}
                accept="image/*"
                icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                title="Upload Image"
                subtitle="PNG, JPG up to 10MB"
                isImage={true}
              />
            </div>
            
            {/* PDF Catalog */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                PDF Catalog
                <span className="text-dark-500 font-normal ml-1">(Optional)</span>
              </label>
              <UploadZone
                file={pdfCatalog}
                onFileChange={(file) => {
                  if (file.type === 'application/pdf') {
                    setPdfCatalog(file);
                  } else {
                    toast.error('Please upload a PDF file');
                  }
                }}
                onRemove={() => setPdfCatalog(null)}
                inputRef={pdfInputRef as React.RefObject<HTMLInputElement>}
                accept="application/pdf"
                icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                title="Upload PDF"
                subtitle="PDF up to 10MB"
              />
            </div>
            
            {/* CSV Upload */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Phone Numbers <span className="text-red-400">*</span>
                <span className="text-dark-500 font-normal ml-1">(CSV)</span>
              </label>
              <UploadZone
                file={csvFile}
                onFileChange={setCsvFile}
                onRemove={() => setCsvFile(null)}
                inputRef={csvInputRef as React.RefObject<HTMLInputElement>}
                accept=".csv"
                icon="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                title="Upload CSV"
                subtitle="CSV with phone column"
              />
            </div>
          </div>

          {/* Service Provider Info */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Service: Baileys (WhatsApp Web)</p>
                <p className="text-xs text-dark-400">Make sure WhatsApp is connected before sending</p>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <motion.button 
              type="submit" 
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Creating Campaign...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send WhatsApp Campaign</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
