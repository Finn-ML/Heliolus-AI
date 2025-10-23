import { cn } from '@/lib/utils';
import { JourneyProgressBar } from './JourneyProgressBar';
import type { JourneyStepHeaderProps } from './types/shared.types';

/**
 * JourneyStepHeader
 * Displays step title, description, and progress indicator
 */
export const JourneyStepHeader: React.FC<JourneyStepHeaderProps> = ({
  title,
  description,
  stepNumber,
  totalSteps,
  icon: Icon,
  className,
}) => {
  return (
    <div className={cn('mb-8', className)}>
      {/* Progress indicator */}
      {stepNumber && totalSteps && (
        <div className="flex items-center justify-between mb-4">
          <JourneyProgressBar current={stepNumber} total={totalSteps} />
          <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">
            Step {stepNumber} of {totalSteps}
          </span>
        </div>
      )}

      {/* Title */}
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-8 h-8 text-cyan-500" />}
        <h1 className="text-3xl font-bold text-white">{title}</h1>
      </div>

      {/* Description */}
      {description && <p className="mt-3 text-lg text-gray-300">{description}</p>}
    </div>
  );
};
