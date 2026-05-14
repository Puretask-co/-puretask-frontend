'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { GradientButton } from '@/components/brand/GradientButton';
import { JobTimeline } from '@/components/job/JobTimeline';
import { BeforeAfterGallery } from '@/components/job/BeforeAfterGallery';
import {
  getJob,
  getJobPhotos,
  getJobTimeline,
  type JobPhotos,
  type TimelineEvent,
} from '@/services/jobs';
import { Button } from '@/components/ui/Button';
import { ApprovalRatingModal } from '@/components/job/ApprovalRatingModal';

export default function ClientJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const r = useRouter();

  const [job, setJob] = useState<Awaited<ReturnType<typeof getJob>> | null>(null);
  const [photos, setPhotos] = useState<JobPhotos | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        setJob(await getJob(jobId));
        setPhotos(await getJobPhotos(jobId));
        setTimeline(await getJobTimeline(jobId));
      } catch {
        setJob(null);
      }
    })();
  }, [jobId]);

  if (!job) return <div className="text-sm opacity-70">Loading job…</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="rounded-3xl border-0 shadow-sm lg:col-span-3">
        <CardHeader>
          <CardTitle>Review & approve</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">{job.addressLabel}</div>
            <div className="text-xs opacity-70">
              Job: {job.id} • Status: {job.status}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">Timeline</div>
            <div className="mt-3">
              <JobTimeline events={timeline} />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">Before / After</div>
            <div className="mt-3">
              <BeforeAfterGallery
                before={photos?.before ?? []}
                after={photos?.after ?? []}
                variant="slider"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <GradientButton onClick={() => setShowApproveModal(true)}>
              Approve & release funds
            </GradientButton>

            <Button
              variant="outline"
              className="rounded-full px-6 py-6"
              onClick={() => r.push(`/client/job/${jobId}/dispute`)}
            >
              Open dispute
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle>Trust receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm opacity-80">
          <p>Check-in/out timestamps, cleaner reliability badge, photo proof count, dispute window reminder.</p>
        </CardContent>
      </Card>

      {jobId && (
        <ApprovalRatingModal
          jobId={jobId}
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          onApproved={() => r.push('/client/bookings')}
        />
      )}
    </div>
  );
}
