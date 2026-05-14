import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getJobDetails } from '@/services/jobDetails.service';
import { qk } from '@/lib/queryKeys';

/**
 * @deprecated use `qk.jobDetails(id)` from '@/lib/queryKeys' instead.
 * Kept as a re-export for callers that still spread this prefix.
 */
export const JOB_DETAILS_QUERY_KEY = ['job-details'] as const;

export function useJobDetails(jobId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.jobDetails(jobId ?? ''),
    queryFn: () => getJobDetails(jobId!),
    enabled: !!jobId,
  });

  const invalidate = () => {
    if (jobId) queryClient.invalidateQueries({ queryKey: qk.jobDetails(jobId) });
  };

  return {
    ...query,
    invalidate,
    details: query.data ?? null,
  };
}
