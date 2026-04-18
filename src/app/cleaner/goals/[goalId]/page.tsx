'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { cleanerGamificationService } from '@/services/cleanerGamification.service';

type GoalItem = {
  id?: string;
  title?: string;
  type?: string;
  current?: number;
  target?: number;
  reward_preview?: string;
  counts_when?: string;
};

type GoalsResponse = GoalItem[] | { goals?: GoalItem[] } | undefined;

function GoalDetailContent() {
  const params = useParams();
  const goalId = (params?.goalId as string) || '';

  const { data: goalsData, isLoading, isError } = useQuery({
    queryKey: ['cleaner', 'goals'],
    queryFn: () => cleanerGamificationService.getGoals(),
    enabled: !!goalId,
  });

  const normalizedGoalsData = goalsData as GoalsResponse;
  const goals = Array.isArray(normalizedGoalsData)
    ? normalizedGoalsData
    : normalizedGoalsData?.goals ?? [];
  const goal = goals.find((g) => g.id === goalId);
  const title = goal?.title ?? goal?.type ?? (goalId || 'Goal');
  const current = goal?.current ?? 0;
  const target = (goal?.target ?? 45) as number;
  const rewardPreview = goal?.reward_preview ?? 'Priority Visibility 14 days';
  const countsWhen = goal?.counts_when ?? 'What counts / what doesn\'t (anti-gaming rules)';

  if (!goalId) {
    return (
      <div className="min-h-screen flex flex-col bg-app">
        <Header />
        <main className="flex-1 py-8 px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <Link href="/cleaner/goals" className="text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 inline-block">← Back to Goals</Link>
            <p className="text-gray-600">Invalid goal.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-app">
        <Header />
        <main className="flex-1 py-8 px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <Link href="/cleaner/goals" className="text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 inline-block">← Back to Goals</Link>
            <p className="text-gray-500">Loading goal…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if ((isError || goals.length === 0) && !goal) {
    return (
      <div className="min-h-screen flex flex-col bg-app">
        <Header />
        <main className="flex-1 py-8 px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <Link href="/cleaner/goals" className="text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 inline-block">← Back to Goals</Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Goal not found</h1>
            <p className="text-gray-600">This goal may not exist or may not apply to your level.</p>
            <Link href="/cleaner/goals"><Button variant="outline" className="mt-4">Back to Goals</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-app">
      <Header />
      <main className="flex-1 py-8 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/cleaner/goals" className="text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 inline-block">← Back to Goals</Link>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Goal Detail</h1>
          <p className="text-gray-600 mb-6">{title}</p>

          <Card className="rounded-2xl border-gray-200">
            <CardHeader>
              <CardTitle>Requirement</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{title}</p>
              <Progress value={current} max={target} showLabel size="md" className="mt-2" />
              <p className="text-xs text-gray-500 mt-2">{countsWhen}</p>
              <p className="text-sm font-medium mt-2" style={{ color: 'var(--brand-blue)' }}>Reward: {rewardPreview}</p>
            </CardContent>
          </Card>

          <div className="flex gap-2 mt-4">
            <Link href="/cleaner/jobs">
              <Button variant="primary">Do Next Step</Button>
            </Link>
            <Button variant="outline">View Reward Preview</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function GoalDetailPage() {
  return (
    <ProtectedRoute requiredRole="cleaner">
      <GoalDetailContent />
    </ProtectedRoute>
  );
}
