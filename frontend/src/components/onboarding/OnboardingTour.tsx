/**
 * Onboarding Tour Component (Driver.js)
 * Simplified, blocking tour with localStorage persistence
 */

import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { driver, DriveStep, Driver } from 'driver.js';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { tourSteps, driverConfig, TOUR_STORAGE_KEYS } from '@/config/tour-config';
import '@/styles/tour.css';

export function OnboardingTour() {
  const { isActive, currentStep, setCurrentStep, skipTour, finishTour } = useOnboarding();
  const location = useLocation();
  const navigate = useNavigate();
  const driverRef = useRef<Driver | null>(null);

  // Initialize Driver.js instance
  useEffect(() => {
    if (!isActive) return;

    // Create driver instance
    const driverObj = driver({
      ...driverConfig,

      // Start at the saved step
      steps: tourSteps as DriveStep[],

      // Handle step changes
      onNextClick: (element, step, options) => {
        const currentIndex = step.index || 0;
        const nextStep = tourSteps[currentIndex + 1];

        // Save progress
        setCurrentStep(currentIndex + 1);
        localStorage.setItem(TOUR_STORAGE_KEYS.STEP, String(currentIndex + 1));

        // Check if next step requires navigation
        if (nextStep?.route && location.pathname !== nextStep.route) {
          // Pause tour and navigate
          driverObj.destroy();

          // Navigate to required route
          if (nextStep.route.startsWith('/assessment/execute')) {
            // For assessment execution, we need to wait for user to select template
            // Don't auto-navigate - let the route change happen naturally
          } else {
            navigate(nextStep.route);
          }
        } else {
          // Stay on same page, move to next step
          driverObj.moveNext();
        }
      },

      onPrevClick: (element, step) => {
        const currentIndex = step.index || 0;
        const prevStep = tourSteps[currentIndex - 1];

        // Save progress
        setCurrentStep(currentIndex - 1);
        localStorage.setItem(TOUR_STORAGE_KEYS.STEP, String(currentIndex - 1));

        // Check if previous step requires navigation
        if (prevStep?.route && location.pathname !== prevStep.route) {
          driverObj.destroy();
          navigate(prevStep.route);
        } else {
          driverObj.movePrevious();
        }
      },

      onCloseClick: () => {
        skipTour();
        driverObj.destroy();
      },

      onDestroyStarted: () => {
        // Check if tour completed (on last step)
        const activeIndex = driverObj.getActiveIndex();
        const isLastStep = activeIndex === tourSteps.length - 1;

        if (isLastStep) {
          finishTour();
        }
      },

      onDestroyed: () => {
        driverRef.current = null;
      },

      // Handle highlighted element clicks
      onHighlighted: (element, step) => {
        const currentIndex = step.index || 0;
        const currentStepConfig = tourSteps[currentIndex];

        // Add click listener for interactive steps
        if (element) {
          const handleElementClick = () => {
            // Auto-advance when user interacts with highlighted element
            switch (currentIndex) {
              case 1: // Business Profile Tab
                // User clicked tab, wait for animation then advance
                setTimeout(() => {
                  if (driverRef.current) {
                    setCurrentStep(2);
                    driverRef.current.moveNext();
                  }
                }, 400);
                break;

              case 2: // Business Profile Form
                // Check if user clicked save button
                const target = element.querySelector('[data-tour="save-profile-button"]');
                if (target) {
                  const saveHandler = () => {
                    setTimeout(() => {
                      if (driverRef.current) {
                        setCurrentStep(3);
                        driverRef.current.moveNext();
                      }
                    }, 1500);
                    target.removeEventListener('click', saveHandler);
                  };
                  target.addEventListener('click', saveHandler);
                }
                break;

              case 3: // Assessments Navigation
                // User clicked assessments, navigate and advance
                setTimeout(() => {
                  if (driverRef.current && location.pathname === '/assessment-templates') {
                    setCurrentStep(4);
                    driverRef.current.moveNext();
                  }
                }, 500);
                break;

              case 4: // Template Selection
                // User clicked template, navigate and advance
                setTimeout(() => {
                  if (driverRef.current && location.pathname.startsWith('/assessment/execute/')) {
                    setCurrentStep(5);
                    driverRef.current.moveNext();
                  }
                }, 500);
                break;
            }
          };

          element.addEventListener('click', handleElementClick, { once: true });
        }
      },
    });

    driverRef.current = driverObj;

    // Wait for page to be ready, then start tour at saved step
    const startTimeout = setTimeout(() => {
      // Filter steps for current route
      const currentRouteSteps = tourSteps.filter(
        step => !step.route || location.pathname.startsWith(step.route)
      );

      if (currentRouteSteps.length > 0) {
        // Find the step index on the current page
        const stepOnCurrentPage = tourSteps.findIndex(
          step => !step.route || location.pathname.startsWith(step.route)
        );

        if (stepOnCurrentPage >= 0 && stepOnCurrentPage <= currentStep) {
          driverObj.drive(currentStep);
        }
      }
    }, 500);

    return () => {
      clearTimeout(startTimeout);
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [isActive, currentStep, location.pathname]);

  // Handle route changes - restart tour if navigated to correct page
  useEffect(() => {
    if (!isActive || !driverRef.current) return;

    const currentStepConfig = tourSteps[currentStep];

    // Check if we're on the correct route for the current step
    if (currentStepConfig?.route) {
      const isOnCorrectRoute = location.pathname === currentStepConfig.route ||
        location.pathname.startsWith(currentStepConfig.route);

      if (isOnCorrectRoute) {
        // Wait for page elements to load
        setTimeout(() => {
          if (driverRef.current) {
            driverRef.current.destroy();
            driverRef.current.drive(currentStep);
          }
        }, 600);
      }
    }
  }, [location.pathname, currentStep, isActive]);

  return null; // Driver.js handles all rendering
}
