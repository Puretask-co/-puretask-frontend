// src/hooks/useCreditsTrust.ts
// TanStack Query hooks for credits (Trust-Fintech REST)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { CreditLedgerEntry, CreditsBalance } from '@/types/trust';

export type BuyCreditsRequest = {
  packageId: string;
  successUrl: string;
  cancelUrl: string;
};

export type BuyCreditsResponse = {
  checkoutUrl?: string;
  url?: string;
};

export function useBuyCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    // Idempotency-Key is auto-attached by the axios interceptor for all POSTs.
    mutationFn: (body: BuyCreditsRequest) =>
      apiClient.post<BuyCreditsResponse>('/credits/checkout', body),
    onSuccess: (data) => {
      const url = data?.checkoutUrl ?? data?.url;
      if (url && typeof window !== 'undefined') {
        window.location.href = url;
      }
      queryClient.invalidateQueries({ queryKey: qk.credits.balance() });
      queryClient.invalidateQueries({ queryKey: qk.credits.ledger() });
    },
  });
}

export type CreditsLedgerFilters = {
  from?: string; // ISO date or datetime
  to?: string;
  type?: CreditLedgerEntry['type'];
  status?: CreditLedgerEntry['status'];
  search?: string;
  limit?: number;
};

function toQueryString(filters: CreditsLedgerFilters) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useCreditsBalance() {
  return useQuery({
    queryKey: qk.credits.balance(),
    queryFn: () => apiClient.get<CreditsBalance>('/api/credits/balance'),
  });
}

export function useCreditsLedger(filters: CreditsLedgerFilters) {
  const qs = toQueryString(filters);
  return useQuery({
    queryKey: qk.credits.ledger(filters),
    queryFn: () =>
      apiClient.get<{ entries: CreditLedgerEntry[] }>(`/api/credits/ledger${qs}`),
  });
}
