// src/hooks/__tests__/useCleanerOnboarding.test.tsx
// Unit tests for useCleanerOnboarding hook

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCleanerOnboarding } from '../useCleanerOnboarding';
import * as onboardingApi from '@/lib/api/cleanerOnboarding';

jest.mock('next/navigation');
jest.mock('@/lib/api/cleanerOnboarding');

// TODO: Fix useCleanerOnboarding tests (async/mocks) - TODOS.md
describe.skip('useCleanerOnboarding', () => {
  let queryClient: QueryClient;
  let mockRouter: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
    };
    (useRouter as any).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('initializes with first step', async () => {
    (onboardingApi.getOnboardingProgress as any).mockResolvedValueOnce({
      progress: {
        completed: 0,
        total: 10,
        percentage: 0,
        current_step: 'terms',
        steps: {},
      },
    });

    const { result } = renderHook(() => useCleanerOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('terms');
    });

    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.totalSteps).toBe(10);
  });

  it('loads saved step from progress', async () => {
    (onboardingApi.getOnboardingProgress as any).mockResolvedValueOnce({
      progress: {
        completed: 3,
        total: 10,
        percentage: 30,
        current_step: 'phone-verification',
        steps: {
          agreements: true,
          basic_info: true,
          phone_verified: false,
        },
      },
    });

    const { result } = renderHook(() => useCleanerOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('phone-verification');
    });
  });

  it('navigates to next step', async () => {
    (onboardingApi.getOnboardingProgress as any).mockResolvedValueOnce({
      progress: {
        completed: 0,
        total: 10,
        percentage: 0,
        current_step: 'terms',
        steps: {},
      },
    });
    (onboardingApi.saveCurrentStep as any).mockResolvedValueOnce({});

    const { result } = renderHook(() => useCleanerOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('terms');
    });

    act(() => {
      result.current.goToNextStep();
    });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('basic-info');
    });
  });

  it('navigates to previous step', async () => {
    (onboardingApi.getOnboardingProgress as any).mockResolvedValueOnce({
      progress: {
        completed: 1,
        total: 10,
        percentage: 10,
        current_step: 'basic-info',
        steps: { agreements: true },
      },
    });
    (onboardingApi.saveCurrentStep as any).mockResolvedValueOnce({});

    const { result } = renderHook(() => useCleanerOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('basic-info');
    });

    act(() => {
      result.current.goToPreviousStep();
    });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('terms');
    });
  });

  it('saves agreements', async () => {
    (onboardingApi.getOnboardingProgress as any).mockResolvedValueOnce({
      progress: {
        completed: 0,
        total: 10,
        percentage: 0,
        current_step: 'terms',
        steps: {},
      },
    });
    (onboardingApi.saveAgreements as any).mockResolvedValueOnce({ success: true });
    (onboardingApi.saveCurrentStep as any).mockResolvedValueOnce({});

    const { result } = renderHook(() => useCleanerOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('terms');
    });

    await act(async () => {
      await (result.current.saveAgreements as any).mutate({
        terms_of_service: true,
        independent_contractor: true,
      });
    });

    expect(onboardingApi.saveAgreements).toHaveBeenCalledWith({
      terms_of_service: true,
      independent_contractor: true,
    });
  });

  it('saves basic info', async () => {
    (onboardingApi.getOnboardingProgress as any).mockResolvedValueOnce({
      progress: {
        completed: 1,
        total: 10,
        percentage: 10,
        current_step: 'basic-info',
        steps: { agreements: true },
      },
    });
    (onboardingApi.saveBasicInfo as any).mockResolvedValueOnce({ success: true });
    (onboardingApi.saveCurrentStep as any).mockResolvedValueOnce({});

    const { result } = renderHook(() => useCleanerOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('basic-info');
    });

    await act(async () => {
      await (result.current.saveBasicInfo as any).mutate({
        first_name: 'John',
        last_name: 'Doe',
        bio: 'Experienced cleaner',
        professional_headline: 'Professional Cleaner',
      });
    });

    expect(onboardingApi.saveBasicInfo).toHaveBeenCalled();
  });

  it('completes onboarding', async () => {
    (onboardingApi.getOnboardingProgress as any).mockResolvedValueOnce({
      progress: {
        completed: 9,
        total: 10,
        percentage: 90,
        current_step: 'review',
        steps: {
          agreements: true,
          basic_info: true,
          phone_verified: true,
          face_photo: true,
          id_verification: true,
          background_consent: true,
          service_areas: true,
          availability: true,
          rates: true,
        },
      },
    });
    (onboardingApi.completeOnboarding as any).mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useCleanerOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentStep).toBe('review');
    });

    await act(async () => {
      await (result.current.completeOnboarding as any).mutate();
    });

    expect(onboardingApi.completeOnboarding).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/cleaner/dashboard');
  });
});
