'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { Loading } from '@/components/ui/Loading';
import { useCleaner, useCleanerReviews } from '@/hooks/useCleaners';
import { useQuery } from '@tanstack/react-query';
import { reliabilityService } from '@/services/reliability.service';
import { ReliabilityScoreCard } from '@/components/reliability/ReliabilityScoreCard';
import { ReliabilityBreakdownBars } from '@/components/reliability/ReliabilityBreakdownBars';
import { ReliabilityWhyThisMatch } from '@/components/reliability/ReliabilityWhyThisMatch';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { AvailabilityCalendar } from '@/components/features/cleaner/AvailabilityCalendar';
import { PhotoGallery } from '@/components/features/cleaner/PhotoGallery';
import { LevelBadge } from '@/components/gamification';
import { Award, HelpCircle } from 'lucide-react';

export default function CleanerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const cleanerId = params.id as string;
  const [reviewPage, setReviewPage] = useState(1);
  const [showWhatMeans, setShowWhatMeans] = useState(false);
  
  const { data: cleanerData, isLoading: loadingCleaner, isError: cleanerError } = useCleaner(cleanerId);
  const { data: reviewsData, isLoading: loadingReviews } = useCleanerReviews(cleanerId, reviewPage);
  const { data: reliabilityData } = useQuery({
    queryKey: ['reliability', cleanerId],
    queryFn: () => reliabilityService.getCleanerReliability(cleanerId),
    enabled: !!cleanerId,
  });

  // Support both { cleaner } and { data } response shapes from API
  type CleanerPayload = NonNullable<typeof cleanerData>;
  const cleaner = cleanerData?.cleaner ?? (cleanerData as (CleanerPayload & { data?: CleanerPayload['cleaner'] }) | undefined)?.data;

  if (loadingCleaner) {
    return <Loading size="lg" text="Loading cleaner profile..." fullScreen />;
  }

  if (!cleaner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-app">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Cleaner profile unavailable</h2>
            <p className="text-gray-600 mb-4">
              We couldn’t load this profile. The cleaner may not exist, the link might be wrong or outdated, or there was a connection problem.
            </p>
            {process.env.NODE_ENV === 'development' && cleanerId && (
              <p className="text-xs text-gray-500 mb-4 font-mono">ID requested: {cleanerId}</p>
            )}
            {cleanerError && (
              <p className="text-sm text-amber-700 mb-4">The server didn’t return this profile. Check that the backend is running and the cleaner ID exists.</p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => router.push('/search')}>Back to Search</Button>
              <Button variant="outline" onClick={() => router.push('/')}>Go to Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reviews = reviewsData?.reviews || [];
  // Trust signals for clients (level + top badges). Use API when available.
  const cleanerLevel = (cleaner as { level?: number }).level ?? null;
  const topBadges: { id: string; name: string; icon?: string }[] =
    (cleaner as { badges?: { id: string; name: string; icon?: string }[] }).badges?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            ← Back to Search
          </Button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <Avatar
                      src={cleaner.avatar_url}
                      alt={cleaner.name}
                      size="xl"
                      fallback={cleaner.name.charAt(0)}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h1 className="text-3xl font-bold text-gray-900">{cleaner.name}</h1>
                          <div className="flex items-center gap-2 mt-2">
                            <Rating value={cleaner.rating} readOnly />
                            <span className="font-semibold text-gray-900">
                              {cleaner.rating.toFixed(1)}
                            </span>
                            <span className="text-gray-600">({cleaner.reviews_count || 0} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {cleaner.verified && (
                          <Badge variant="success">✓ Verified</Badge>
                        )}
                        {cleaner.background_checked && (
                          <Badge variant="success">✓ Background Checked</Badge>
                        )}
                        {cleaner.rating >= 4.5 && (
                          <Badge variant="info">⭐ Top Rated</Badge>
                        )}
                      </div>
                      {/* Level + top badges (trust signals; no internal scoring exposed) */}
                      {(cleanerLevel != null || topBadges.length > 0) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex flex-wrap items-center gap-3">
                            {cleanerLevel != null && (
                              <LevelBadge level={cleanerLevel} size="md" />
                            )}
                            {topBadges.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-amber-500" />
                                <span className="text-sm text-gray-600">Top badges:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {topBadges.map((b) => (
                                    <span
                                      key={b.id}
                                      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200"
                                      title={b.name}
                                    >
                                      {b.icon ?? '🏅'} {b.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setShowWhatMeans(!showWhatMeans)}
                              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              <HelpCircle className="h-3.5 w-3.5" />
                              What this means
                            </button>
                          </div>
                          {showWhatMeans && (
                            <p className="text-xs text-gray-500 mt-2 max-w-md">
                              Level and badges reflect this cleaner’s track record on the platform—on-time jobs, quality photos, and positive reviews. 
                              They’re trust signals only; we don’t share internal scoring.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reliability (Trust-Fintech): score, tier, breakdown; empty state when unavailable */}
              <Card>
                <CardHeader>
                  <CardTitle>Reliability score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reliabilityData?.reliability ? (
                    <>
                      <ReliabilityScoreCard score={reliabilityData.reliability} showBreakdown />
                      <ReliabilityBreakdownBars breakdown={reliabilityData.reliability.breakdown} />
                      {reliabilityData.reliability.explainers?.length > 0 && (
                        <ReliabilityWhyThisMatch explainers={reliabilityData.reliability.explainers} />
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">Reliability data not available.</p>
                  )}
                </CardContent>
              </Card>

              {/* About */}
              {cleaner.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle>About Me</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{cleaner.bio}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      {cleaner.experience_years > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{cleaner.experience_years}</div>
                          <div className="text-sm text-gray-600">Years Experience</div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{cleaner.reviews_count || 0}</div>
                        <div className="text-sm text-gray-600">Reviews</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{cleaner.rating.toFixed(1)}</div>
                        <div className="text-sm text-gray-600">Rating</div>
                      </div>
                      {cleaner.location && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">📍</div>
                          <div className="text-sm text-gray-600">{cleaner.location}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Services & Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>Services & Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  {cleaner.services && cleaner.services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cleaner.services.map((service, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100"
                        >
                          <div>
                            <span className="font-medium text-gray-900 capitalize">
                              {service.replace('_', ' ')}
                            </span>
                            {cleaner.price_per_hour && (
                              <p className="text-sm text-gray-600 mt-1">
                                Starting at {formatCurrency(cleaner.price_per_hour)}/hr
                              </p>
                            )}
                          </div>
                          <span className="text-blue-600 text-xl">✓</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No services listed yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Availability Calendar */}
              <AvailabilityCalendar cleanerId={cleanerId} />

              {/* Photo Gallery */}
              {/* Note: Photos would come from a separate API endpoint */}
              {/* <PhotoGallery photos={[]} /> */}

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviews ({cleaner.reviews_count || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingReviews ? (
                    <div className="text-center py-8">
                      <Loading size="md" text="Loading reviews..." />
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <div key={review.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Avatar
                                alt={review.client_name || 'Client'}
                                size="sm"
                                fallback={(review.client_name || 'C').charAt(0)}
                              />
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {review.client_name || 'Anonymous'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </div>
                            <Rating value={review.rating} readOnly size="sm" />
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 mt-2">{review.comment}</p>
                          )}
                        </div>
                      ))}
                      {/* Load More Reviews */}
                      {reviewsData?.pagination && (reviewsData.pagination.total_pages ?? 0) > reviewPage && (
                        <div className="text-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setReviewPage(reviewPage + 1)}
                          >
                            Load More Reviews
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <p>No reviews yet. Be the first to review this cleaner!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-blue-600 mb-1">
                      {formatCurrency(cleaner.price_per_hour || 0)}
                      <span className="text-lg text-gray-600">/hr</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Starting rate
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full mb-3"
                    onClick={() => router.push(`/booking?cleaner=${cleaner.id}`)}
                  >
                    Book Now
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full mb-6"
                    onClick={() => router.push(`/messages?cleanerId=${cleaner.id}`)}
                  >
                    Send Message
                  </Button>

                  {cleaner.location && (
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                      <p className="text-sm text-gray-600">{cleaner.location}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => {
                          // Open in Google Maps
                          const query = encodeURIComponent(cleaner.location || '');
                          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                        }}
                      >
                        📍 View on Map
                      </Button>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Availability</h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">{cleaner.availability || 'Check calendar for availability'}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => {
                          // Scroll to availability section or show calendar
                          document.getElementById('availability-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        View Full Calendar
                      </Button>
                    </div>
                  </div>
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

