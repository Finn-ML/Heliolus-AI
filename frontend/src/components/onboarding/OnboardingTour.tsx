/**
 * Onboarding Tour Component
 * Renders the interactive first-time user tour using react-joyride
 */

import React, { useCallback, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { onboardingSteps, tourStyles } from '@/config/onboarding-steps';
import { useLocation } from 'react-router-dom';

/**
 * Helper function to check if a DOM element is actually visible
 */
function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    window.getComputedStyle(element).visibility !== 'hidden' &&
    window.getComputedStyle(element).display !== 'none'
  );
}

export function OnboardingTour() {
  const { isActive, currentStep, setCurrentStep, skipTour, finishTour } = useOnboarding();
  const location = useLocation();

  // Check if current step matches the current route
  const currentStepConfig = onboardingSteps[currentStep];
  const isOnCorrectRoute = !currentStepConfig?.route ||
    location.pathname === currentStepConfig.route ||
    (currentStepConfig.route && location.pathname.startsWith(currentStepConfig.route));

  // Handle tour callbacks from react-joyride
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index, action } = data;

      // Handle tour finished
      if (status === STATUS.FINISHED) {
        finishTour();
        return;
      }

      // Handle tour skipped
      if (status === STATUS.SKIPPED) {
        skipTour();
        return;
      }

      // Handle step changes
      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);

        // If moving forward and reached the end
        if (nextStepIndex >= onboardingSteps.length) {
          finishTour();
          return;
        }

        // If moving backward and at the start
        if (nextStepIndex < 0) {
          return;
        }

        setCurrentStep(nextStepIndex);
      }
    },
    [currentStep, setCurrentStep, skipTour, finishTour]
  );

  // Auto-advance when user navigates to the next required route
  useEffect(() => {
    if (!isActive) return;

    // Step 4 → Step 5: User navigated to assessment templates
    if (currentStep === 4 && location.pathname === '/assessment-templates') {
      const timer = setTimeout(() => setCurrentStep(5), 300);
      return () => clearTimeout(timer);
    }

    // Step 5 → Step 6: User navigated to assessment execution
    if (currentStep === 5 && location.pathname.startsWith('/assessment/execute/')) {
      const timer = setTimeout(() => setCurrentStep(6), 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isActive, currentStep, setCurrentStep]);

  // Listen for clicks on tour targets to advance automatically
  useEffect(() => {
    if (!isActive) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Step 2: User clicked Business Profile tab
      if (currentStep === 2) {
        const profileTab = target.closest('[data-tour="business-profile-tab"]');
        if (profileTab) {
          // Advance after tab switch animation
          setTimeout(() => setCurrentStep(3), 400);
        }
      }

      // Step 3: User clicked Save Profile button
      if (currentStep === 3) {
        const saveBtn = target.closest('[data-tour="save-profile-button"]');
        if (saveBtn) {
          // Advance after save completes (wait for toast/success)
          setTimeout(() => setCurrentStep(4), 1500);
        }
      }

      // Step 4: User clicked Assessments button
      if (currentStep === 4) {
        const assessmentsBtn = target.closest('[data-tour="assessments"]');
        if (assessmentsBtn) {
          // Will advance via route change effect
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isActive, currentStep, setCurrentStep]);

  if (!isActive) {
    return null;
  }

  // Only show tour if on correct route (or no route specified)
  if (!isOnCorrectRoute) {
    return null;
  }

  return (
    <Joyride
      steps={onboardingSteps}
      run={isActive}
      stepIndex={currentStep}
      continuous={false}
      showProgress={false}
      showSkipButton
      disableCloseOnEsc={false}
      disableOverlayClose={false}
      hideBackButton
      callback={handleJoyrideCallback}
      styles={tourStyles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish Tour',
        next: 'Got It',
        skip: 'Skip Tour',
      }}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: {
            filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))',
          },
        },
      }}
      tooltipComponent={undefined}
      spotlightPadding={10}
      disableScrolling={false}
      scrollToFirstStep
      scrollOffset={100}
      disableOverlay={false}
    />
  );
}
