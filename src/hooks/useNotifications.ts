'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export function useNotifications() {
  return useQuery<{ notifications?: unknown[] }>({
    queryKey: qk.notifications.list(),
    queryFn: async () => {
      const response = await apiClient.get('/notifications');
      const data = (response as { data?: { notifications?: unknown[] }; notifications?: unknown[] }).data ?? response;
      return (data ?? {}) as { notifications?: unknown[] };
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: qk.notifications.unreadCount(),
    queryFn: async () => {
      const response = await apiClient.get('/notifications/unread-count') as { data?: { count?: number } };
      return response?.data ?? response;
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.list() });
      queryClient.invalidateQueries({ queryKey: qk.notifications.unreadCount() });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiClient.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.list() });
      queryClient.invalidateQueries({ queryKey: qk.notifications.unreadCount() });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.list() });
    },
  });
}
