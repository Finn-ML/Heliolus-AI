/**
 * Driver.js Tour Configuration
 * Simplified, blocking tour with localStorage persistence
 */

import { DriveStep, Config } from 'driver.js';

export interface TourStep extends DriveStep {
  route?: string; // Required route for this step
}

/**
 * Tour step definitions
 * Driver.js automatically handles element detection, positioning, and overlays
 */
export const tourSteps: TourStep[] = [
  // Step 0: Welcome
  {
    element: 'body',
    popover: {
      title: '👋 Welcome to Heliolus!',
      description: "Let's take a quick tour to help you get started with AI-powered compliance assessments. Click 'Next' to continue or 'Skip' to exit anytime.",
      side: 'center',
      align: 'center',
    },
    route: '/dashboard',
  },

  // Step 1: Business Profile Tab
  {
    element: '[data-tour="business-profile-tab"]',
    popover: {
      title: '📋 Complete Your Business Profile',
      description: "First, let's set up your organization profile. Click the 'Business Profile' tab below to get started.",
      side: 'bottom',
      align: 'center',
    },
    route: '/dashboard',
  },

  // Step 2: Business Profile Form
  {
    element: '[data-tour="business-profile-form"]',
    popover: {
      title: '✍️ Fill in Your Organization Details',
      description: 'Complete your business profile with accurate information. This helps our AI provide personalized compliance recommendations. Click the Save button when done.',
      side: 'top',
      align: 'start',
    },
    route: '/dashboard',
  },

  // Step 3: Navigate to Assessments
  {
    element: '[data-tour="assessments"]',
    popover: {
      title: '🎯 Ready to Start Your Assessment?',
      description: "Great! Now let's begin your compliance assessment. Click the 'Assessments' button in the navigation above.",
      side: 'bottom',
      align: 'center',
    },
    route: '/dashboard',
  },

  // Step 4: Choose Template
  {
    element: '[data-tour="template-cards"]',
    popover: {
      title: '📄 Choose Your Assessment Template',
      description: 'Select a template that matches your compliance needs. Our most popular choice is Financial Crime Assessment. Click any template card to begin.',
      side: 'top',
      align: 'start',
    },
    route: '/assessment-templates',
  },

  // Step 5: Document Upload with Evidence Tiers
  {
    element: '[data-tour="document-upload"]',
    popover: {
      title: '📤 Upload Your Compliance Documents',
      description: `
        <div class="space-y-3">
          <p>Upload documents for AI analysis. Our system automatically classifies evidence quality:</p>
          <div class="space-y-2 text-sm bg-gray-800/50 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <span class="text-green-400 font-bold">✓✓ Tier 2:</span>
              <span>System-generated evidence (audit logs, reports) - <strong>Highest confidence</strong></span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-blue-400 font-bold">✓ Tier 1:</span>
              <span>Policy documents (procedures, guidelines) - <strong>Good confidence</strong></span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-amber-400 font-bold">○ Tier 0:</span>
              <span>Self-declared information (statements) - <strong>Requires verification</strong></span>
            </div>
          </div>
          <p class="text-xs text-gray-400">💡 Tip: Upload Tier 2 documents first for the most accurate AI analysis!</p>
        </div>
      `,
      side: 'bottom',
      align: 'start',
    },
    route: '/assessment/execute',
  },
];

/**
 * Driver.js configuration
 * Matches your app's design system (dark theme, cyan accent)
 */
export const driverConfig: Config = {
  // Show progress indicator
  showProgress: true,

  // Show both buttons
  showButtons: ['next', 'previous', 'close'],

  // Allow closing with overlay click or ESC
  allowClose: true,

  // Smooth animations
  animate: true,

  // Scroll to highlighted element
  smoothScroll: true,

  // Dark overlay
  overlayColor: 'rgba(0, 0, 0, 0.85)',

  // Spacing around highlighted element
  stagePadding: 10,

  // Disable interactions with highlighted element (blocking mode)
  allowKeyboardControl: true,
  disableActiveInteraction: false, // Allow user to interact with highlighted elements

  // Button text
  nextBtnText: 'Next →',
  prevBtnText: '← Back',
  doneBtnText: 'Finish Tour',

  // Callbacks for persistence
  onDestroyed: () => {
    // Cleanup handled by component
  },

  // Custom styling to match your app
  popoverClass: 'heliolus-tour-popover',

  // Wait for elements to appear
  onHighlightStarted: () => {
    // Can add custom logic here if needed
  },
};

/**
 * CSS class names for custom styling
 * These match your existing design system
 */
export const tourClassNames = {
  popover: 'heliolus-tour-popover',
  overlay: 'heliolus-tour-overlay',
  highlight: 'heliolus-tour-highlight',
};

/**
 * LocalStorage keys
 */
export const TOUR_STORAGE_KEYS = {
  ACTIVE: 'heliolus_tour_active',
  STEP: 'heliolus_tour_step',
  COMPLETED: 'heliolus_tour_completed',
} as const;
