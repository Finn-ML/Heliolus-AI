/**
 * Onboarding Tour Context (Simplified)
 * Manages tour state with localStorage persistence
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/api';
import { TOUR_STORAGE_KEYS } from '@/config/tour-config';

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

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, refetchUser } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStepState] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Initialize tour state from user and localStorage
  useEffect(() => {
    if (!user) {
      setHasCompleted(true); // Not logged in, don't show tour
      setIsActive(false);
      return;
    }

    // Check if user has already completed onboarding
    if (user.hasSeenOnboarding !== undefined) {
      setHasCompleted(user.hasSeenOnboarding);

      if (user.hasSeenOnboarding) {
        // User completed tour, clean up localStorage
        localStorage.removeItem(TOUR_STORAGE_KEYS.ACTIVE);
        localStorage.removeItem(TOUR_STORAGE_KEYS.STEP);
        setIsActive(false);
        return;
      }
    }

    // Check if there's an active tour in localStorage
    const savedActive = localStorage.getItem(TOUR_STORAGE_KEYS.ACTIVE);
    const savedStep = localStorage.getItem(TOUR_STORAGE_KEYS.STEP);

    if (savedActive === 'true' && !user.hasSeenOnboarding) {
      setIsActive(true);
      if (savedStep) {
        const stepNum = parseInt(savedStep, 10);
        if (!isNaN(stepNum)) {
          setCurrentStepState(stepNum);
        }
      }
    }
  }, [user]);

  // Set current step with persistence
  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
    if (isActive) {
      localStorage.setItem(TOUR_STORAGE_KEYS.STEP, step.toString());
    }
  }, [isActive]);

  // Start tour
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
    setCurrentStepState(0);
    setHasCompleted(false);

    // Persist to localStorage
    localStorage.setItem(TOUR_STORAGE_KEYS.ACTIVE, 'true');
    localStorage.setItem(TOUR_STORAGE_KEYS.STEP, '0');
  }, [user]);

  // Skip tour
  const skipTour = useCallback(async () => {
    setIsActive(false);
    setCurrentStepState(0);

    // Clear localStorage
    localStorage.removeItem(TOUR_STORAGE_KEYS.ACTIVE);
    localStorage.removeItem(TOUR_STORAGE_KEYS.STEP);

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

  // Finish tour
  const finishTour = useCallback(async () => {
    setIsActive(false);
    setCurrentStepState(0);

    // Clear localStorage
    localStorage.removeItem(TOUR_STORAGE_KEYS.ACTIVE);
    localStorage.removeItem(TOUR_STORAGE_KEYS.STEP);

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
