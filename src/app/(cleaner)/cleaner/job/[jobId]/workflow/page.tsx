'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { JobStepper, type StepKey } from '@/components/job/JobStepper';
import { GradientButton } from '@/components/brand/GradientButton';
import {
  sendEnRoute,
  markArrived,
  submitJob,
  getJobTimeline,
  getJobPhotos,
} from '@/services/jobs';
import type { TimelineEvent } from '@/services/jobs';

async function getCurrentLocation(): Promise<GeolocationCoordinates> {
  const pos = await new Promise<GeolocationPosition>((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej, {
      enableHighAccuracy: true,
      timeout: 10000,
    })
  );
  return pos.coords;
}

export default function CleanerWorkflowPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const r = useRouter();
  const [active, setActive] = useState<StepKey>('enroute');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (!jobId) return;
    getJobTimeline(jobId)
      .then((tl) => {
        setTimeline(tl);
        const types = new Set(tl.map((e) => e.type));
        if (types.has('job_submitted')) setActive('submit');
        else if (types.has('after_photos_uploaded')) setActive('submit');
        else if (types.has('before_photos_uploaded')) setActive('clean');
        else if (types.has('gps_check_in')) setActive('before');
        else if (types.has('en_route_sent')) setActive('checkin');
      })
      .catch(() => {});
  }, [jobId]);

  const types = new Set(timeline.map((e) => e.type));
  const hasBefore = types.has('before_photos_uploaded');
  const hasAfter = types.has('after_photos_uploaded');
  const canSubmit = hasBefore && hasAfter;
  const beforeCount = hasBefore ? 1 : 0;
  const afterCount = hasAfter ? 1 : 0;
  const submitGuardrail =
    active === 'submit' && !canSubmit
      ? `Add at least 1 before and 1 after photo. You have ${beforeCount} before, ${afterCount} after. Then you can submit to the client.`
      : null;

  async function primaryAction() {
    if (!jobId) return;

    if (active === 'submit' && !canSubmit) {
      return; // guardrail: no submit without before+after
    }

    if (active === 'enroute') {
      const coords = await getCurrentLocation();
      await sendEnRoute(jobId, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });
      setActive('checkin');
      return;
    }

    if (active === 'checkin') {
      const coords = await getCurrentLocation();
      await markArrived(jobId, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });
      setActive('before');
      return;
    }

    if (active === 'before') {
      r.push(`/cleaner/job/${jobId}/upload?kind=before`);
      return;
    }

    if (active === 'after') {
      r.push(`/cleaner/job/${jobId}/upload?kind=after`);
      return;
    }

    if (active === 'submit') {
      const photos = await getJobPhotos(jobId);
      const afterUrls = photos.after.map((p) => p.url);
      if (afterUrls.length === 0) return; // guardrail already shown in UI
      await submitJob(jobId, afterUrls);
      r.push(`/client/job/${jobId}`);
      return;
    }

    if (active === 'clean') setActive('after');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <JobStepper
        active={active}
        onSetActive={setActive}
        onPrimary={primaryAction}
        submitDisabled={active === 'submit' && !canSubmit}
        guardrailMessage={submitGuardrail}
      />

      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Photos required</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Before: {beforeCount} of 1 • After: {afterCount} of 1
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {submitGuardrail && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {submitGuardrail}
            </div>
          )}
          <GradientButton onClick={() => r.push(`/cleaner/job/${jobId}/upload?kind=before`)}>
            Upload before photos
          </GradientButton>
          <GradientButton onClick={() => r.push(`/cleaner/job/${jobId}/upload?kind=after`)}>
            Upload after photos
          </GradientButton>
          <button
            type="button"
            onClick={() => r.push(`/cleaner/job/${jobId}/tracking`)}
            className="w-full rounded-2xl border-2 border-blue-600 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Full check-in / check-out (tracking + photos)
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
