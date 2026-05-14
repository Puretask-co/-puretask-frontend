'use client';

import { SegmentError } from '@/components/error/SegmentError';

export default function ClientGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentError error={error} reset={reset} scope="Client" />;
}
