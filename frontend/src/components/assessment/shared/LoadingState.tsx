import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JourneyStepContainer } from './JourneyStepContainer';
import type { LoadingStateProps } from './types/shared.types';

/**
 * LoadingState
 * Consistent loading indicators with optional messages
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  submessage,
  size = 'md',
  fullScreen = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        fullScreen && 'min-h-[400px]',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className={cn('animate-spin text-cyan-500', sizeClasses[size])} aria-hidden="true" />
      {message && (
        <p className="mt-4 text-lg font-medium text-white" aria-live="polite">
          {message}
        </p>
      )}
      {submessage && <p className="mt-2 text-sm text-gray-400">{submessage}</p>}
      <span className="sr-only">{message}</span>
    </div>
  );

  return fullScreen ? <JourneyStepContainer>{content}</JourneyStepContainer> : content;
};
