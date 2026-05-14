'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { STORAGE_KEYS } from '@/lib/config';
import { setSessionMarker, clearSessionMarker } from '@/lib/sessionMarker';
import { useToast } from '@/contexts/ToastContext';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);

        if (token && savedUser) {
          // Set user immediately for faster UI
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            // Re-sync the middleware session marker in case the cookie was
            // cleared by browser policy while localStorage persisted.
            if (parsedUser?.role) setSessionMarker(parsedUser);
          } catch (parseError) {
            console.error('Failed to parse saved user:', parseError);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          }

          // Verify token with backend (silently - don't show errors)
          try {
            await refreshUser();
          } catch (error) {
            // Token expired or invalid - clear storage but don't redirect yet
            // Let the user stay on current page, they'll be redirected on next API call
            if (process.env.NODE_ENV === 'development') {
              console.log('Token validation failed, clearing auth data');
            }
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            clearSessionMarker();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        // Clear invalid data
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        clearSessionMarker();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const response = await apiClient.post<AuthResponse & { access_token?: string; data?: { token?: string; user?: User } }>('/auth/login', credentials);
      
      // Support multiple backend shapes: token | access_token, user | data.user
      const token = response?.token ?? response?.access_token ?? response?.data?.token;
      const user = response?.user ?? response?.data?.user;
      if (!token || !user) {
        const msg = 'Invalid login response. Please try again.';
        showToast(msg, 'error');
        throw new Error(msg);
      }
      
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      setSessionMarker(user);

      setUser(user);
      showToast('Successfully logged in!', 'success');

      return user;
    } catch (error: any) {
      let errorMsg =
        error.response?.data?.error?.message ??
        error.response?.data?.message ??
        (Array.isArray(error.response?.data?.errors)
          ? error.response.data.errors.map((e: { message?: string }) => e.message).filter(Boolean).join('. ')
          : null);
      if (!errorMsg) {
        if (!error.response) {
          errorMsg = 'Unable to reach the server. Check your connection and try again.';
        } else {
          errorMsg = error?.message && error.message !== 'Login failed' ? error.message : 'Invalid email or password. Please try again.';
        }
      }
      showToast(errorMsg, 'error');
      throw new Error(errorMsg);
    }
  };

  const register = async (data: RegisterData): Promise<User> => {
    try {
      const response = await apiClient.post<AuthResponse & { access_token?: string; data?: { token?: string; user?: User } }>('/auth/register', data);
      const token = response?.token ?? response?.access_token ?? response?.data?.token;
      const user = response?.user ?? response?.data?.user;
      if (!token || !user) {
        const msg = 'Invalid signup response. Please try again.';
        showToast(msg, 'error');
        throw new Error(msg);
      }
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      setSessionMarker(user);
      setUser(user);
      showToast('Account created successfully!', 'success');
      return user;
    } catch (error: any) {
      let errorMsg =
        error.response?.data?.error?.message ??
        error.response?.data?.message ??
        (Array.isArray(error.response?.data?.errors)
          ? error.response.data.errors.map((e: { message?: string }) => e.message).filter(Boolean).join('. ')
          : null);
      if (!errorMsg) {
        if (!error.response) {
          errorMsg = 'Unable to reach the server. Check your connection and try again.';
        } else {
          errorMsg = error?.message && error.message !== 'Registration failed' ? error.message : 'Registration failed. Please try again.';
        }
      }
      showToast(errorMsg, 'error');
      throw new Error(errorMsg);
    }
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    clearSessionMarker();

    // Clear state
    setUser(null);
    
    // Optionally notify backend
    apiClient.post('/auth/logout').catch(() => {
      // Ignore errors on logout
    });
    
    showToast('Successfully logged out', 'info');
    
    // Redirect to login page (not home)
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  const refreshUser = async () => {
    try {
      // Fetch current user data from backend
      const response = await apiClient.get<{ user: User }>('/auth/me');
      
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
      setSessionMarker(response.user);
      setUser(response.user);
    } catch (error) {
      // If refresh fails, clear auth but don't redirect (let api interceptor handle it)
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      clearSessionMarker();
      setUser(null);
      throw error; // Re-throw so caller knows it failed
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
}

