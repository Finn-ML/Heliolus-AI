import { cn } from '@/lib/utils';
import { AI_CONFIDENCE_CONFIG, type AIConfidenceBadgeProps } from '../types/questionnaire.types';

/**
 * AIConfidenceBadge
 * Badge showing AI confidence level
 */
export const AIConfidenceBadge: React.FC<AIConfidenceBadgeProps> = ({ confidence }) => {
  const config = AI_CONFIDENCE_CONFIG[confidence];

  const colorClasses = {
    red: 'bg-red-100 text-red-700 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    green: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        colorClasses[config.color]
      )}
      title={config.description}
    >
      {config.label}
    </span>
  );
};
