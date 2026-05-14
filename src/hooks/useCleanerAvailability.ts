import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cleanerAvailabilityService, WeeklyAvailability, TimeOff } from '@/services/cleanerAvailability.service';
import { useToast } from '@/contexts/ToastContext';
import { qk } from '@/lib/queryKeys';

export function useCleanerAvailability() {
  return useQuery({
    queryKey: qk.cleaner.availability(),
    queryFn: () => cleanerAvailabilityService.getAvailability(),
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (availability: WeeklyAvailability) => cleanerAvailabilityService.updateAvailability(availability),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.cleaner.availability() });
      queryClient.invalidateQueries({ queryKey: qk.cleaner.schedule() });
      showToast('Availability updated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error?.message || 'Failed to update availability', 'error');
    },
  });
}

export function useCleanerSchedule(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: qk.cleaner.schedule(params),
    queryFn: () => cleanerAvailabilityService.getSchedule(params),
  });
}

export function useTimeOff() {
  return useQuery({
    queryKey: qk.cleaner.timeOff(),
    queryFn: () => cleanerAvailabilityService.getTimeOff(),
  });
}

export function useAddTimeOff() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: {
      startDate: string;
      endDate: string;
      allDay?: boolean;
      startTime?: string;
      endTime?: string;
      reason?: string;
    }) => cleanerAvailabilityService.addTimeOff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.cleaner.timeOff() });
      queryClient.invalidateQueries({ queryKey: qk.cleaner.schedule() });
      showToast('Time off added successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error?.message || 'Failed to add time off', 'error');
    },
  });
}

export function useDeleteTimeOff() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => cleanerAvailabilityService.deleteTimeOff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.cleaner.timeOff() });
      queryClient.invalidateQueries({ queryKey: qk.cleaner.schedule() });
      showToast('Time off removed successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error?.message || 'Failed to remove time off', 'error');
    },
  });
}
