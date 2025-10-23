/**
 * Onboarding Tour Step Definitions
 * Defines the step-by-step tour for first-time users
 */

import { Step } from 'react-joyride';
import React from 'react';

export interface OnboardingStep extends Step {
  route?: string; // Required route for this step
}

export const onboardingSteps: OnboardingStep[] = [
  // Step 1: Welcome
  {
    target: 'body',
    title: 'Welcome to Heliolus!',
    content: 'Let\'s take a quick tour to help you get started with AI-powered compliance assessments. You can skip this anytime and restart from Settings.',
    disableBeacon: true,
    placement: 'center',
    route: '/dashboard',
  },

  // Step 2: Business Profile Tab - Prompt to Click
  {
    target: '[data-tour="business-profile-tab"]',
    title: 'Complete Your Business Profile',
    content: 'First, let\'s set up your organization profile. Click the "Business Profile" tab to get started.',
    placement: 'bottom',
    route: '/dashboard',
  },

  // Step 3: Business Profile Form - Prompt Completion
  {
    target: '[data-tour="business-profile-form"]',
    title: 'Fill in Your Organization Details',
    content: 'Complete your business profile with accurate information. Fill in the form fields below and click Save when you\'re done. This helps our AI provide personalized recommendations.',
    placement: 'top',
    route: '/dashboard',
    spotlightPadding: 10,
  },

  // Step 4: Assessments Button - Direct to Assessments
  {
    target: '[data-tour="assessments"]',
    title: 'Ready to Start Your Assessment?',
    content: 'Great! Now let\'s begin your compliance assessment. Click the "Assessments" button in the navigation to explore our AI-powered templates.',
    placement: 'bottom',
    route: '/dashboard',
  },

  // Step 5: Choose Template
  {
    target: '[data-tour="template-cards"]',
    title: 'Choose Your Assessment Template',
    content: 'Select a template that matches your compliance needs. Our most popular choice is Financial Crime Assessment. Click on any template card to begin.',
    placement: 'top',
    route: '/assessment-templates',
  },

  // Step 6: Document Upload with Evidence Tier Guidance
  {
    target: '[data-tour="document-upload"]',
    title: 'Upload Your Compliance Documents',
    content: (
      <div>
        <p className="mb-3">Upload documents for AI analysis. Our system automatically classifies evidence quality:</p>
        <div className="space-y-2 text-sm bg-gray-800/50 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <span className="text-green-400 font-bold">✓✓ Tier 2:</span>
            <span>System-generated evidence (audit logs, transaction reports, system exports) - <strong>Highest confidence</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400 font-bold">✓ Tier 1:</span>
            <span>Policy documents (procedures, guidelines, frameworks) - <strong>Good confidence</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">○ Tier 0:</span>
            <span>Self-declared information (statements, claims) - <strong>Requires verification</strong></span>
          </div>
        </div>
        <p className="text-xs text-gray-400">💡 Tip: Upload Tier 2 documents first for the most accurate AI analysis!</p>
      </div>
    ),
    placement: 'bottom',
    route: '/assessment/execute',
  },
];

// Tour styling configuration to match app design
export const tourStyles = {
  options: {
    arrowColor: 'rgb(17, 24, 39)', // gray-900
    backgroundColor: 'rgb(17, 24, 39)', // gray-900
    overlayColor: 'rgba(0, 0, 0, 0.8)',
    primaryColor: 'rgb(8, 145, 178)', // cyan-600
    textColor: '#fff',
    width: 480,
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 12,
    border: '1px solid rgb(31, 41, 55)', // gray-800
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  tooltipContent: {
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '12px 0',
  },
  buttonNext: {
    backgroundColor: 'rgb(8, 145, 178)', // cyan-600
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
  },
  buttonBack: {
    color: 'rgb(156, 163, 175)', // gray-400
    marginRight: '12px',
  },
  buttonSkip: {
    color: 'rgb(156, 163, 175)', // gray-400
    fontSize: '14px',
  },
};
