'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LevelBadge } from '@/components/gamification';
import { GoalChecklist, StretchGoalPicker } from '@/components/gamification';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { cleanerGamificationService } from '@/services/cleanerGamification.service';

type GoalLike = {
  id: string;
  type?: string;
  title?: string;
  current?: number;
  target?: number;
  counts_when?: string;
  reward_preview?: string;
};

function LevelDetailContent() {
  const params = useParams();
  const levelNumber = Number(params?.levelNumber) || 1;

  const { data: goalsData, isLoading } = useQuery({
    queryKey: ['cleaner', 'goals'],
    queryFn: () => cleanerGamificationService.getGoals(),
  });

  const goalsPayload = goalsData as GoalLike[] | { goals?: GoalLike[] } | undefined;
  const goals: GoalLike[] = Array.isArray(goalsPayload) ? goalsPayload : goalsPayload?.goals ?? [];
  const coreGoals = goals.filter((g) => g.type === 'core' || !g.type);
  const stretchGoals = goals.filter((g) => g.type === 'stretch');
  const checklistGoals = coreGoals.map((g) => ({
    id: g.id,
    title: g.title ?? g.type ?? g.id,
    progress: g.current ?? 0,
    target: (g.target ?? 1) as number,
    detailHref: `/cleaner/goals/${g.id}`,
    actionHref: '/cleaner/jobs',
    countsWhen: g.counts_when,
    rewardPreview: g.reward_preview,
    completed: (g.current ?? 0) >= (g.target ?? 1),
  }));
  const stretchOptions = stretchGoals.map((g) => ({
    id: g.id,
    title: g.title ?? g.type ?? g.id,
    description: g.reward_preview ?? 'Complete to unlock',
  }));

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Header />
      <main className="flex-1 py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <Link href="/cleaner/progress" className="text-sm font-medium text-gray-600 hover:text-gray-900 mb-2 inline-block">← Back to Progress</Link>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Level {levelNumber}</h1>
              <p className="text-gray-600 mt-1">What you can unlock here.</p>
            </div>
          </div>

          <LevelBadge level={levelNumber} label="Detail" size="lg" className="mb-6" />

          {isLoading && <p className="text-gray-500 text-sm mb-4">Loading goals…</p>}

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="rounded-2xl border-gray-200">
                <CardHeader>
                  <CardTitle>Core Goals (required)</CardTitle>
                </CardHeader>
                <CardContent>
                  {checklistGoals.length > 0 ? (
                    <GoalChecklist goals={checklistGoals} variant="compact" />
                  ) : (
                    <p className="text-sm text-gray-600">Core goals will appear when available for your level.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-gray-200">
                <CardHeader>
                  <CardTitle>Stretch Goals (choose at least one)</CardTitle>
                </CardHeader>
                <CardContent>
                  {stretchOptions.length > 0 ? (
                    <StretchGoalPicker
                      options={stretchOptions}
                      selectedId={null}
                      onSelect={() => {}}
                      title="Select Stretch Goal"
                    />
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">Stretch goal picker will load here when available.</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Select Stretch Goal
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-gray-200">
                <CardHeader>
                  <CardTitle>Maintenance rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Ongoing compliance rules for this level (on-time rate, disputes, acceptance).
                  </p>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="rounded-2xl border-gray-200">
                <CardHeader>
                  <CardTitle>Reward Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Unlock rewards when you complete core + stretch goals.
                  </p>
                  <Link href="/cleaner/rewards">
                    <Button variant="primary" size="sm" className="mt-2">
                      View Rewards
                    </Button>
                  </Link>
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

export default function LevelDetailPage() {
  return (
    <ProtectedRoute requiredRole="cleaner">
      <LevelDetailContent />
    </ProtectedRoute>
  );
}
