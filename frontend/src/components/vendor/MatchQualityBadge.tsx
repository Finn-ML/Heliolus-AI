// Epic 13 - Story 13.2: Match Quality Badge Component
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Check, AlertCircle } from 'lucide-react';
import { getMatchQuality, getMatchQualityColor } from '@/types/vendor-matching.types';

interface MatchQualityBadgeProps {
  score: number;
  className?: string;
}

export const MatchQualityBadge: React.FC<MatchQualityBadgeProps> = ({ score, className = '' }) => {
  const quality = getMatchQuality(score);
  const colorClass = getMatchQualityColor(score);

  const getIcon = () => {
    if (score >= 120) return <CheckCircle2 className="h-4 w-4 mr-1" />;
    if (score >= 100) return <Check className="h-4 w-4 mr-1" />;
    return <AlertCircle className="h-4 w-4 mr-1" />;
  };

  const getTooltipText = () => {
    if (score >= 120) {
      return 'Highly Relevant (≥120 points): Excellent match for your needs';
    }
    if (score >= 100) {
      return 'Good Match (≥100 points): Strong alignment with your requirements';
    }
    return 'Fair Match (<100 points): Meets some of your requirements';
  };

  return (
    <Badge
      className={`${colorClass} border text-lg px-4 py-2 font-semibold ${className}`}
      title={getTooltipText()}
    >
      {getIcon()}
      {quality}
    </Badge>
  );
};
