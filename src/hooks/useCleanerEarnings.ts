import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cleanerEarningsService } from '@/services/cleanerEarnings.service';
import { useToast } from '@/contexts/ToastContext';
import { qk } from '@/lib/queryKeys';

export function useCleanerEarnings() {
  return useQuery({
    queryKey: qk.cleaner.earnings(),
    queryFn: () => cleanerEarningsService.getEarnings(),
  });
}

export function useCleanerPayouts(params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: qk.cleaner.payouts(params),
    queryFn: () => cleanerEarningsService.getPayouts(params),
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (amount?: number) => cleanerEarningsService.requestPayout(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.cleaner.earnings() });
      queryClient.invalidateQueries({ queryKey: qk.cleaner.payouts() });
      showToast('Payout requested successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error?.message || 'Failed to request payout', 'error');
    },
  });
}
