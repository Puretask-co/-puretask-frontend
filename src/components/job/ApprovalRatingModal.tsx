'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { approveJob, type ApproveJobPayload } from '@/services/jobs';

interface ApprovalRatingModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onApproved?: () => void;
}

export function ApprovalRatingModal({
  jobId,
  isOpen,
  onClose,
  onApproved,
}: ApprovalRatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [tip, setTip] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = rating >= 1 && rating <= 5 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    const payload: ApproveJobPayload = { rating };
    const tipNum = tip.trim() === '' ? undefined : Number(tip);
    if (tipNum !== undefined && Number.isFinite(tipNum) && tipNum >= 0) {
      payload.tip = Math.floor(tipNum);
    }
    if (feedback.trim() !== '') {
      payload.feedback = feedback.trim();
    }
    try {
      await approveJob(jobId, payload);
      onApproved?.();
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to approve job';
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate your cleaner" size="md">
      <div className="space-y-5">
        <div>
          <div className="text-sm font-medium text-gray-900 mb-2">
            How was the job? <span className="text-red-600">*</span>
          </div>
          <div
            className="flex items-center gap-1"
            role="radiogroup"
            aria-label="Star rating, 1 to 5"
          >
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (hoverRating || rating) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className="rounded-full p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Star
                    className={`h-8 w-8 ${
                      filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {rating === 0 && (
            <div className="mt-1 text-xs text-gray-500">Required to approve</div>
          )}
        </div>

        <div>
          <label htmlFor="tip" className="block text-sm font-medium text-gray-900 mb-1">
            Add a tip (optional)
          </label>
          <Input
            id="tip"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-900 mb-1">
            Leave a note (optional)
          </label>
          <Textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
            placeholder="Anything you'd like your cleaner to know?"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit} isLoading={busy}>
            {busy ? 'Approving...' : 'Approve & release payment'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
