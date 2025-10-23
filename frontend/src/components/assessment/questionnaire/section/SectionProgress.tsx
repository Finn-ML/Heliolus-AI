import { Progress } from '@/components/ui/progress';
import type { SectionProgressProps } from '../types/questionnaire.types';

/**
 * SectionProgress
 * Progress bar for section completion
 */
export const SectionProgress: React.FC<SectionProgressProps> = ({
  current,
  total,
  showPercentage = true,
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {current} of {total} questions
        </span>
        {showPercentage && <span className="font-medium text-white">{percentage}%</span>}
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
