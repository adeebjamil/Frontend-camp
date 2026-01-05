"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { sendOTP, verifyOTP, checkUsername } from '@/lib/api';
import toast from 'react-hot-toast';

// Password strength checker
const getPasswordStrength = (password: string): { strength: 'weak' | 'moderate' | 'strong'; score: number; label: string; color: string } => {
  let score = 0;
  
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 2) {
    return { strength: 'weak', score: 33, label: 'Weak', color: 'bg-red-500' };
  } else if (score <= 4) {
    return { strength: 'moderate', score: 66, label: 'Moderate', color: 'bg-yellow-500' };
  } else {
    return { strength: 'strong', score: 100, label: 'Strong', color: 'bg-green-500' };
  }
};

export default function Register() {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  // Password strength
  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Debounced username check
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    
    setIsCheckingUsername(true);
    try {
      const response = await checkUsername(username);
      setUsernameAvailable(response.data.available);
      if (!response.data.available) {
        setErrors(prev => ({ ...prev, username: 'Username already taken' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.username === 'Username already taken') {
            delete newErrors.username;
          }
          return newErrors;
        });
      }
    } catch (error: any) {
      setUsernameAvailable(false);
      setErrors(prev => ({ ...prev, username: error.response?.data?.message || 'Username check failed' }));
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  // Handle username change with debounce
  const handleUsernameChange = (value: string) => {
    setFormData(prev => ({ ...prev, username: value }));
    setUsernameAvailable(null);
    
    if (errors.username) {
      setErrors(prev => ({ ...prev, username: '' }));
    }
    
    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }
    
    // Set new timeout for debounced check
    if (value.length >= 3) {
      usernameCheckTimeout.current = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username already taken';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (passwordStrength && passwordStrength.strength === 'weak') {
      newErrors.password = 'Password is too weak. Add uppercase, numbers, or symbols';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSendOTP = async () => {
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
      return;
    }

    setIsSendingOTP(true);
    try {
      await sendOTP(formData.email);
      toast.success('OTP sent to your email!');
      setStep('otp');
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      toast.error('Please enter the complete OTP');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP(formData.email, otpString);
      toast.success('Email verified successfully!');
      setOtpVerified(true);
      setStep('form');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (!otpVerified) {
      toast.error('Please verify your email first');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await register(
        formData.username,
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      if (success) {
        toast.success('Account created successfully!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 300);
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4 py-8 relative overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 mb-4"
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-dark-400">Join Campaign Tool and start sending campaigns</p>
        </div>

        {/* Register Form / OTP Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-8"
        >
          <AnimatePresence mode="wait">
            {step === 'otp' ? (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Verify Your Email</h2>
                  <p className="text-dark-400 text-sm">
                    We've sent a 4-digit code to<br />
                    <span className="text-primary-400 font-medium">{formData.email}</span>
                  </p>
                </div>

                {/* OTP Input */}
                <div className="flex justify-center gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-14 h-14 text-center text-2xl font-bold bg-dark-800 border-2 border-dark-600 rounded-xl text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <motion.button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.join('').length !== 4}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-primary py-3.5 text-base flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Verify OTP</span>
                    </>
                  )}
                </motion.button>

                {/* Resend OTP */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-dark-400 text-sm">
                      Resend OTP in <span className="text-primary-400 font-medium">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleSendOTP}
                      disabled={isSendingOTP}
                      className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                    >
                      {isSendingOTP ? 'Sending...' : 'Resend OTP'}
                    </button>
                  )}
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setStep('form')}
                  className="w-full text-center text-dark-400 hover:text-white text-sm transition-colors"
                >
                  ← Back to form
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRegister}
                className="space-y-5"
              >
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      First Name
                    </label>
                    <div className="flex items-center gap-3 w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-300">
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        className="flex-1 bg-transparent text-white placeholder-dark-400 focus:outline-none text-base"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Last Name
                    </label>
                    <div className="flex items-center gap-3 w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-300">
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="flex-1 bg-transparent text-white placeholder-dark-400 focus:outline-none text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Username <span className="text-red-400">*</span>
                    {isCheckingUsername && (
                      <span className="ml-2 text-dark-400 text-xs">Checking...</span>
                    )}
                    {!isCheckingUsername && usernameAvailable === true && (
                      <span className="ml-2 text-primary-400 text-xs">✓ Available</span>
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <span className="ml-2 text-red-400 text-xs">✗ Taken</span>
                    )}
                  </label>
                  <div className={`flex items-center gap-3 w-full px-4 py-3 bg-dark-800 border rounded-lg focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-300 ${errors.username ? 'border-red-500' : usernameAvailable === true ? 'border-primary-500' : 'border-dark-600'}`}>
                    <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="Choose a username"
                      className="flex-1 bg-transparent text-white placeholder-dark-400 focus:outline-none text-base"
                    />
                    {isCheckingUsername && (
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                  </div>
                  {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username}</p>}
                </div>

                {/* Email with Verify Button */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Email <span className="text-red-400">*</span>
                    {otpVerified && (
                      <span className="ml-2 text-primary-400 text-xs">✓ Verified</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <div className={`flex items-center gap-3 flex-1 px-4 py-3 bg-dark-800 border rounded-lg focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-300 ${errors.email ? 'border-red-500' : 'border-dark-600'} ${otpVerified ? 'opacity-75' : ''}`}>
                      <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => {
                          handleChange(e);
                          setOtpVerified(false);
                        }}
                        placeholder="you@example.com"
                        disabled={otpVerified}
                        className="flex-1 bg-transparent text-white placeholder-dark-400 focus:outline-none text-base disabled:cursor-not-allowed"
                      />
                    </div>
                    {!otpVerified && (
                      <motion.button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={isSendingOTP || !formData.email}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSendingOTP ? (
                          <div className="spinner w-4 h-4" />
                        ) : (
                          'Verify'
                        )}
                      </motion.button>
                    )}
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Password <span className="text-red-400">*</span>
                    {passwordStrength && (
                      <span className={`ml-2 text-xs ${
                        passwordStrength.strength === 'weak' ? 'text-red-400' : 
                        passwordStrength.strength === 'moderate' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    )}
                  </label>
                  <div className={`flex items-center gap-3 w-full px-4 py-3 bg-dark-800 border rounded-lg focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-300 ${errors.password ? 'border-red-500' : 'border-dark-600'}`}>
                    <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 6 characters"
                      className="flex-1 bg-transparent text-white placeholder-dark-400 focus:outline-none text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-primary-400 transition-colors flex-shrink-0"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Password Strength Bar */}
                  {formData.password && passwordStrength && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-dark-400">
                        {passwordStrength.strength === 'weak' && 'Add uppercase, numbers, or symbols for a stronger password'}
                        {passwordStrength.strength === 'moderate' && 'Good! Add more variety for maximum security'}
                        {passwordStrength.strength === 'strong' && 'Excellent! Your password is strong'}
                      </p>
                    </div>
                  )}
                  {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className={`flex items-center gap-3 w-full px-4 py-3 bg-dark-800 border rounded-lg focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-300 ${errors.confirmPassword ? 'border-red-500' : 'border-dark-600'}`}>
                    <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className="flex-1 bg-transparent text-white placeholder-dark-400 focus:outline-none text-base"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || !otpVerified}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-primary py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </motion.button>

                {!otpVerified && (
                  <p className="text-center text-dark-400 text-sm">
                    Please verify your email to continue
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          {step === 'form' && (
            <>
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-dark-800 text-dark-400">Already have an account?</span>
                </div>
              </div>

              {/* Login Link */}
              <Link 
                href="/login"
                className="block w-full text-center btn-secondary py-3"
              >
                Sign in to your account
              </Link>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-dark-500 text-sm mt-6">
          By creating an account, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
}
