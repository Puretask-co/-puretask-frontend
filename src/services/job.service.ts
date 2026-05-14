import { apiClient } from '@/lib/api';
import type { Job, CreateJobData, PaginatedResponse } from '@/types/api';

export const jobService = {
  // Create a new job
  createJob: async (data: CreateJobData): Promise<{ job: Job }> => {
    return apiClient.post('/jobs', data);
  },

  // Get job by ID
  getJob: async (jobId: string): Promise<{ job: Job }> => {
    return apiClient.get(`/jobs/${jobId}`);
  },

  // Get jobs for current user (client or cleaner)
  getMyJobs: async (params?: {
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Job>> => {
    return apiClient.get('/jobs/me', { params });
  },

  // Get jobs for a client
  getClientJobs: async (
    clientId: string,
    params?: { status?: string; page?: number; per_page?: number }
  ): Promise<PaginatedResponse<Job>> => {
    return apiClient.get(`/jobs/client/${clientId}`, { params });
  },

  // Get jobs for a cleaner
  getCleanerJobs: async (
    cleanerId: string,
    params?: { status?: string; page?: number; per_page?: number }
  ): Promise<PaginatedResponse<Job>> => {
    return apiClient.get(`/jobs/cleaner/${cleanerId}`, { params });
  },

  // Update job status
  updateJobStatus: async (
    jobId: string,
    status: string
  ): Promise<{ job: Job; message: string }> => {
    return apiClient.patch(`/jobs/${jobId}/status`, { status });
  },

  // Cancel job
  cancelJob: async (jobId: string): Promise<{ message: string }> => {
    return apiClient.post(`/jobs/${jobId}/cancel`);
  },

  // Start job (cleaner)
  startJob: async (jobId: string): Promise<{ job: Job; message: string }> => {
    return apiClient.post(`/jobs/${jobId}/start`);
  },

  // Complete job (cleaner)
  completeJob: async (jobId: string): Promise<{ job: Job; message: string }> => {
    return apiClient.post(`/jobs/${jobId}/complete`);
  },

  // Rate job (client)
  rateJob: async (
    jobId: string,
    rating: number,
    comment?: string
  ): Promise<{ message: string }> => {
    return apiClient.post(`/jobs/${jobId}/rate`, { rating, comment });
  },

  // Upload before/after photo (cleaner)
  uploadJobPhoto: async (
    jobId: string,
    kind: 'before' | 'after',
    file: File
  ): Promise<{ url?: string }> => {
    const formData = new FormData();
    formData.append('kind', kind);
    formData.append('photo', file);
    const res = await apiClient.post(`/jobs/${jobId}/photos`, formData);
    return res as { url?: string };
  },
};

