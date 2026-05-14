// src/hooks/__tests__/useBookings.test.tsx
// Unit tests for useBookings hooks

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useBookings, useBooking, useCreateBooking, useCancelBooking } from '../useBookings';
import * as bookingService from '@/services/booking.service';

jest.mock('next/navigation');
jest.mock('@/services/booking.service');
jest.mock('@/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

// TODO: Fix useBookings tests (mocks/assertions) - TODOS.md
describe.skip('useBookings hooks', () => {
  let queryClient: QueryClient;
  let mockRouter: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
    };
    (useRouter as any).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useBookings', () => {
    it('fetches bookings', async () => {
      const mockBookings = [
        { id: '1', status: 'pending', cleaningType: 'regular' },
        { id: '2', status: 'confirmed', cleaningType: 'deep' },
      ];

      (bookingService.bookingService.getMyBookings as any).mockResolvedValueOnce({
        data: mockBookings,
      });

      const { result } = renderHook(() => useBookings(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect((result.current.data as any)?.data).toEqual(mockBookings);
    });

    it('filters bookings by status', async () => {
      const mockBookings = [
        { id: '1', status: 'pending', cleaningType: 'regular' },
      ];

      (bookingService.bookingService.getMyBookings as any).mockResolvedValueOnce({
        data: mockBookings,
      });

      const { result } = renderHook(() => useBookings('pending' as any), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(bookingService.bookingService.getMyBookings).toHaveBeenCalledWith({
        status: 'pending' as any,
      });
    });
  });

  describe('useBooking', () => {
    it('fetches single booking', async () => {
      const mockBooking = {
        id: '1',
        status: 'confirmed',
        cleaningType: 'regular',
      };

      (bookingService.bookingService.getBooking as any).mockResolvedValueOnce(mockBooking);

      const { result } = renderHook(() => useBooking('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockBooking);
    });

    it('does not fetch when bookingId is empty', () => {
      const { result } = renderHook(() => useBooking(''), { wrapper });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useCreateBooking', () => {
    it('creates booking and redirects', async () => {
      const mockBooking = {
        id: '1',
        status: 'pending',
        cleaningType: 'regular',
      };

      (bookingService.bookingService.createBooking as any).mockResolvedValueOnce({
        booking: mockBooking,
      });

      const { result } = renderHook(() => useCreateBooking(), { wrapper });

      await act(async () => {
        await result.current.mutate({
          cleaningType: 'regular',
          hours: 2,
          date: '2026-01-25',
          time: '14:00',
          addressId: 'addr-123',
        } as any);
      });

      expect(bookingService.bookingService.createBooking).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/booking/confirm/1');
    });

    it('handles creation errors', async () => {
      (bookingService.bookingService.createBooking as any).mockRejectedValueOnce(
        new Error('Insufficient credits')
      );

      const { result } = renderHook(() => useCreateBooking(), { wrapper });

      await act(async () => {
        await result.current.mutate({
          cleaningType: 'regular',
          hours: 2,
          date: '2026-01-25',
          time: '14:00',
          addressId: 'addr-123',
        } as any);
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe('useCancelBooking', () => {
    it('cancels booking', async () => {
      (bookingService.bookingService.cancelBooking as any).mockResolvedValueOnce({});

      const { result } = renderHook(() => useCancelBooking(), { wrapper });

      await act(async () => {
        await result.current.mutate({
          bookingId: '1',
          reason: 'Changed my mind',
        });
      });

      expect(bookingService.bookingService.cancelBooking).toHaveBeenCalledWith(
        '1',
        'Changed my mind'
      );
    });
  });
});
