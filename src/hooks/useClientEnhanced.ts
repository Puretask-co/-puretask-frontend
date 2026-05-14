// Client Enhanced Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientEnhancedService } from '@/services/clientEnhanced.service';
import { useToast } from '@/contexts/ToastContext';
import { qk } from '@/lib/queryKeys';

export const useDashboardInsights = () => {
  return useQuery({
    queryKey: qk.client.dashboardInsights(),
    queryFn: () => clientEnhancedService.getInsights(),
  });
};

export const useRecommendations = () => {
  return useQuery({
    queryKey: qk.client.recommendations(),
    queryFn: () => clientEnhancedService.getRecommendations(),
  });
};

type DraftBookingResponse = { draft?: Record<string, unknown> };

export const useDraftBooking = () => {
  return useQuery<DraftBookingResponse>({
    queryKey: qk.client.draftBooking(),
    queryFn: () => clientEnhancedService.getDraft() as Promise<DraftBookingResponse>,
  });
};

export const useSaveDraftBooking = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (draft: any) => clientEnhancedService.saveDraft(draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.client.draftBooking() });
      showToast('Draft saved', 'success');
    },
    onError: () => {
      showToast('Failed to save draft', 'error');
    },
  });
};

type LiveStatusResponse = { job?: { current_status?: string; events?: Array<{ new_state?: string; created_at?: string; [k: string]: unknown }> } };

export const useLiveJobStatus = (jobId: string, enabled = true) => {
  return useQuery<LiveStatusResponse>({
    queryKey: qk.client.jobLiveStatus(jobId),
    queryFn: async () => {
      const res = await clientEnhancedService.getLiveStatus(jobId);
      return (res ?? {}) as LiveStatusResponse;
    },
    enabled: enabled && !!jobId,
    refetchInterval: 10000, // Poll every 10 seconds
  });
};

export const useAddToCalendar = () => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (jobId: string) => clientEnhancedService.addToCalendar(jobId),
    onSuccess: () => {
      showToast('Added to calendar', 'success');
    },
    onError: () => {
      showToast('Failed to add to calendar', 'error');
    },
  });
};

export const useFavoriteRecommendations = () => {
  return useQuery({
    queryKey: qk.client.favoritesRecommendations(),
    queryFn: () => clientEnhancedService.getFavoriteRecommendations(),
  });
};

export const useFavoriteInsights = () => {
  return useQuery({
    queryKey: qk.client.favoritesInsights(),
    queryFn: () => clientEnhancedService.getFavoriteInsights(),
  });
};

export const useRecurringSuggestions = (id: string) => {
  return useQuery({
    queryKey: qk.client.recurringBookingSuggestions(id),
    queryFn: () => clientEnhancedService.getRecurringSuggestions(id),
    enabled: !!id,
  });
};

export const useSkipRecurringBooking = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => clientEnhancedService.skipRecurringBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.recurringBookings });
      showToast('Booking skipped', 'success');
    },
    onError: () => {
      showToast('Failed to skip booking', 'error');
    },
  });
};

export const usePreferences = () => {
  return useQuery({
    queryKey: qk.client.preferences(),
    queryFn: () => clientEnhancedService.getPreferences(),
  });
};

export const useSavePreferences = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (preferences: any) => clientEnhancedService.savePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.client.preferences() });
      showToast('Preferences saved', 'success');
    },
    onError: () => {
      showToast('Failed to save preferences', 'error');
    },
  });
};

export const useReviewInsights = () => {
  return useQuery({
    queryKey: qk.client.reviewsInsights(),
    queryFn: () => clientEnhancedService.getReviewInsights(),
  });
};
