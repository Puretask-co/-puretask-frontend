// src/hooks/useBillingTrust.ts
// TanStack Query hooks for billing (Trust-Fintech REST)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { Invoice } from '@/types/trust';

export type PayInvoiceRequest = {
  payment_method: 'credits' | 'card';
};

export function usePayInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    // Idempotency-Key is auto-attached by the axios interceptor for all POSTs.
    mutationFn: ({ invoiceId, payment_method }: { invoiceId: string } & PayInvoiceRequest) =>
      apiClient.post<{ ok: boolean }>(
        `/client/invoices/${encodeURIComponent(invoiceId)}/pay`,
        { payment_method }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.billing.invoices() });
      queryClient.invalidateQueries({ queryKey: qk.credits.balance() });
      queryClient.invalidateQueries({ queryKey: qk.credits.ledger() });
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: qk.billing.invoices(),
    queryFn: () =>
      apiClient.get<{ invoices: Invoice[] }>('/api/billing/invoices'),
  });
}

export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: qk.billing.invoice(invoiceId),
    queryFn: () =>
      apiClient.get<Invoice>(
        `/api/billing/invoices/${encodeURIComponent(invoiceId)}`
      ),
    enabled: Boolean(invoiceId),
  });
}
