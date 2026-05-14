// src/contexts/__tests__/AuthContext.test.tsx
// Unit tests for AuthContext

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { apiClient } from '@/lib/api';
import { STORAGE_KEYS } from '@/lib/config';

jest.mock('@/lib/api');
jest.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

// TODO: Fix AuthContext integration tests (async/mocks) - TODOS.md
describe.skip('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('useAuth', () => {
    it('provides initial state with no user', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });

    it('loads user from localStorage on mount', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'client' as const,
      };

      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'test-token');
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser));

      const mockApiClient = apiClient as any;
      mockApiClient.get.mockResolvedValueOnce({ data: mockUser });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('clears invalid data from localStorage', async () => {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'invalid-token');
      localStorage.setItem(STORAGE_KEYS.USER_DATA, 'invalid-json');

      const mockApiClient = apiClient as any;
      mockApiClient.get.mockRejectedValueOnce(new Error('Unauthorized'));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    it('authenticates user and stores token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'client' as const,
      };

      const mockApiClient = apiClient as any;
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          user: mockUser,
          token: 'test-token',
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBe('test-token');
    });

    it('handles login errors', async () => {
      const mockApiClient = apiClient as any;
      mockApiClient.post.mockRejectedValueOnce(new Error('Invalid credentials'));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong-password',
          });
        })
      ).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('creates account and authenticates user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'new@example.com',
        role: 'client' as const,
      };

      const mockApiClient = apiClient as any;
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          user: mockUser,
          token: 'test-token',
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register({
          email: 'new@example.com',
          password: 'password123',
          role: 'client',
          firstName: 'John',
          lastName: 'Doe',
        } as any);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('clears user and token', async () => {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'test-token');
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({ id: 'user-123' }));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull();
    });
  });

  describe('refreshUser', () => {
    it('updates user data from API', async () => {
      const initialUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'client' as const,
      };

      const updatedUser = {
        ...initialUser,
        firstName: 'John',
        lastName: 'Doe',
      };

      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'test-token');
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(initialUser));

      const mockApiClient = apiClient as any;
      mockApiClient.get.mockResolvedValueOnce({ data: updatedUser });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user).toEqual(updatedUser);
    });
  });
});
