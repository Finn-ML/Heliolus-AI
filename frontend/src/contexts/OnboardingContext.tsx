/**
 * Onboarding Tour Context
 * Manages the state and behavior of the first-time user onboarding tour
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/api';

interface OnboardingContextType {
  // State
  isActive: boolean;
  currentStep: number;
  hasCompleted: boolean;

  // Actions
  startTour: (force?: boolean) => void;
  skipTour: () => void;
  finishTour: () => void;
  setCurrentStep: (step: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_PROGRESS_KEY = 'onboardingProgress';
const ONBOARDING_ACTIVE_KEY = 'onboardingActive';

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, refetchUser } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Initialize tour state from user and localStorage
  useEffect(() => {
    if (!user) {
      setHasCompleted(true); // Not logged in, don't show tour
      return;
    }

    // Check if user has already seen the onboarding
    if (user.hasSeenOnboarding !== undefined) {
      setHasCompleted(user.hasSeenOnboarding);
    }

    // Check if there's an active tour in localStorage
    const savedActive = localStorage.getItem(ONBOARDING_ACTIVE_KEY);
    const savedStep = localStorage.getItem(ONBOARDING_PROGRESS_KEY);

    if (savedActive === 'true' && !user.hasSeenOnboarding) {
      setIsActive(true);
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
      }
    }
  }, [user]);

  // Save progress to localStorage whenever step changes
  useEffect(() => {
    if (isActive) {
      localStorage.setItem(ONBOARDING_PROGRESS_KEY, currentStep.toString());
      localStorage.setItem(ONBOARDING_ACTIVE_KEY, 'true');
    } else {
      localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
      localStorage.removeItem(ONBOARDING_ACTIVE_KEY);
    }
  }, [currentStep, isActive]);

  const startTour = useCallback((force: boolean = false) => {
    // Must be logged in
    if (!user) {
      return;
    }

    // Only show for USER role (not ADMIN or VENDOR)
    if (user.role !== 'USER') {
      return;
    }

    // If not forcing, only start for users who haven't completed onboarding
    if (!force && user.hasSeenOnboarding) {
      return;
    }

    setIsActive(true);
    setCurrentStep(0);
    setHasCompleted(false);
  }, [user]);

  const skipTour = useCallback(async () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
    localStorage.removeItem(ONBOARDING_ACTIVE_KEY);

    // Mark as completed in backend
    try {
      await apiRequest('/auth/users/me/onboarding', {
        method: 'PATCH',
        body: JSON.stringify({ completed: true }),
      });
      setHasCompleted(true);
      // Refetch user to update hasSeenOnboarding field
      if (refetchUser) {
        await refetchUser();
      }
    } catch (error) {
      console.error('Failed to mark onboarding as skipped:', error);
      // Still mark as completed locally even if API fails
      setHasCompleted(true);
    }
  }, [refetchUser]);

  const finishTour = useCallback(async () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
    localStorage.removeItem(ONBOARDING_ACTIVE_KEY);

    // Mark as completed in backend
    try {
      await apiRequest('/auth/users/me/onboarding', {
        method: 'PATCH',
        body: JSON.stringify({ completed: true }),
      });
      setHasCompleted(true);
      // Refetch user to update hasSeenOnboarding field
      if (refetchUser) {
        await refetchUser();
      }
    } catch (error) {
      console.error('Failed to mark onboarding as completed:', error);
      // Still mark as completed locally even if API fails
      setHasCompleted(true);
    }
  }, [refetchUser]);

  const value: OnboardingContextType = {
    isActive,
    currentStep,
    hasCompleted,
    startTour,
    skipTour,
    finishTour,
    setCurrentStep,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

// Custom hook for using the onboarding context
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
