import { cn } from '@/lib/utils';
import type { JourneyStepContainerProps } from './types/shared.types';

/**
 * JourneyStepContainer
 * Provides consistent layout, spacing, and responsive behavior for all journey steps
 */
export const JourneyStepContainer: React.FC<JourneyStepContainerProps> = ({
  children,
  className,
  maxWidth = 'lg',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto px-4 sm:px-6 lg:px-8 py-8',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
};
