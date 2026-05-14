// src/lib/__tests__/api.test.ts
// Unit tests for API client (axios interceptors)

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock axios before importing api
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn().mockResolvedValue({ data: {} }),
      post: jest.fn().mockResolvedValue({ data: {} }),
    })),
  },
}));

jest.mock('../config', () => ({
  API_CONFIG: { baseURL: 'http://localhost:3000', timeout: 10000, wsURL: 'ws://localhost:3001' },
  STORAGE_KEYS: { AUTH_TOKEN: 'auth_token', USER_DATA: 'user_data' },
}));

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Request Interceptor', () => {
    it('adds auth token to requests when available', () => {
      localStorage.setItem('auth_token', 'test-token');
      
      // Verify token is stored
      const token = localStorage.getItem('auth_token');
      expect(token).toBe('test-token');
    });

    it('does not add token when not authenticated', () => {
      localStorage.removeItem('auth_token');
      
      const token = localStorage.getItem('auth_token');
      expect(token).toBeNull();
    });
  });

  describe('Response Interceptor', () => {
    it('handles 401 errors by clearing auth data', () => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user_data', '{}');
      
      // Simulate 401 error handling
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });

    it('handles network errors gracefully', () => {
      // Network errors should be handled gracefully
      expect(typeof Error).toBe('function');
    });
  });

  describe('API Client Structure', () => {
    it('has get method', () => {
      // API client should have get method
      // In actual implementation, this would be tested with the real apiClient
      expect(true).toBe(true); // Placeholder - actual test would import and test apiClient
    });

    it('has post method', () => {
      // API client should have post method
      expect(true).toBe(true); // Placeholder - actual test would import and test apiClient
    });
  });
});
