import React, { useState, useRef } from 'react';
import { sendCampaign } from '../../lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface CampaignFormProps {
  onSuccess?: () => void;
}

export default function CampaignForm({ onSuccess }: CampaignFormProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [posterImage, setPosterImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const csvInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !message || !csvFile) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await sendCampaign({
        subject,
        message,
        provider: 'brevo',
        csvFile,
        posterImage: posterImage || undefined
      });
      
      toast.success('Campaign sent successfully!');
      
      setSubject('');
      setMessage('');
      setCsvFile(null);
      setPosterImage(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
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
  
  const handleCsvDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setCsvFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setPosterImage(file);
      } else {
        toast.error('Please upload an image file');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="card p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Subject <span className="text-red-400">*</span>
            </label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter email subject" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>
          
          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Message <span className="text-red-400">*</span>
              <span className="text-dark-500 font-normal ml-2">(HTML supported)</span>
            </label>
            <textarea 
              className="input-field min-h-[180px] resize-y" 
              placeholder="Enter your message here. HTML is supported for rich formatting."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>
          
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Poster Image Upload */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Poster Image
                <span className="text-dark-500 font-normal ml-2">(Optional)</span>
              </label>
              <div 
                className={`border-2 ${posterImage ? 'border-primary-500 bg-primary-500/5' : 'border-dashed border-dark-600'} 
                  rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 transition-all duration-300 group`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleImageDrop}
                onClick={() => imageInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setPosterImage(e.target.files[0]);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />
                
                {posterImage ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={URL.createObjectURL(posterImage)} 
                      alt="Preview" 
                      className="h-32 object-contain rounded-lg mb-3" 
                    />
                    <p className="text-sm text-primary-400 font-medium truncate max-w-full">{posterImage.name}</p>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPosterImage(null);
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
                    <div className="w-14 h-14 rounded-xl bg-dark-700 flex items-center justify-center mb-3 group-hover:bg-primary-500/20 transition-colors">
                      <svg className="w-7 h-7 text-dark-400 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-primary-400 font-medium">Upload Image</p>
                    <p className="text-xs text-dark-500 mt-1">or drag and drop</p>
                    <p className="text-xs text-dark-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* CSV Upload */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Email List <span className="text-red-400">*</span>
                <span className="text-dark-500 font-normal ml-2">(CSV)</span>
              </label>
              <div 
                className={`border-2 ${csvFile ? 'border-primary-500 bg-primary-500/5' : 'border-dashed border-dark-600'} 
                  rounded-xl p-6 text-center cursor-pointer hover:border-primary-500 transition-all duration-300 group`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleCsvDrop}
                onClick={() => csvInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={csvInputRef}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setCsvFile(e.target.files[0]);
                    }
                  }}
                  accept=".csv"
                  className="hidden"
                />
                
                {csvFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center mb-3">
                      <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-primary-400 font-medium truncate max-w-full">{csvFile.name}</p>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCsvFile(null);
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
                    <div className="w-14 h-14 rounded-xl bg-dark-700 flex items-center justify-center mb-3 group-hover:bg-primary-500/20 transition-colors">
                      <svg className="w-7 h-7 text-dark-400 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-primary-400 font-medium">Upload CSV</p>
                    <p className="text-xs text-dark-500 mt-1">or drag and drop</p>
                    <p className="text-xs text-dark-500 mt-1">CSV with email column</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Service Info */}
          <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Email Service: Brevo</p>
                <p className="text-xs text-dark-400">Up to 300 emails/day included</p>
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
              className="btn-primary flex items-center gap-2 px-8 py-3"
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Sending Campaign...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send Campaign</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
