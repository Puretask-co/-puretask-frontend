// src/app/client/appointments/[bookingId]/live-trust/page.tsx
// Live appointment (Trust): stepper, ETA, map placeholder, photos, checklist, events; 501 handling

'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  useLiveAppointment,
  usePostAppointmentEvent,
} from '@/hooks/useLiveAppointmentTrust';
import type { ApiError } from '@/lib/apiClient';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  MapPin,
  Clock,
  Image as ImageIcon,
  CheckSquare,
  Map,
  Calendar,
} from 'lucide-react';
import type { AppointmentState } from '@/types/trust';

const STATES: AppointmentState[] = [
  'scheduled',
  'en_route',
  'arrived',
  'checked_in',
  'completed',
];

function LiveTrustContent() {
  const params = useParams();
  const bookingId = params.bookingId as string;

  const liveQ = useLiveAppointment(bookingId);
  const postEvent = usePostAppointmentEvent(bookingId);
  const [lastActionType, setLastActionType] = React.useState<
    'en_route' | 'arrived' | 'check_in' | 'check_out' | null
  >(null);

  const send = (type: 'en_route' | 'arrived' | 'check_in' | 'check_out') => {
    setLastActionType(type);
    postEvent.mutate({ type, source: 'device' });
  };

  const postEventStatus =
    postEvent.error &&
    typeof postEvent.error === 'object' &&
    'status' in postEvent.error &&
    typeof (postEvent.error as { status?: unknown }).status === 'number'
      ? ((postEvent.error as { status: number }).status as ApiError['status'])
      : undefined;
  const apiError =
    postEvent.error &&
    typeof postEvent.error === 'object' &&
    'message' in postEvent.error &&
    typeof (postEvent.error as { message?: unknown }).message === 'string'
      ? ((postEvent.error as { message: string }) as ApiError)
      : undefined;

  const is501 =
    postEvent.isError &&
    postEventStatus === 501 &&
    (lastActionType === 'check_in' || lastActionType === 'check_out');

  const data = liveQ.data;
  const stateIndex = data?.state
    ? Math.max(0, STATES.indexOf(data.state as AppointmentState))
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8 px-6 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Live appointment</h1>
        <p className="text-gray-600 mb-6">Booking {bookingId}</p>

        {liveQ.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : liveQ.isError ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-700">Failed to load live appointment. Not found or no access.</p>
            </CardContent>
          </Card>
        ) : !data ? null : (
          <>
            {/* 501: Use full check-in with photos */}
            {is501 && (
              <Card className="mb-6 border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <p className="text-amber-800 font-medium mb-2">
                    Check-in and check-out require photos
                  </p>
                  <p className="text-sm text-amber-700 mb-3">
                    Use the full job workflow to check in with before photos and check out with after
                    photos.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/cleaner/jobs">
                      <Button variant="outline" size="sm">
                        My jobs
                      </Button>
                    </Link>
                    <span className="text-xs text-amber-600 self-center">
                      Then open a job → &quot;Full check-in / check-out (tracking + photos)&quot;
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status stepper */}
            <Card className="mb-6 border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Status
                </h2>
                <div className="flex items-center justify-between gap-2">
                  {STATES.map((s, i) => (
                    <React.Fragment key={s}>
                      <div
                        className={`flex flex-col items-center ${
                          i <= stateIndex ? 'text-blue-600 font-medium' : 'text-gray-400'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                            i < stateIndex
                              ? 'bg-blue-600 text-white'
                              : i === stateIndex
                                ? 'bg-blue-100 text-blue-700 border-2 border-blue-600'
                                : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {i < stateIndex ? '✓' : i + 1}
                        </div>
                        <span className="mt-1 text-xs capitalize">
                          {s.replace('_', ' ')}
                        </span>
                      </div>
                      {i < STATES.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 rounded ${
                            i < stateIndex ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ETA */}
            {data.etaISO && (
              <Card className="mb-6 border border-blue-100 bg-blue-50/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="text-blue-900 font-medium">
                    Arriving by {new Date(data.etaISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Map placeholder + GPS */}
            <Card className="mb-6 border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl bg-gray-100 border border-gray-200 h-48 flex items-center justify-center text-gray-500 mb-4">
                  {data.gps?.length > 0 ? (
                    <div className="text-center p-4">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium">Map view (GPS data available)</p>
                      <p className="text-xs mt-1">
                        {data.gps.length} point(s) • Latest:{' '}
                        {new Date(data.gps[data.gps.length - 1].atISO).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Waiting for location
                    </span>
                  )}
                </div>
                {data.gps?.length > 0 && (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {data.gps.slice(-5).reverse().map((g) => (
                      <li key={g.id}>
                        {g.event} • {new Date(g.atISO).toLocaleString()} • ±{g.accuracyM ?? '?'}m
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Photos */}
            <Card className="mb-6 border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.photos?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.photos.map((p) => (
                      <div key={p.id} className="rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={p.url}
                          alt={p.kind}
                          className="w-full aspect-square object-cover"
                        />
                        <p className="text-xs p-2 text-gray-500 capitalize">
                          {p.kind} • {new Date(p.createdAtISO).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No photos yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Checklist */}
            {data.checklist?.length > 0 && (
              <Card className="mb-6 border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.checklist.map((c) => (
                      <li
                        key={c.id}
                        className={`flex items-center gap-2 text-sm ${
                          c.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}
                      >
                        {c.completed ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="w-4 h-4 rounded border border-gray-300" />
                        )}
                        {c.label}
                        {c.completedAtISO && (
                          <span className="text-xs text-gray-400">
                            {new Date(c.completedAtISO).toLocaleString()}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Cleaner actions (demo) — show for cleaner role; client sees read-only */}
            <Card className="mb-6 border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => send('en_route')}
                    disabled={postEvent.isPending}
                  >
                    En route
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => send('arrived')}
                    disabled={postEvent.isPending}
                  >
                    Arrived
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => send('check_in')}
                    disabled={postEvent.isPending}
                  >
                    Check in
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => send('check_out')}
                    disabled={postEvent.isPending}
                  >
                    Check out
                  </Button>
                </div>
                {postEvent.isPending && <p className="mt-2 text-sm text-gray-500">Posting…</p>}
                {postEvent.isError && !is501 && (
                  <p className="mt-2 text-sm text-red-600">
                    {apiError?.message ?? 'Failed to post event.'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Events timeline */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.events?.length > 0 ? (
                  <ul className="space-y-2">
                    {data.events.map((ev) => (
                      <li key={ev.id} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-gray-400 shrink-0">
                          {new Date(ev.atISO).toLocaleString()}
                        </span>
                        <span>
                          {ev.type}: {ev.summary}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No events yet.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function LiveTrustPage() {
  return (
    <ProtectedRoute>
      <LiveTrustContent />
    </ProtectedRoute>
  );
}