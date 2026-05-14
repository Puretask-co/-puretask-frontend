import { apiClient } from '@/lib/api';

export type TimelineEventType =
  | 'job_assigned'
  | 'en_route_sent'
  | 'gps_check_in'
  | 'before_photos_uploaded'
  | 'timer_started'
  | 'timer_paused'
  | 'timer_resumed'
  | 'gps_check_out'
  | 'after_photos_uploaded'
  | 'job_submitted'
  | 'client_approved'
  | 'dispute_opened'
  | 'dispute_resolved';

export type Job = {
  id: string;
  status: string;
  addressLabel: string;
  lat: number;
  lng: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  cleaner?: { id: string; name: string; tier?: string };
};

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  createdAt: string;
  meta?: Record<string, unknown>;
};

export type JobPhotos = {
  before: Array<{ id: string; url: string; createdAt: string }>;
  after: Array<{ id: string; url: string; createdAt: string }>;
};

export type GeoLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
};

export async function getJob(jobId: string) {
  const data = await apiClient.get<Job>(`/jobs/${jobId}`);
  return data as Job;
}

/** GET /jobs/:jobId/timeline — use for stepper (ASC order). */
export async function getJobTimeline(jobId: string) {
  const data = await apiClient.get<TimelineEvent[]>(`/jobs/${jobId}/timeline`);
  return data as TimelineEvent[];
}

export async function getJobPhotos(jobId: string) {
  const data = await apiClient.get<JobPhotos>(`/jobs/${jobId}/photos`);
  return data as JobPhotos;
}

/** POST /tracking/:jobId/en-route — cleaner only, requires location */
export async function sendEnRoute(jobId: string, location: GeoLocation) {
  return apiClient.post(`/tracking/${jobId}/en-route`, { location });
}

/**
 * POST /tracking/:jobId/arrived — cleaner only, marks arrival with GPS.
 * Note: the backend has a separate `/check-in` route that additionally
 * requires beforePhotos; that flow is owned by `tracking.service.ts`.
 */
export async function markArrived(jobId: string, location: GeoLocation) {
  return apiClient.post(`/tracking/${jobId}/arrived`, { location });
}

/**
 * POST /tracking/:jobId/check-out — cleaner submits the job.
 * Caller must fetch after-photo URLs first (e.g. via getJobPhotos).
 */
export async function submitJob(jobId: string, afterPhotos: string[], notes?: string) {
  return apiClient.post(`/tracking/${jobId}/check-out`, { afterPhotos, notes });
}

export type ApproveJobPayload = {
  /** Star rating, integer 1-5, required by backend */
  rating: number;
  /** Optional tip in cents/credits */
  tip?: number;
  /** Optional free-text feedback */
  feedback?: string;
};

/** POST /tracking/:jobId/approve — client only, auth + job ownership required */
export async function approveJob(jobId: string, payload: ApproveJobPayload) {
  return apiClient.post(`/tracking/${jobId}/approve`, payload);
}

export type DisputeCategory =
  | 'missed_area'
  | 'quality_issue'
  | 'damages_claim'
  | 'no_show'
  | 'other';

export type RequestedRefund = 'full' | 'partial' | 'none';

/** POST /tracking/:jobId/dispute — auth + job ownership required */
export async function openDispute(
  jobId: string,
  payload: { reason: string; requestedRefund: RequestedRefund; category?: DisputeCategory }
) {
  return apiClient.post(`/tracking/${jobId}/dispute`, payload);
}
