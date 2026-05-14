// src/hooks/useCleanerOnboarding.ts
// Main onboarding hook for state management and mutations

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  getOnboardingProgress,
  saveAgreements,
  saveBasicInfo,
  sendOTP,
  verifyOTP,
  uploadFacePhoto,
  uploadIDVerification,
  saveBackgroundConsent,
  saveServiceAreas,
  saveAvailability,
  saveRates,
  completeOnboarding,
  saveCurrentStep,
  type OnboardingProgress,
  type AgreementsData,
  type BasicInfoData,
  type PhoneVerificationData,
  type ServiceAreasData,
  type AvailabilityData,
  type RatesData,
  type BackgroundConsentData,
} from '@/lib/api/cleanerOnboarding';
import { qk } from '@/lib/queryKeys';

export type OnboardingStep = 
  | 'terms'
  | 'basic-info' 
  | 'phone-verification'
  | 'face-verification' 
  | 'id-verification' 
  | 'background-consent'
  | 'service-areas'
  | 'availability'
  | 'rates' 
  | 'review';

const STEPS: OnboardingStep[] = [
  'terms',
  'basic-info',
  'phone-verification',
  'face-verification',
  'id-verification',
  'background-consent',
  'service-areas',
  'availability',
  'rates',
  'review',
];

