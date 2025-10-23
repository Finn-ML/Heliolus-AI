/**
 * Shared Journey Component Types
 * Type definitions for reusable assessment journey components
 */

export interface JourneyStepContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface JourneyStepHeaderProps {
  title: string;
  description?: string;
  stepNumber?: number;
  totalSteps?: number;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export interface JourneyNavigationProps {
  onBack?: () => void;
  onContinue: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  backLabel?: string;
  isLoading?: boolean;
  showSaveDraft?: boolean;
  onSaveDraft?: () => void;
  className?: string;
}

export interface JourneyProgressBarProps {
  current: number;
  total: number;
  showLabels?: boolean;
  className?: string;
}

export interface LoadingStateProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export interface ErrorStateProps {
  message: string;
  submessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  showSupport?: boolean;
  supportEmail?: string;
  className?: string;
}
