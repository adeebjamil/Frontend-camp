"use client";

import React, { useState, useRef, useEffect } from 'react';
import { sendWhatsAppCampaign, generateAIMessage, getTemplates, createTemplate, Template } from '../../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface WhatsAppCampaignFormProps {
  onSuccess?: () => void;
}

// Quick AI prompt suggestions
const quickPrompts = [
  { icon: '🎉', label: 'Product Launch', prompt: 'Announce a new product launch with excitement' },
  { icon: '🔥', label: 'Flash Sale', prompt: 'Create urgency for a limited time flash sale offer' },
  { icon: '👋', label: 'Welcome', prompt: 'Welcome a new customer and introduce our services' },
  { icon: '🎁', label: 'Special Offer', prompt: 'Share an exclusive discount or special offer' },
  { icon: '📢', label: 'Announcement', prompt: 'Make an important business announcement' },
  { icon: '🙏', label: 'Thank You', prompt: 'Thank customers for their support and loyalty' },
  { icon: '📅', label: 'Event Invite', prompt: 'Invite customers to an upcoming event or webinar' },
  { icon: '⭐', label: 'Feedback', prompt: 'Ask customers for feedback or reviews' },
];

export default function WhatsAppCampaignForm({ onSuccess }: WhatsAppCampaignFormProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [links, setLinks] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [posterImage, setPosterImage] = useState<File | null>(null);
  const [pdfCatalog, setPdfCatalog] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // AI Generator state - Simplified
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'professional' | 'friendly' | 'casual' | 'formal'>('friendly');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Templates state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  
  const csvInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);
  
  const loadTemplates = async () => {
    try {
      const response = await getTemplates('whatsapp');
      // Handle the nested data structure from API response
      const templatesData = response.data?.data || [];
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };
  
  // Insert variable placeholder into message
  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + `{${variable}}` + message.substring(end);
      setMessage(newMessage);
    } else {
      setMessage(message + `{${variable}}`);
    }
  };
  
  // Quick generate with preset prompt
  const handleQuickGenerate = async (prompt: string) => {
    setAiPrompt(prompt);
    setIsGenerating(true);
    try {
      const response = await generateAIMessage({
        type: 'whatsapp',
        purpose: prompt,
        tone: aiTone,
        length: 'medium',
        includeEmoji: true
      });
      
      const responseData = response.data;
      const generatedData = responseData?.data || responseData;
      
      if (generatedData?.message) {
        setMessage(generatedData.message);
        toast.success('Message generated!');
        setShowAIPanel(false);
        setAiPrompt('');
      }
    } catch (error: any) {
      toast.error('Failed to generate message');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generate AI message with custom prompt
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe what you want to say');
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await generateAIMessage({
        type: 'whatsapp',
        purpose: aiPrompt,
        tone: aiTone,
        length: 'medium',
        includeEmoji: true
      });
      
      const responseData = response.data;
      const generatedData = responseData?.data || responseData;
      
      if (generatedData?.message) {
        setMessage(generatedData.message);
        toast.success('Message generated successfully!');
        setShowAIPanel(false);
        setAiPrompt('');
      } else {
        toast.error('No message was generated');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate message');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Apply template
  const applyTemplate = (template: Template) => {
    setMessage(template.message);
    if (template.subject) {
      setSubject(template.subject);
    }
    setShowTemplateModal(false);
    toast.success(`Template "${template.name}" applied!`);
  };
  
  // Save as template
  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !message.trim()) {
      toast.error('Template name and message are required');
      return;
    }
    
    try {
      await createTemplate({
        name: templateName,
        type: 'whatsapp',
        message,
        subject,
        category: templateCategory || 'General'
      });
      
      toast.success('Template saved successfully!');
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateCategory('');
      loadTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !message || !csvFile) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate scheduling if enabled
    let scheduledAt: string | undefined;
    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        toast.error('Please select both date and time for scheduling');
        return;
      }
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        toast.error('Scheduled time must be in the future');
        return;
      }
      scheduledAt = scheduledDateTime.toISOString();
    }
    
    // Combine message with links
    let finalMessage = message;
    if (links.trim()) {
      const linkList = links.split('\n').filter(l => l.trim());
      if (linkList.length > 0) {
        finalMessage = message + '\n\n' + linkList.join('\n');
      }
    }
    
    setIsLoading(true);
    
    try {
      await sendWhatsAppCampaign({
        subject,
        message: finalMessage,
        provider: 'baileys',
        csvFile,
        posterImage: posterImage || undefined,
        pdfCatalog: pdfCatalog || undefined,
        video: video || undefined,
        scheduledAt,
        links: links.trim() || undefined
      });
      
      toast.success(isScheduled ? 'WhatsApp campaign scheduled successfully!' : 'WhatsApp campaign created successfully!');
      
      setSubject('');
      setMessage('');
      setLinks('');
      setCsvFile(null);
      setPosterImage(null);
      setPdfCatalog(null);
      setVideo(null);
      setIsScheduled(false);
      setScheduledDate('');
      setScheduledTime('');
      
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-medium text-dark-300">
                Message <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  Templates
                </button>
                <button
                  type="button"
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    showAIPanel 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  ✨ AI Generate
                </button>
                {message && (
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </button>
                )}
              </div>
            </div>
            
            {/* AI Quick Generate Panel */}
            <AnimatePresence>
              {showAIPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-white">⚡ Quick Generate</span>
                      <span className="text-xs text-dark-400">Click any option or write your own</span>
                    </div>
                    
                    {/* Quick Prompt Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {quickPrompts.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleQuickGenerate(item.prompt)}
                          disabled={isGenerating}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700/50 hover:bg-dark-600 text-dark-300 hover:text-white text-xs transition-all hover:scale-[1.02] disabled:opacity-50"
                        >
                          <span>{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Prompt */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerateAI()}
                          placeholder="Or describe what you want to say... (e.g., 'Remind about pending payment')"
                          className="w-full px-4 py-2.5 rounded-lg bg-dark-700/50 border border-dark-600 text-white placeholder-dark-400 text-sm focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value as any)}
                        className="px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600 text-dark-300 text-sm focus:border-purple-500 focus:outline-none"
                      >
                        <option value="friendly">😊 Friendly</option>
                        <option value="professional">💼 Professional</option>
                        <option value="casual">😎 Casual</option>
                        <option value="formal">📋 Formal</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleGenerateAI}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <textarea 
              className="input-field min-h-[160px] resize-y" 
              placeholder="Enter your WhatsApp message here. Use {name}, {company}, etc. for personalization"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
            
            {/* Variable Placeholders */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-dark-500">Insert variable:</span>
              {['name', 'company', 'email', 'phone'].map(variable => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => insertVariable(variable)}
                  className="text-xs px-2 py-1 rounded bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-emerald-400 transition-colors"
                >
                  {`{${variable}}`}
                </button>
              ))}
              <span className="text-xs text-dark-500 ml-2">• Variables are replaced with CSV data</span>
            </div>
          </div>
          
          {/* Links Section */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Links
              <span className="text-dark-500 font-normal ml-1">(Optional - one per line)</span>
            </label>
            <textarea 
              className="input-field min-h-[80px] resize-y" 
              placeholder="https://example.com&#10;https://shop.example.com/product"
              value={links}
              onChange={e => setLinks(e.target.value)}
            />
            <p className="text-xs text-dark-500 mt-1">Add links to include in your message. They will be appended at the end.</p>
          </div>
          
          {/* Schedule Toggle */}
          <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Schedule Campaign</p>
                  <p className="text-xs text-dark-400">Send at a specific date and time</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={e => setIsScheduled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            <AnimatePresence>
              {isScheduled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* File Uploads Grid */}
          <div className="space-y-4">
            {/* Media Attachments Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-dark-300">
                  Media Attachments
                  <span className="text-dark-500 font-normal ml-1">(Optional - Max 2)</span>
                </label>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  [posterImage, video, pdfCatalog].filter(Boolean).length >= 2 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'bg-dark-700 text-dark-400'
                }`}>
                  {[posterImage, video, pdfCatalog].filter(Boolean).length}/2 selected
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Poster Image */}
                <div className={`${[posterImage, video, pdfCatalog].filter(Boolean).length >= 2 && !posterImage ? 'opacity-50 pointer-events-none' : ''}`}>
                  <UploadZone
                    file={posterImage}
                    onFileChange={(file) => {
                      if ([video, pdfCatalog].filter(Boolean).length >= 2) {
                        toast.error('Maximum 2 attachments allowed');
                        return;
                      }
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
                    title="Image"
                    subtitle="PNG, JPG up to 10MB"
                    isImage={true}
                  />
                </div>
                
                {/* Video */}
                <div className={`${[posterImage, video, pdfCatalog].filter(Boolean).length >= 2 && !video ? 'opacity-50 pointer-events-none' : ''}`}>
                  <UploadZone
                    file={video}
                    onFileChange={(file) => {
                      if ([posterImage, pdfCatalog].filter(Boolean).length >= 2) {
                        toast.error('Maximum 2 attachments allowed');
                        return;
                      }
                      if (file.type.startsWith('video/')) {
                        setVideo(file);
                      } else {
                        toast.error('Please upload a video file');
                      }
                    }}
                    onRemove={() => setVideo(null)}
                    inputRef={videoInputRef as React.RefObject<HTMLInputElement>}
                    accept="video/*"
                    icon="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    title="Video"
                    subtitle="MP4, MOV up to 16MB"
                  />
                </div>
                
                {/* PDF Catalog */}
                <div className={`${[posterImage, video, pdfCatalog].filter(Boolean).length >= 2 && !pdfCatalog ? 'opacity-50 pointer-events-none' : ''}`}>
                  <UploadZone
                    file={pdfCatalog}
                    onFileChange={(file) => {
                      if ([posterImage, video].filter(Boolean).length >= 2) {
                        toast.error('Maximum 2 attachments allowed');
                        return;
                      }
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
                    title="PDF"
                    subtitle="PDF up to 10MB"
                  />
                </div>
              </div>
            </div>
            
            {/* Recipient Data CSV */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Recipient Data <span className="text-red-400">*</span>
                <span className="text-dark-500 font-normal ml-1">(CSV with phone, name, company columns)</span>
              </label>
              <UploadZone
                file={csvFile}
                onFileChange={setCsvFile}
                onRemove={() => setCsvFile(null)}
                inputRef={csvInputRef as React.RefObject<HTMLInputElement>}
                accept=".csv"
                icon="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                title="Upload Recipient CSV"
                subtitle="Columns: phone, name, company, email (for variables)"
              />
              <p className="text-xs text-dark-500 mt-2">
                💡 Variables like {'{name}'}, {'{company}'} in your message will be replaced with CSV data
              </p>
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
          <div className="flex justify-center sm:justify-end pt-4">
            <motion.button 
              type="submit" 
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 sm:px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>{isScheduled ? 'Scheduling Campaign...' : 'Creating Campaign...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isScheduled ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"} />
                  </svg>
                  <span>{isScheduled ? 'Schedule Campaign' : 'Send WhatsApp Campaign'}</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
      
      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTemplateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-800 rounded-2xl p-6 w-full max-w-lg border border-dark-700 max-h-[80vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Message Templates</h3>
                  <p className="text-sm text-dark-400">Choose a template to use</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-dark-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    <p>No templates yet</p>
                    <p className="text-sm mt-1">Save your messages as templates to reuse them</p>
                  </div>
                ) : (
                  templates.map(template => (
                    <div
                      key={template._id}
                      onClick={() => applyTemplate(template)}
                      className="p-4 rounded-xl bg-dark-700/50 hover:bg-dark-700 border border-dark-600 hover:border-emerald-500/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-white group-hover:text-emerald-400 transition-colors">{template.name}</h4>
                          {template.category && (
                            <span className="text-xs px-2 py-0.5 rounded bg-dark-600 text-dark-300 mt-1 inline-block">{template.category}</span>
                          )}
                        </div>
                        <span className="text-xs text-dark-500">Used {template.usageCount}x</span>
                      </div>
                      <p className="text-sm text-dark-400 mt-2 line-clamp-2">{template.message}</p>
                      {template.variables && template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.map(v => (
                            <span key={v} className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{`{${v}}`}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex justify-end mt-6 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 rounded-lg text-dark-300 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Save Template Modal */}
      <AnimatePresence>
        {showSaveTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSaveTemplateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-800 rounded-2xl p-6 w-full max-w-md border border-dark-700"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Save as Template</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="E.g., Welcome Message"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-2">Category (Optional)</label>
                  <input
                    type="text"
                    value={templateCategory}
                    onChange={e => setTemplateCategory(e.target.value)}
                    placeholder="E.g., Sales, Marketing"
                    className="input-field"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-4 py-2 rounded-lg text-dark-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  Save Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
