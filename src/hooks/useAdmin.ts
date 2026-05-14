import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { useToast } from '@/contexts/ToastContext';
import { qk } from '@/lib/queryKeys';

// Dashboard Analytics Hooks
export function useAdminStats() {
  return useQuery({
    queryKey: qk.admin.stats(),
    queryFn: () => adminService.getStats(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useDailyStats(days: number = 30) {
  return useQuery({
    queryKey: qk.admin.dailyStats(days),
    queryFn: () => adminService.getDailyStats(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRevenueAnalytics(period: 'week' | 'month' | 'year' = 'month') {
  return useQuery({
    queryKey: qk.admin.revenue(period),
    queryFn: () => adminService.getRevenueAnalytics(period),
    staleTime: 5 * 60 * 1000,
  });
}

// User Management Hooks
export function useAllUsers(params?: any) {
  return useQuery({
    queryKey: qk.admin.users(params),
    queryFn: () => adminService.getAllUsers(params),
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: qk.admin.user(userId),
    queryFn: () => adminService.getUser(userId),
    enabled: !!userId,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: any }) =>
      adminService.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.users() });
      showToast('User status updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update user status', 'error');
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: any }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.users() });
      showToast('User role updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update user role', 'error');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.users() });
      showToast('User deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete user', 'error');
    },
  });
}

// Booking Management Hooks
export function useAllBookings(params?: any) {
  return useQuery({
    queryKey: qk.admin.bookings(params),
    queryFn: () => adminService.getAllBookings(params),
  });
}

export function useAdminBooking(bookingId: string) {
  return useQuery({
    queryKey: qk.admin.booking(bookingId),
    queryFn: () => adminService.getBookingDetails(bookingId),
    enabled: !!bookingId,
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: string }) =>
      adminService.updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.bookings() });
      showToast('Booking status updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update booking status', 'error');
    },
  });
}

// Financial Hooks
export function useAllTransactions(params?: any) {
  return useQuery({
    queryKey: qk.admin.transactions(params),
    queryFn: () => adminService.getAllTransactions(params),
  });
}

export function useProcessRefund() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      transactionId,
      amount,
      reason,
    }: {
      transactionId: string;
      amount: number;
      reason: string;
    }) => adminService.processRefund(transactionId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.transactions() });
      showToast('Refund processed successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to process refund', 'error');
    },
  });
}

export function useFinancialReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: qk.admin.financialReport(startDate, endDate),
    queryFn: () => adminService.getFinancialReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

// System Settings Hooks
export function useSystemSettings() {
  return useQuery({
    queryKey: qk.admin.settings(),
    queryFn: () => adminService.getAllSettings(),
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminService.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.settings() });
      showToast('Setting updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update setting', 'error');
    },
  });
}

// Verification Hooks
export function usePendingVerifications() {
  return useQuery({
    queryKey: qk.admin.verifications.pending,
    queryFn: () => adminService.getPendingVerifications(),
  });
}

export function useApproveVerification() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (verificationId: string) => adminService.approveVerification(verificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.verifications.all });
      showToast('Verification approved', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to approve verification', 'error');
    },
  });
}

export function useRejectVerification() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ verificationId, reason }: { verificationId: string; reason: string }) =>
      adminService.rejectVerification(verificationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.admin.verifications.all });
      showToast('Verification rejected', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to reject verification', 'error');
    },
  });
}

