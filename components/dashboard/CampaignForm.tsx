import React, { useState, useRef, useEffect } from 'react';
import { sendCampaign, generateEmailContent, generateEmailSubjects, getEmailTemplates, createEmailTemplate, EmailTemplate } from '../../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  // New states for enhanced features
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [aiType, setAiType] = useState('marketing');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedSubjects, setSuggestedSubjects] = useState<string[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('other');
  
  const csvInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);
  
  const loadTemplates = async () => {
    try {
      const response = await getEmailTemplates();
      setTemplates(response.data?.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };
  
  // Apply selected template
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setSubject(template.subject);
      setMessage(template.content);
      toast.success(`Template "${template.name}" applied`);
    }
  };
  
  // AI Generation
  const handleGenerateContent = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI generation');
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await generateEmailContent(aiPrompt, aiTone, aiType);
      if (response.data?.success) {
        setMessage(response.data.data.content);
        if (response.data.data.subject) {
          setSubject(response.data.data.subject);
        }
        toast.success('Email content generated!');
        setShowAIPanel(false);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generate subject lines
  const handleGenerateSubjects = async () => {
    if (!subject.trim() && !message.trim()) {
      toast.error('Please enter a subject or message first');
      return;
    }
    
    setIsGenerating(true);
    try {
      const topic = subject || message.substring(0, 100);
      const response = await generateEmailSubjects(topic);
      if (response.data?.success) {
        setSuggestedSubjects(response.data.data);
        toast.success('Subject lines generated!');
      }
    } catch (error) {
      console.error('Subject generation error:', error);
      toast.error('Failed to generate subjects');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Save as template
  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !subject.trim() || !message.trim()) {
      toast.error('Please fill template name, subject and message');
      return;
    }
    
    try {
      await createEmailTemplate({
        name: templateName,
        subject,
        content: message,
        category: templateCategory
      });
      toast.success('Template saved!');
      setShowSaveTemplate(false);
      setTemplateName('');
      loadTemplates();
    } catch (error) {
      console.error('Save template error:', error);
      toast.error('Failed to save template');
    }
  };
  
  // Insert variable placeholder
  const insertVariable = (variable: string) => {
    setMessage(prev => prev + `{{${variable}}}`);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !message || !csvFile) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate scheduling
    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      toast.error('Please select a date and time for scheduling');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const scheduledAt = isScheduled 
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() 
        : undefined;
      
      await sendCampaign({
        subject,
        message,
        provider: 'brevo',
        csvFile,
        posterImage: posterImage || undefined,
        scheduledAt
      });
      
      toast.success(isScheduled ? 'Campaign scheduled successfully!' : 'Campaign sent successfully!');
      
      setSubject('');
      setMessage('');
      setCsvFile(null);
      setPosterImage(null);
      setIsScheduled(false);
      setScheduledDate('');
      setScheduledTime('');
      setSelectedTemplate('');
      
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
      <div className="card p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          
          {/* Templates & AI Section */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
            {/* Template Selector */}
            <div className="w-full sm:flex-1 sm:min-w-[200px]">
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">📄 Select Template...</option>
                {templates.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            
            {/* AI Generate Button */}
            <motion.button
              type="button"
              onClick={() => setShowAIPanel(!showAIPanel)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                showAIPanel ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="whitespace-nowrap">AI Generate</span>
            </motion.button>
            
            {/* Save Template Button */}
            <motion.button
              type="button"
              onClick={() => setShowSaveTemplate(!showSaveTemplate)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium bg-dark-700 text-dark-300 hover:bg-dark-600 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className="whitespace-nowrap">Save Template</span>
            </motion.button>
          </div>
          
          {/* AI Panel */}
          <AnimatePresence>
            {showAIPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-purple-500/10 border border-primary-500/20"
              >
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Email Generator
                </h4>
                <div className="space-y-3">
                  <textarea
                    placeholder="Describe the email you want to create... (e.g., 'Product launch announcement for our new AI tool')"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    className="input-field min-h-[80px] text-sm"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select value={aiTone} onChange={e => setAiTone(e.target.value)} className="input-field text-sm">
                      <option value="professional">Professional Tone</option>
                      <option value="friendly">Friendly Tone</option>
                      <option value="casual">Casual Tone</option>
                      <option value="formal">Formal Tone</option>
                      <option value="persuasive">Persuasive Tone</option>
                    </select>
                    <select value={aiType} onChange={e => setAiType(e.target.value)} className="input-field text-sm">
                      <option value="marketing">Marketing Email</option>
                      <option value="newsletter">Newsletter</option>
                      <option value="announcement">Announcement</option>
                      <option value="promotional">Promotional</option>
                    </select>
                  </div>
                  <motion.button
                    type="button"
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full py-2 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="spinner" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Email Content
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Save Template Panel */}
          <AnimatePresence>
            {showSaveTemplate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-dark-700/50 border border-dark-600"
              >
                <h4 className="text-sm font-medium text-white mb-3">Save as Template</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Template name"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    className="input-field text-sm"
                  />
                  <select value={templateCategory} onChange={e => setTemplateCategory(e.target.value)} className="input-field text-sm">
                    <option value="marketing">Marketing</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="announcement">Announcement</option>
                    <option value="promotional">Promotional</option>
                    <option value="transactional">Transactional</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <motion.button
                  type="button"
                  onClick={handleSaveTemplate}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-3 w-full py-2 rounded-lg bg-green-500/20 text-green-400 font-medium hover:bg-green-500/30"
                >
                  Save Template
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Subject with AI suggestions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-dark-300">
                Subject <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSubjects}
                disabled={isGenerating}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Suggest
              </button>
            </div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter email subject" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
            {suggestedSubjects.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedSubjects.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setSubject(s); setSuggestedSubjects([]); }}
                    className="text-xs px-3 py-1 rounded-full bg-dark-700 text-dark-300 hover:bg-primary-500/20 hover:text-primary-400"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Message with variable placeholders */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-sm font-medium text-dark-300">
                Message <span className="text-red-400">*</span>
                <span className="text-dark-500 font-normal ml-2">(HTML supported)</span>
              </label>
              <div className="flex flex-wrap gap-1">
                {['name', 'email', 'company', 'first_name'].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="text-xs px-2 py-1 rounded bg-dark-700 text-dark-400 hover:bg-primary-500/20 hover:text-primary-400"
                    title={`Insert {{${v}}}`}
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
            <textarea 
              className="input-field min-h-[180px] resize-y" 
              placeholder="Enter your message here. HTML is supported. Use {{name}}, {{email}}, {{company}} for personalization."
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
          
          {/* Scheduling Section */}
          <div className="p-4 rounded-xl bg-dark-700/50 border border-dark-600">
            <div className="flex items-center gap-3 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 rounded border-dark-500 text-primary-500 focus:ring-primary-500 bg-dark-700"
                />
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Schedule for later
                </span>
              </label>
            </div>
            
            {isScheduled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field text-sm"
                    required={isScheduled}
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="input-field text-sm"
                    required={isScheduled}
                  />
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-center sm:justify-end pt-4">
            <motion.button 
              type="submit" 
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center gap-2 px-6 sm:px-8 py-3 w-full sm:w-auto justify-center"
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>{isScheduled ? 'Scheduling...' : 'Sending Campaign...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isScheduled ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    )}
                  </svg>
                  <span>{isScheduled ? 'Schedule Campaign' : 'Send Campaign'}</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
