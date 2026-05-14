'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useBooking } from '@/hooks/useBookings';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/contexts/ToastContext';
import { cleanerEnhancedService } from '@/services/cleanerEnhanced.service';
import { cleanerGamificationService } from '@/services/cleanerGamification.service';
import { jobService } from '@/services/job.service';
import { markArrived } from '@/services/jobs';
import { getJobStatusLabel, getJobStatusBadgeClass } from '@/constants';
import { MapPin, Clock, DollarSign, FileText, Navigation, Target, Camera, MessageSquare, AlertTriangle } from 'lucide-react';

export default function CleanerJobDetailsPage() {
  return (
    <ProtectedRoute requiredRole="cleaner">
      <CleanerJobDetailsContent />
    </ProtectedRoute>
  );
}

function CleanerJobDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { data, isLoading, error } = useBooking(jobId);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [checkInLocation, setCheckInLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [timeTracking, setTimeTracking] = useState<{ start?: Date; end?: Date; paused?: boolean }>({});
  const [expenses, setExpenses] = useState<Array<{ description: string; amount: number; category: string }>>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const { data: goalsList } = useQuery({
    queryKey: ['cleaner', 'goals'],
    queryFn: () => cleanerGamificationService.getGoals(),
    enabled: !!jobId,
  });

  // Get directions
  const { data: directionsData } = useQuery({
    queryKey: ['cleaner', 'jobs', jobId, 'directions'],
    queryFn: () => cleanerEnhancedService.getDirections(jobId),
    enabled: !!jobId && !!data?.booking && data.booking.status !== 'completed' && data.booking.status !== 'cancelled',
  });

  // Track time
  const { mutate: trackTime } = useMutation({
    mutationFn: ({ action, timestamp }: { action: string; timestamp?: string }) =>
      cleanerEnhancedService.trackTime(jobId, action, timestamp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', jobId] });
    },
  });

  // Track expenses
  const { mutate: trackExpense } = useMutation({
    mutationFn: (expense: { description: string; amount: number; category?: string }) =>
      cleanerEnhancedService.trackExpense(jobId, expense.description, expense.amount, expense.category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', jobId] });
      setShowExpenseForm(false);
      showToast('Expense tracked', 'success');
    },
  });

  const { mutate: updateJobStatus, isPending: isUpdating } = useMutation({
    mutationFn: ({ eventType }: { eventType: string }) =>
      apiClient.post(`/jobs/${jobId}/transition`, { event_type: eventType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', jobId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast('Job status updated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error?.message || 'Failed to update job status', 'error');
    },
  });

  const { mutate: checkIn, isPending: isCheckingIn } = useMutation({
    mutationFn: (payload: { latitude: number; longitude: number; accuracy?: number }) =>
      markArrived(jobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', jobId] });
      showToast('Checked in successfully!', 'success');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.error?.message ?? 'Check-in failed', 'error');
    },
  });

  const { mutateAsync: uploadPhoto, isPending: isUploadingPhoto } = useMutation({
    mutationFn: ({ type, file }: { type: 'before' | 'after'; file: File }) =>
      jobService.uploadJobPhoto(jobId, type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', jobId] });
    },
  });

  const handleCheckIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCheckInLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          checkIn({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ?? undefined,
          });
        },
        () => {
          showToast('Failed to get location. Please enable location services.', 'error');
        }
      );
    }
  };

  const handlePhotoUpload = async (type: 'before' | 'after', files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      try {
        await uploadPhoto({ type, file });
      } catch {
        showToast(`Failed to upload ${type} photo`, 'error');
        return;
      }
    }
    if (type === 'before') {
      setBeforePhotos((prev) => [...prev, ...fileArray]);
    } else {
      setAfterPhotos((prev) => [...prev, ...fileArray]);
    }
    showToast(`${type === 'before' ? 'Before' : 'After'} photos uploaded!`, 'success');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <SkeletonList items={6} />
          </div>
        </main>
      </div>
    );
  }

  if (error || !data?.booking) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <ErrorDisplay
              error={error || new Error('Job not found')}
              onRetry={() => window.location.reload()}
              variant="card"
              title="Job Not Found"
            />
          </div>
        </main>
      </div>
    );
  }

  const job = data.booking as typeof data.booking & { client?: { name?: string; rating?: number } };
  const canStart = job.status === 'accepted' || job.status === 'pending';
  const canComplete = job.status === 'in_progress';
  const isCompleted = job.status === 'completed';

  // Clock-in window: opens 15 min before scheduled start
  const scheduledStart = job.scheduled_start_at ? new Date(job.scheduled_start_at).getTime() : 0;
  const clockInWindowStart = scheduledStart - 15 * 60 * 1000;
  const now = Date.now();
  const clockInBanner =
    isCompleted || job.status === 'cancelled'
      ? null
      : now < clockInWindowStart
        ? Math.ceil((clockInWindowStart - now) / 60000)
        : now <= scheduledStart + 30 * 60 * 1000
          ? 'open'
          : null;

  // Goals this job helps: from API or fallback
  const jobHelpsGoals =
    Array.isArray(goalsList) && goalsList.length > 0
      ? goalsList.slice(0, 4).map((g) => g.title ?? g.type ?? g.id).filter(Boolean)
      : ['Add-on completion', 'On-time completion', 'Before & after photos'];

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Header />
      <main className="flex-1 py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <a href="/cleaner" className="text-sm font-medium text-gray-600 hover:text-gray-900 mb-2 inline-block">← Back to home</a>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Job Details</h1>
              <p className="text-gray-600 mt-1">Job ID: {job.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isCompleted && job.status !== 'cancelled' && (
                <Button
                  variant="primary"
                  onClick={() => router.push(`/cleaner/job/${jobId}/workflow`)}
                >
                  Open workflow
                </Button>
              )}
              <Button variant="ghost" onClick={() => router.push('/cleaner')}>
                ← Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Gamification: clock-in banner + "This job helps" tags */}
          {clockInBanner !== null && (
            <div className="mb-6 space-y-3">
              {typeof clockInBanner === 'number' && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2 text-amber-800">
                  <Clock className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    Clock-in window opens in {clockInBanner} minute{clockInBanner !== 1 ? 's' : ''}.
                  </span>
                </div>
              )}
              {clockInBanner === 'open' && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2 text-green-800">
                  <Clock className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">You can clock in now.</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">This job helps:</span>
                {jobHelpsGoals.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: 'var(--brand-cloud)', color: 'var(--brand-blue)' }}
                  >
                    <Target className="h-3 w-3" />
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job checklist: clock in, send update, photos */}
              {(canStart || canComplete || isCompleted) && (
                <Card className="border-blue-100 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Job checklist
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Clock in / out</span>
                      {checkInLocation || job.status === 'in_progress' || isCompleted ? (
                        <span className="text-green-600 text-sm font-medium">Done</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            handleCheckIn();
                            if (canStart) updateJobStatus({ eventType: 'job_started' });
                          }}
                          isLoading={isUpdating || isCheckingIn}
                        >
                          Clock In
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Send update (template)</span>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/messages?jobId=${job.id}`)}>
                        Send Update
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Before photo (at least 1)</span>
                      {beforePhotos.length >= 1 ? (
                        <span className="text-green-600 text-sm font-medium">Uploaded</span>
                      ) : (
                        <span className="text-amber-600 text-sm">Remember: before + after photo</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">After photo (at least 1)</span>
                      {afterPhotos.length >= 1 ? (
                        <span className="text-green-600 text-sm font-medium">Uploaded</span>
                      ) : (
                        <span className="text-amber-600 text-sm">Required to complete</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>
                        <Camera className="h-4 w-4 mr-1" />
                        Upload Photos
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-600"
                        onClick={() => showToast('Report safety concern: use Support or in-app reporting when available.', 'info')}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Report Safety Concern
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Status</CardTitle>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getJobStatusBadgeClass(job.status)}`}>
                      {getJobStatusLabel(job.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Status Timeline */}
                  <div className="space-y-4">
                    {['pending', 'accepted', 'in_progress', 'completed'].map((status, index) => {
                      const statusOrder = ['pending', 'accepted', 'in_progress', 'completed'];
                      const currentIndex = statusOrder.indexOf(job.status);
                      const isActive = currentIndex >= index;
                      const isCurrent = job.status === status;
                      return (
                        <div key={status} className="flex items-start gap-4">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isActive ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-xs font-semibold">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className={`font-medium ${isCurrent ? 'text-blue-600' : isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                              {getJobStatusLabel(status)}
                            </p>
                            {isCurrent && (
                              <p className="text-sm text-gray-600 mt-1">
                                {status === 'pending' && 'Waiting for you to accept...'}
                                {status === 'accepted' && 'Job accepted. Ready to start when scheduled.'}
                                {status === 'in_progress' && 'Job is in progress. Complete when finished.'}
                                {status === 'completed' && 'Job completed successfully!'}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Job Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Service Type</label>
                      <p className="text-gray-900 capitalize">{job.service_type?.replace('_', ' ') || 'Standard Cleaning'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date</label>
                      <p className="text-gray-900">{format(new Date(job.scheduled_start_at), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Time</label>
                      <p className="text-gray-900">
                        {format(new Date(job.scheduled_start_at), 'h:mm a')} - {format(new Date(job.scheduled_end_at), 'h:mm a')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Duration</label>
                      <p className="text-gray-900">
                        {Math.round((new Date(job.scheduled_end_at).getTime() - new Date(job.scheduled_start_at).getTime()) / (1000 * 60 * 60))} hours
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900">{job.address}</p>
                      {directionsData && typeof directionsData === 'object' && 'directionsUrl' in directionsData ? (
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open((directionsData as { directionsUrl: string }).directionsUrl, '_blank');
                            }}
                            className="flex items-center gap-2"
                          >
                            <Navigation className="h-4 w-4" />
                            Get Directions
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const query = encodeURIComponent(job.address);
                              window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                            }}
                            className="flex items-center gap-2"
                          >
                            <MapPin className="h-4 w-4" />
                            View on Map
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    {job.client_notes && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Special Instructions</label>
                        <p className="text-gray-900">{job.client_notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Client Information */}
              {job.client_id && (
                <Card>
                  <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                        {job.client?.name?.[0] || 'C'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{job.client?.name || 'Client'}</h3>
                        <p className="text-sm text-gray-600">
                          {job.client?.rating ? `⭐ ${job.client.rating}` : 'New client'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/messages?jobId=${job.id}`)}
                      >
                        Message Client
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Photo Upload */}
              {(canStart || canComplete || isCompleted) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Job Photos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Before Photos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Before Photos (Required: Minimum 2)
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {beforePhotos.map((photo, idx) => (
                          <div key={idx} className="relative aspect-square">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Before ${idx + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              onClick={() => setBeforePhotos(beforePhotos.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handlePhotoUpload('before', e.target.files)}
                        className="text-sm"
                      />
                    </div>

                    {/* After Photos */}
                    {(canComplete || isCompleted) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          After Photos (Required: Minimum 2)
                        </label>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {afterPhotos.map((photo, idx) => (
                            <div key={idx} className="relative aspect-square">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`After ${idx + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                onClick={() => setAfterPhotos(afterPhotos.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handlePhotoUpload('after', e.target.files)}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canStart && (
                    <>
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => {
                          handleCheckIn();
                          updateJobStatus({ eventType: 'job_started' });
                        }}
                        isLoading={isUpdating || isCheckingIn}
                      >
                        Check In & Start Job
                      </Button>
                      <p className="text-xs text-gray-600 text-center">
                        Check-in uses your GPS location to verify you're at the job site.
                      </p>
                    </>
                  )}
                  {canComplete && (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => {
                        if (afterPhotos.length < 2) {
                          showToast('Please upload at least 2 after photos before completing', 'error');
                          return;
                        }
                        updateJobStatus({ eventType: 'job_completed' });
                      }}
                      isLoading={isUpdating}
                    >
                      Complete Job
                    </Button>
                  )}
                  {isCompleted && (
                    <div className="text-center py-4">
                      <p className="text-green-600 font-semibold mb-2">✓ Job Completed</p>
                      <p className="text-sm text-gray-600">Waiting for client approval.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Credits Earned</span>
                      <span className="font-medium">{job.credit_amount || 0} credits</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">USD Amount</span>
                      <span className="font-medium">{formatCurrency((job.credit_amount || 0) * 10)}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Total Earnings</span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency((job.credit_amount || 0) * 10)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {checkInLocation && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-gray-600 mb-2">Check-in Location:</p>
                      <p className="text-xs font-mono">
                        {checkInLocation.lat.toFixed(6)}, {checkInLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
