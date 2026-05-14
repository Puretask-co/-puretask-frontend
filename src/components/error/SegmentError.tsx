'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertTriangle } from 'lucide-react';

interface SegmentErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Friendly label of the surface that errored — used in the headline */
  scope?: string;
}

/**
 * Shared segment-level error boundary UI for Next.js App Router error.tsx files.
 * Reports to Sentry (dynamic import so it never breaks builds without Sentry installed).
 */
export function SegmentError({ error, reset, scope }: SegmentErrorProps) {
  useEffect(() => {
    void (async () => {
      try {
        const sentry = await import('@sentry/nextjs').catch(() => null);
        sentry?.captureException(error, {
          extra: { scope: scope ?? 'segment' },
        });
      } catch {
        // never let error reporting break the error UI
      }
    })();
  }, [error, scope]);

  const title = scope ? `Something went wrong in ${scope}` : 'Something went wrong';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            We couldn&apos;t load this part of the app. Try again, or head back to safety.
          </p>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded break-all">
              {error.message}
              {error.digest ? ` (digest: ${error.digest})` : ''}
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="primary" onClick={reset}>
              Try again
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
