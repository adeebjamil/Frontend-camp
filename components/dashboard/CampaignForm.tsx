import React, { useState, useRef } from 'react';
import { sendCampaign } from '../../lib/api';
import toast from 'react-hot-toast';

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
      
      // Reset form
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input 
          type="text" 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
          placeholder="Email subject" 
          value={subject}
          onChange={e => setSubject(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message (HTML supported)</label>
        <textarea 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
          rows={6}
          placeholder="Enter your message here. HTML is supported."
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
        />
      </div>
      
      {/* Poster Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Poster Image</label>
        <div 
          className={`border-2 ${posterImage ? 'border-blue-400' : 'border-dashed border-gray-300'} rounded-md p-4 text-center cursor-pointer hover:border-blue-400 transition-colors`}
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
                className="h-40 object-contain mb-2" 
              />
              <p className="text-sm text-blue-600">{posterImage.name}</p>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setPosterImage(null);
                }}
                className="mt-2 text-xs text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-blue-600 font-medium">Click to upload poster image</p>
              <p className="text-xs text-gray-500">or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Service</label>
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-center">
          <div className="flex items-center">
            <input 
              type="radio" 
              id="brevo" 
              name="emailService" 
              className="h-4 w-4 text-blue-600" 
              checked 
              readOnly 
            />
            <label htmlFor="brevo" className="ml-2 text-sm text-gray-700">
              Using Brevo <span className="text-blue-600">(300 emails/day)</span>
            </label>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email List (CSV)</label>
        <div 
          className={`border-2 ${csvFile ? 'border-blue-400' : 'border-dashed border-gray-300'} rounded-md p-6 text-center cursor-pointer hover:border-blue-400 transition-colors`}
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
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-blue-600">{csvFile.name}</p>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setCsvFile(null);
                }}
                className="mt-2 text-xs text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-blue-600 font-medium">Click to upload</p>
              <p className="text-xs text-gray-500">or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">CSV file with email addresses</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end pt-2">
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors disabled:opacity-75"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
              <span>Sending...</span>
            </div>
          ) : (
            'Send Campaign'
          )}
        </button>
      </div>
    </form>
  );
}