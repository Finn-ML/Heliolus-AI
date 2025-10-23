import { cn } from '@/lib/utils';
import { EVIDENCE_TIER_CONFIG, type EvidenceTierBadgeProps } from '../types/questionnaire.types';

/**
 * EvidenceTierBadge
 * Visual badge showing evidence tier with icon and label
 */
export const EvidenceTierBadge: React.FC<EvidenceTierBadgeProps> = ({ tier }) => {
  const config = EVIDENCE_TIER_CONFIG[tier];

  const colorClasses = {
    gray: 'bg-gray-700/50 text-gray-300 border-gray-600',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
        colorClasses[config.color]
      )}
      title={config.description}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};
