'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GradientButton } from '@/components/brand/GradientButton';
import { Textarea } from '@/components/ui/Textarea';
import {
  openDispute,
  type DisputeCategory,
  type RequestedRefund,
} from '@/services/jobs';

const CATEGORIES: { value: DisputeCategory; label: string }[] = [
  { value: 'quality_issue', label: 'Quality not as expected' },
  { value: 'missed_area', label: 'Areas were missed' },
  { value: 'damages_claim', label: 'Damage or property issue' },
  { value: 'no_show', label: "No-show or didn't come" },
  { value: 'other', label: 'Other' },
];

const REFUND_OPTIONS: { value: RequestedRefund; label: string; sub: string }[] = [
  { value: 'full', label: 'Full refund', sub: 'Return all credits held for this job.' },
  { value: 'partial', label: 'Partial refund', sub: 'Return some of the credits; our team will decide the amount.' },
  { value: 'none', label: 'No refund', sub: 'Just have someone review what happened.' },
];

const MIN_REASON = 10;

export default function ClientDisputePage() {
  const { jobId } = useParams<{ jobId: string }>();
  const r = useRouter();
  const [category, setCategory] = useState<DisputeCategory>('quality_issue');
  const [reason, setReason] = useState('');
  const [requestedRefund, setRequestedRefund] = useState<RequestedRefund>('partial');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasonOk = reason.trim().length >= MIN_REASON;

  async function submit() {
    if (!jobId) return;
    if (!reasonOk) {
      setError(`Please write at least ${MIN_REASON} characters describing what went wrong.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await openDispute(jobId, { reason: reason.trim(), requestedRefund, category });
      r.push(`/client/job/${jobId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit dispute');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Open a dispute</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          We&apos;ll review your case and get back to you within 24-48 hours.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-900">What happened?</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className="rounded-3xl border bg-white p-4 text-left shadow-sm"
                style={
                  category === c.value
                    ? {
                        backgroundImage: 'linear-gradient(90deg,#0078FF,#00D4FF)',
                        color: 'white',
                        borderColor: 'transparent',
                      }
                    : undefined
                }
              >
                <div className="text-sm font-semibold">{c.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="dispute-reason" className="text-sm font-semibold text-gray-900">
            Tell us more
          </label>
          <Textarea
            id="dispute-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[140px] rounded-3xl"
            placeholder="Mention specific rooms, areas, expectations, and anything our team should see in the photos."
          />
          <div className="text-xs text-gray-500">
            {reason.trim().length}/{MIN_REASON} characters minimum
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-900">What outcome are you asking for?</div>
          <div className="grid gap-2">
            {REFUND_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRequestedRefund(r.value)}
                className="rounded-2xl border bg-white p-3 text-left shadow-sm"
                style={
                  requestedRefund === r.value
                    ? {
                        backgroundImage: 'linear-gradient(90deg,#0078FF,#00D4FF)',
                        color: 'white',
                        borderColor: 'transparent',
                      }
                    : undefined
                }
              >
                <div className="text-sm font-semibold">{r.label}</div>
                <div className="text-xs opacity-80 mt-0.5">{r.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <GradientButton disabled={busy || !reasonOk} onClick={submit}>
          {busy ? 'Submitting...' : 'Submit dispute'}
        </GradientButton>

        <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>We typically respond within 24-48 hours.</li>
            <li>Our team may contact you or your cleaner for more details.</li>
            <li>Possible outcomes: full or partial refund, or release of payment to the cleaner.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
