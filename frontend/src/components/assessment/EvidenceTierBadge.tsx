import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EvidenceTier, EvidenceTierBadgeProps } from '@/types/evidence-tier.types';

const tierConfig = {
  TIER_0: {
    label: 'Self-Declared',
    color: 'bg-gray-500 hover:bg-gray-600',
    textColor: 'text-white',
  },
  TIER_1: {
    label: 'Policy Documents',
    color: 'bg-blue-500 hover:bg-blue-600',
    textColor: 'text-white',
  },
  TIER_2: {
    label: 'System-Generated',
    color: 'bg-green-500 hover:bg-green-600',
    textColor: 'text-white',
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function EvidenceTierBadge({
  tier,
  confidence,
  size = 'md',
  className,
}: EvidenceTierBadgeProps) {
  const config = tierConfig[tier];
  const sizeClasses = sizeConfig[size];

  if (!config) {
    console.warn(`Invalid tier: ${tier}`);
    return null;
  }

  return (
    <Badge
      className={cn(
        config.color,
        config.textColor,
        sizeClasses,
        'font-medium transition-colors',
        className
      )}
    >
      <span>{config.label}</span>
      {confidence !== undefined && (
        <span className="ml-1 opacity-90">({Math.round(confidence * 100)}%)</span>
      )}
    </Badge>
  );
}

export default EvidenceTierBadge;
