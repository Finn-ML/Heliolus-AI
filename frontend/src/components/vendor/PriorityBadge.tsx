// Epic 13 - Story 13.3: Priority Alignment Badge Component
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Medal, Award } from 'lucide-react';

interface PriorityBadgeProps {
  priorityBoost: number;
  matchedPriority?: string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priorityBoost,
  matchedPriority,
  className = ''
}) => {
  // Determine rank based on boost score
  const getRank = () => {
    if (priorityBoost === 20) return 1;
    if (priorityBoost === 15) return 2;
    if (priorityBoost === 10) return 3;
    return null;
  };

  const rank = getRank();

  if (!rank) {
    return (
      <Badge className={`bg-gray-600/20 text-gray-400 border-gray-600/50 ${className}`}>
        No Priority Match
      </Badge>
    );
  }

  const getBadgeStyle = () => {
    switch (rank) {
      case 1:
        return {
          className: 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-400 border-yellow-500/50 text-base px-4 py-2',
          icon: Star,
          label: '#1 Priority Match'
        };
      case 2:
        return {
          className: 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 text-gray-300 border-gray-400/50 px-3 py-1.5',
          icon: Medal,
          label: '#2 Priority Match'
        };
      case 3:
        return {
          className: 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 text-amber-500 border-amber-600/50 px-3 py-1.5',
          icon: Award,
          label: '#3 Priority Match'
        };
      default:
        return null;
    }
  };

  const style = getBadgeStyle();
  if (!style) return null;

  const Icon = style.icon;

  return (
    <div className={className}>
      <Badge className={style.className} title={matchedPriority || ''}>
        <Icon className="h-4 w-4 mr-1.5 fill-current" />
        {style.label}
      </Badge>
      {matchedPriority && (
        <p className="text-xs text-gray-400 mt-1">{matchedPriority}</p>
      )}
    </div>
  );
};
