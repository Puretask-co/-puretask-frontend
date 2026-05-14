'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StatsOverview } from '@/components/features/dashboard/StatsOverview';
import { BookingCard } from '@/components/features/dashboard/BookingCard';
import { ActivityFeed } from '@/components/features/dashboard/ActivityFeed';
import { FiveStarReviewWatcher } from '@/components/features/reviews/FiveStarReviewWatcher';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ErrorDisplay } from '@/components/error/ErrorDisplay';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useBookings } from '@/hooks/useBookings';
import { useQuery } from '@tanstack/react-query';
import { cleanerEnhancedService } from '@/services/cleanerEnhanced.service';
import { BarChart, DonutChart, LineChart } from '@/components/ui/Charts';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TrendingUp, Target, Award, Star, Calendar } from 'lucide-react';

export default function CleanerDashboardPage() {
  return (
    <ProtectedRoute requiredRole="cleaner">
      <CleanerDashboardContent />
    </ProtectedRoute>
  );
}

function CleanerDashboardContent() {
  const { data: bookingsData, isLoading } = useBookings();
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['cleaner', 'dashboard', 'analytics', 'month'],
    queryFn: async () => {
      const res = await cleanerEnhancedService.getDashboardAnalytics('month');
      return (res ?? {}) as { analytics?: Record<string, unknown> };
    },
  });
  const { data: goalsData } = useQuery({
    queryKey: ['cleaner', 'goals'],
    queryFn: async () => {
      const res = await cleanerEnhancedService.getGoals();
      return (res ?? {}) as { goals?: Record<string, unknown> };
    },
  });
  const bookings = bookingsData?.bookings || [];
  const analytics = (analyticsData?.analytics ?? {}) as Record<string, unknown> & {
    earningsTrend?: Array<{ date?: string; earnings?: number }>;
    jobsTrend?: Array<{ count?: number }>;
    ratingTrend?: Array<{ avg_rating?: number }>;
    platformAverage?: { avg_earnings?: number };
  };
  const goals = (goalsData?.goals ?? {}) as Record<string, { target?: number; period?: string }>;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-app">
        <Header />
        <main className="flex-1 py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <SkeletonList items={6} />
          </div>
        </main>
      </div>
    );
  }

  // Calculate stats
  const upcomingBookings = bookings.filter(
    (b: any) => b.status === 'scheduled' || b.status === 'confirmed'
  );
  const completedBookings = bookings.filter((b: any) => b.status === 'completed');
  const totalEarnings = completedBookings.reduce(
    (sum: number, b: any) => sum + (b.total_price || 0),
    0
  );
  const avgRating = 4.8; // This would come from API

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: <Calendar className="h-10 w-10" />, color: '', accent: 'blue' as const, href: '/cleaner/calendar' },
    { label: 'Upcoming', value: upcomingBookings.length, icon: <Target className="h-10 w-10" />, color: 'text-[var(--brand-mint)]', accent: 'green' as const, href: '/cleaner/today' },
    { label: 'Total Earnings', value: `$${totalEarnings.toFixed(0)}`, icon: <Award className="h-10 w-10" />, color: 'text-purple-500', accent: 'purple' as const, href: '/cleaner/earnings' },
    { label: 'Avg Rating', value: avgRating.toFixed(1), icon: <Star className="h-10 w-10" />, color: 'text-amber-500', accent: 'amber' as const, href: '/cleaner/reviews' },
  ];

  // Service type distribution
  const serviceTypes = bookings.reduce((acc: any, b: any) => {
    acc[b.service_type] = (acc[b.service_type] || 0) + 1;
    return acc;
  }, {});

  const serviceChartData = Object.entries(serviceTypes).map(([type, count]) => ({
    label: type.replace('_', ' '),
    value: count as number,
  }));

  // Earnings by month
  const monthlyEarnings = completedBookings
    .reduce((acc: any[], b: any) => {
      const month = format(new Date(b.scheduled_start_at), 'MMM');
      const existing = acc.find((item) => item.label === month);
      if (existing) {
        existing.value += b.total_price;
      } else {
        acc.push({ label: month, value: b.total_price });
      }
      return acc;
    }, [])
    .slice(-6);

  // Activity feed
  const getActivityType = (status: string): 'booking_created' | 'booking_completed' =>
    status === 'completed' ? 'booking_completed' : 'booking_created';
  const activities = bookings.slice(0, 5).map((b: any) => ({
    id: b.id,
    type: getActivityType(b.status ?? ''),
    title:
      b.status === 'completed'
        ? 'Job Completed'
        : b.status === 'scheduled'
        ? 'New Booking'
        : 'Booking Update',
    description: `${b.service_type} cleaning at ${b.address}`,
    timestamp: b.created_at,
    meta: {
      amount: b.total_price,
      status: b.status,
    },
  }));

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <FiveStarReviewWatcher />
      <Header />
      <main className="flex-1 py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="mb-8 rounded-2xl border border-[var(--brand-mint)]/20 px-6 py-5 shadow-sm"
            style={{ background: 'linear-gradient(135deg, rgba(40,199,111,0.06) 0%, rgba(0,212,255,0.03) 100%)' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cleaner dashboard</h1>
                <p className="text-gray-600 mt-1">Your schedule, earnings, and performance at a glance.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => (window.location.href = '/cleaner/availability')} className="border-[var(--brand-blue)]/40 text-[var(--brand-blue)]">
                  Set availability
                </Button>
                <Button variant="primary" onClick={() => (window.location.href = '/cleaner/calendar')}>
                  View calendar
                </Button>
              </div>
            </div>
          </div>

          <StatsOverview stats={stats} />

          {/* Performance Analytics & Goals */}
          {analytics && (
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {/* Earnings Trend */}
              {analytics.earningsTrend && analytics.earningsTrend.length > 0 && (
                <Card className="rounded-2xl border-gray-200 card-interactive">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Earnings Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={analytics.earningsTrend.map((item: any) => ({
                        label: format(new Date(item.date), 'MMM d'),
                        value: Number(item.earnings ?? 0),
                      }))}
                      title=""
                      height={200}
                    />
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Platform Average</span>
                        <span className="font-semibold">
                          ${Number(analytics.platformAverage?.avg_earnings ?? 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {goals && Object.keys(goals).length > 0 && (
                <Card className="rounded-2xl border-gray-200 card-interactive">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Your Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(goals).map(([type, goal]: [string, any]) => (
                      <div key={type} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">{type}</span>
                          <span className="text-sm text-gray-600">
                            Target: ${goal.target || 0} / {goal.period}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: '60%', backgroundColor: 'var(--brand-blue)' }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">60% complete</p>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => (window.location.href = '/cleaner/goals')}
                    >
                      Set New Goal
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="md:col-span-2 rounded-2xl border-gray-200 card-interactive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {analytics.jobsTrend && analytics.jobsTrend.length > 0 && (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {analytics.jobsTrend.reduce((sum: number, item: any) => sum + parseInt(item.count || 0), 0)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Jobs This Month</p>
                      </div>
                    )}
                    {analytics.ratingTrend && analytics.ratingTrend.length > 0 && (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {Number(analytics.ratingTrend[analytics.ratingTrend.length - 1]?.avg_rating ?? 0).toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Current Rating</p>
                      </div>
                    )}
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {(analytics.platformAverage?.avg_earnings ?? 0) > totalEarnings ? 'Below' : 'Above'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Platform Average</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6 mt-8">
            {/* Left Column - Bookings & Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Bookings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Today&apos;s schedule</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (window.location.href = '/cleaner/today')}
                    className="text-[var(--brand-blue)]"
                  >
                    View all
                  </Button>
                </div>
                {upcomingBookings.length > 0 ? (
                  <div className="grid gap-4">
                    {upcomingBookings.slice(0, 3).map((booking: any) => (
                      <div key={booking.id} className="rounded-2xl border border-gray-200 overflow-hidden">
                        <BookingCard
                        key={booking.id}
                        id={booking.id}
                        cleanerName={booking.client?.full_name || 'Client'}
                        date={format(new Date(booking.scheduled_start_at), 'MMM d, yyyy')}
                        time={format(new Date(booking.scheduled_start_at), 'h:mm a')}
                        service={booking.service_type}
                        address={booking.address}
                        status={booking.status}
                        price={booking.total_price}
                      />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                    <div className="text-4xl mb-3">✨</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">All clear</h3>
                    <p className="text-gray-600">No upcoming bookings for today.</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => (window.location.href = '/cleaner/jobs/requests')} style={{ borderColor: 'var(--brand-blue)', color: 'var(--brand-blue)' }}>
                      View new requests
                    </Button>
                  </div>
                )}
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                {monthlyEarnings.length > 0 && (
                  <BarChart data={monthlyEarnings} title="Monthly Earnings" height={250} />
                )}
                {serviceChartData.length > 0 && (
                  <DonutChart
                    data={serviceChartData}
                    title="Service Types"
                    size={200}
                    centerText={bookings.length.toString()}
                    centerSubtext="Total Jobs"
                  />
                )}
              </div>
            </div>

            {/* Right Column - Activity Feed */}
            <div className="lg:col-span-1">
              <ActivityFeed activities={activities} maxItems={10} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
