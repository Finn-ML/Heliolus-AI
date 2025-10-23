import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { JourneyProgressBarProps } from './types/shared.types';

/**
 * JourneyProgressBar
 * Visual progress indicator showing current step in journey
 */
export const JourneyProgressBar: React.FC<JourneyProgressBarProps> = ({
  current,
  total,
  showLabels = false,
  className,
}) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full"
        />
      </div>

      {/* Labels (optional) */}
      {showLabels && (
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Start</span>
          <span>{percentage}% Complete</span>
          <span>Finish</span>
        </div>
      )}
    </div>
  );
};