export function useCleanerOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('terms');
  const [isInitialized, setIsInitialized] = useState(false);
  const [completedData, setCompletedData] = useState({
    serviceAreasCount: 0,
    availableDays: 0,
  });

  // Get onboarding progress (includes current step)
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: qk.onboardingProgress,
    queryFn: getOnboardingProgress,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const progress = progressData?.progress || {
    completed: 0,
    total: 10,
    percentage: 0,
    current_step: 'terms',
    steps: {} as OnboardingProgress['steps'],
  };

  // Load saved step from progress data
  useEffect(() => {
    if (progressData?.progress?.current_step && !isInitialized) {
      const savedStep = progressData.progress.current_step as OnboardingStep | null;
      if (savedStep && STEPS.includes(savedStep)) {
        setCurrentStep(savedStep);
      }
      setIsInitialized(true);
    } else if (!progressLoading && !isInitialized) {
      // If no saved step, start at beginning
      setIsInitialized(true);
    }
  }, [progressData, progressLoading, isInitialized]);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const totalSteps = STEPS.length;
  const progressPercentage = progress.percentage;

  // Save step to database
  const saveStepToDatabase = async (step: OnboardingStep) => {
    try {
      await saveCurrentStep(step);
      queryClient.invalidateQueries({ queryKey: qk.onboardingProgress });
    } catch (error) {
      // Silently fail - step will still be saved in local state
      console.error('Failed to save step to database:', error);
    }
  };

  // Navigate to next step
  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      const nextStep = STEPS[nextIndex];
      setCurrentStep(nextStep);
      saveStepToDatabase(nextStep); // Persist to DB
    }
  };

  // Navigate to previous step (also save for persistence)
  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = STEPS[prevIndex];
      setCurrentStep(prevStep);
      saveStepToDatabase(prevStep); // Persist to DB
    }
  };


  // Step 1: Save agreements
  const saveAgreementsMutation = useMutation({
    mutationFn: saveAgreements,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.onboardingProgress });
      goToNextStep();
    },
  });

  // Step 2: Save basic info
  const saveBasicInfoMutation = useMutation({
    mutationFn: saveBasicInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.onboardingProgress });
      goToNextStep();
    },
  });

  // Step 3: Send OTP
  const sendOTPMutation = useMutation({
    mutationFn: (phone_number: string) => sendOTP(phone_number),
  });

  // Step 3: Verify OTP
  const verifyOTPMutation = useMutation({
    mutationFn: (data: PhoneVerificationData) => verifyOTP(data.phone_number, data.otp_code ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.onboardingProgress });
      goToNextStep();
    },
  });

  // Step 4: Upload face photo
  const uploadFacePhotoMutation = useMutation({
    mutationFn: uploadFacePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.onboardingProgress });
      goToNextStep();
    },
  });

  // Step 5: Upload ID verification
  const uploadIDVerificationMutation = useMutation({
    mutationFn: ({ file, document_type }: { file: File; document_type: 'drivers_license' | 'passport' | 'state_id' }) =>
      uploadIDVerification(file, document_type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.onboardingProgress });
      goToNextStep();
    },
  });

  // Step 6: Save background check consent
  const saveBackgroundConsentMutation = useMutation({
    mutationFn: saveBackgroundConsent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.onboardingProgress });
      goToNextStep();
    },
  });

  // Step 7: Save service areas
  const saveServiceAreasMutation = useMutation({
    mutationFn: saveServiceAreas,
    onSuccess: (_, variables) => {
      setCompletedData((prev) => ({
        ...prev,
        serviceAreasCount: variables.zip_codes.length,
      }));
      queryClient.invalidateQueries({ queryKey: qk.onboardingProgress });
      goToNextStep();
    },
  });

  // Step 8: Save availability
  const saveAvailabilityMutation = useMutation({
    mutationFn: saveAvailability,
    onSuccess: (_, variables) => {
      const activeDays = variables.blocks.filter((b) => b.is_active).length;
      setCompletedData((prev) => ({
        ...prev,
        availableDays: activeDays,
      }));
      queryClient.invalidateQueries({ queryKey: qk.onboardingProgress });
      goToNextStep();
    },
  });

  // Step 9: Save rates
  const saveRatesMutation = useMutation({
    mutationFn: saveRates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.onboardingProgress });
      goToNextStep();
    },
  });

  // Step 10: Complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: qk.onboardingProgress });
      router.push(data.redirect_to);
    },
  });

  return {
    // Current step
    currentStep,
    currentStepIndex,
    totalSteps,
    progress: progressPercentage,
    isLoading: progressLoading,
    progressData: progress,

    // Navigation
    goToNextStep,
    goToPreviousStep,
    setCurrentStep,

    // Completed data for review step
    completedData,

    // Mutations - return async functions
    saveAgreements: async (data: AgreementsData) => {
      return saveAgreementsMutation.mutateAsync(data);
    },
    saveAgreementsLoading: saveAgreementsMutation.isPending,

    saveBasicInfo: async (data: BasicInfoData) => {
      return saveBasicInfoMutation.mutateAsync(data);
    },
    saveBasicInfoLoading: saveBasicInfoMutation.isPending,

    sendOTP: async (phone_number: string) => {
      return sendOTPMutation.mutateAsync(phone_number);
    },
    sendOTPLoading: sendOTPMutation.isPending,
    sendOTPError: sendOTPMutation.error,

    verifyOTP: async (data: PhoneVerificationData) => {
      return verifyOTPMutation.mutateAsync(data);
    },
    verifyOTPLoading: verifyOTPMutation.isPending,
    verifyOTPError: verifyOTPMutation.error,

    uploadFacePhoto: async (file: File) => {
      return uploadFacePhotoMutation.mutateAsync(file);
    },
    uploadFacePhotoLoading: uploadFacePhotoMutation.isPending,

    uploadIDVerification: async (data: { file: File; document_type: 'drivers_license' | 'passport' | 'state_id' }) => {
      return uploadIDVerificationMutation.mutateAsync(data);
    },
    uploadIDVerificationLoading: uploadIDVerificationMutation.isPending,

    saveBackgroundConsent: async (data: BackgroundConsentData) => {
      return saveBackgroundConsentMutation.mutateAsync(data);
    },
    saveBackgroundConsentLoading: saveBackgroundConsentMutation.isPending,

    saveServiceAreas: async (data: ServiceAreasData) => {
      return saveServiceAreasMutation.mutateAsync(data);
    },
    saveServiceAreasLoading: saveServiceAreasMutation.isPending,

    saveAvailability: async (data: AvailabilityData) => {
      return saveAvailabilityMutation.mutateAsync(data);
    },
    saveAvailabilityLoading: saveAvailabilityMutation.isPending,

    saveRates: async (data: RatesData) => {
      return saveRatesMutation.mutateAsync(data);
    },
    saveRatesLoading: saveRatesMutation.isPending,

    completeOnboarding: async () => {
      return completeOnboardingMutation.mutateAsync(undefined);
    },
    completeOnboardingLoading: completeOnboardingMutation.isPending,
  };
}
