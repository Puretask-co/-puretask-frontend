// src/hooks/useLiveAppointmentTrust.ts
// TanStack Query hooks for live appointments (Trust-Fintech REST)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { LiveAppointment } from '@/types/trust';

export type AppointmentEventCreate = {
  type: 'en_route' | 'arrived' | 'check_in' | 'check_out' | 'note';
  note?: string;
  gps?: { lat: number; lng: number; accuracyM?: number };
  source?: 'device' | 'manual_override';
};

export function useLiveAppointment(bookingId: string) {
  return useQuery({
    queryKey: qk.appointments.live(bookingId),
    queryFn: () =>
      apiClient.get<LiveAppointment>(
        `/api/appointments/${encodeURIComponent(bookingId)}/live`
      ),
    enabled: Boolean(bookingId),
    refetchInterval: 3_000,
  });
}

export function usePostAppointmentEvent(bookingId: string) {
  const qc = useQueryClient();

  return useMutation({
    // Idempotency-Key is auto-attached by the axios interceptor for all POSTs.
    mutationFn: (payload: AppointmentEventCreate) =>
      apiClient.post<{ ok: true }>(
        `/api/appointments/${encodeURIComponent(bookingId)}/events`,
        payload
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: qk.appointments.live(bookingId),
      });
    },
  });
}
