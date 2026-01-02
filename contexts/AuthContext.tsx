"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

interface Quota {
  emailsPerDay: number;
  emailsUsedToday: number;
  whatsappPerDay: number;
  whatsappUsedToday: number;
  lastResetDate: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: string;
  quota: Quota;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string }) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          setIsAuthenticated(true);
          const userData = localStorage.getItem('userData');
          if (userData) {
            setUser(JSON.parse(userData));
          }
          // Refresh user data from server
          await refreshUserData();
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
      localStorage.setItem('userData', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const refreshUser = async () => {
    await refreshUserData();
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      toast.success(`Welcome back, ${response.data.user.username}! 🚀`);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please check if the API server is running.');
      } else if (error.response?.status === 401) {
        toast.error('Invalid username or password');
      } else if (error.response?.status === 403) {
        toast.error('Account is deactivated');
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      }
      return false;
    }
  };

  const register = async (
    username: string, 
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
        firstName,
        lastName
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      toast.success(`Welcome, ${response.data.user.username}! Account created successfully 🎉`);
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please check if the API server is running.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
      return false;
    }
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; email?: string }): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/auth/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(response.data);
      localStorage.setItem('userData', JSON.stringify(response.data));
      toast.success('Profile updated successfully!');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/auth/change-password`, 
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Password changed successfully!');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
      return false;
    }
  };

  const logout = () => {
    Cookies.remove('auth_token');
    Cookies.remove('user_data');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      refreshUser,
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};