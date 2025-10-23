import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RiskLevelBadgeProps } from '../types/results.types';

/**
 * RiskLevelBadge
 * Badge displaying risk level with icon (HIGH/MEDIUM/LOW RISK)
 */
export const RiskLevelBadge: React.FC<RiskLevelBadgeProps> = ({ level, color, Icon }) => {
  const colorClasses = {
    red: 'bg-red-100 text-red-700 border-red-300',
    orange: 'bg-orange-100 text-orange-700 border-orange-300',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    green: 'bg-green-100 text-green-700 border-green-300',
  };

  return (
    <Badge
      variant="outline"
      className={cn('px-4 py-2 text-lg font-semibold gap-2', colorClasses[color])}
    >
      <Icon className="h-5 w-5" />
      <span>{level} RISK</span>
    </Badge>
  );
};
