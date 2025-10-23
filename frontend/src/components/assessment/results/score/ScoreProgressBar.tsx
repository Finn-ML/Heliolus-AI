import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ScoreProgressBarProps } from '../types/results.types';

/**
 * ScoreProgressBar
 * Horizontal progress bar showing score with color coding
 */
export const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({ score, color }) => {
  const colorClasses = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  return (
    <div className="w-full">
      <Progress value={score} className={cn('h-3', colorClasses[color])} />
    </div>
  );
};
