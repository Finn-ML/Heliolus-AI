import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getConfidenceLevelConfig, type ConfidenceBadgeProps } from '../types/results.types';

/**
 * ConfidenceBadge
 * Badge displaying confidence level (LOW/MEDIUM/HIGH)
 */
export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ level }) => {
  const config = getConfidenceLevelConfig(level);

  const colorClasses = {
    red: 'bg-red-100 text-red-700 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    green: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <Badge variant="outline" className={cn('font-medium', colorClasses[config.color])}>
      {config.label}
    </Badge>
  );
};
