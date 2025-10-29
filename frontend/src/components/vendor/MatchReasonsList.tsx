// Epic 13 - Story 13.3: Match Reasons List Component
import React from 'react';
import { CheckCircle, Star, TrendingUp, DollarSign, Zap, Globe } from 'lucide-react';

interface MatchReasonsListProps {
  matchReasons: string[];
  className?: string;
}

export const MatchReasonsList: React.FC<MatchReasonsListProps> = ({ matchReasons, className = '' }) => {
  // Determine icon and color based on reason content
  const getReasonStyle = (reason: string) => {
    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes('priority') || lowerReason.includes('#1') || lowerReason.includes('#2') || lowerReason.includes('#3')) {
      return { icon: Star, color: 'text-cyan-400' };
    }
    if (lowerReason.includes('gap') || lowerReason.includes('compliance')) {
      return { icon: CheckCircle, color: 'text-green-400' };
    }
    if (lowerReason.includes('feature') || lowerReason.includes('must-have')) {
      return { icon: TrendingUp, color: 'text-purple-400' };
    }
    if (lowerReason.includes('budget') || lowerReason.includes('price')) {
      return { icon: DollarSign, color: 'text-yellow-400' };
    }
    if (lowerReason.includes('size') || lowerReason.includes('company')) {
      return { icon: Zap, color: 'text-pink-400' };
    }
    if (lowerReason.includes('jurisdiction') || lowerReason.includes('geographic')) {
      return { icon: Globe, color: 'text-blue-400' };
    }

    return { icon: CheckCircle, color: 'text-green-400' };
  };

  if (!matchReasons || matchReasons.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-400 mb-3">Why This Vendor Matches</h4>
      <ul className="space-y-2">
        {matchReasons.map((reason, index) => {
          const { icon: Icon, color } = getReasonStyle(reason);
          return (
            <li key={index} className="flex items-start gap-3">
              <Icon className={`h-5 w-5 ${color} mt-0.5 flex-shrink-0`} />
              <span className="text-gray-300 text-sm leading-relaxed">{reason}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
