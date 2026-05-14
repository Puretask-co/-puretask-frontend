'use client';

import { SegmentError } from '@/components/error/SegmentError';

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentError error={error} reset={reset} scope="Client" />;
}
