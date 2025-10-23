/**
 * Evidence tier type definitions for document classification
 */

export type EvidenceTier = 'TIER_0' | 'TIER_1' | 'TIER_2';

export interface EvidenceTierBadgeProps {
  tier: EvidenceTier;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface EvidenceTierExplanationProps {
  documentId: string;
  tier: EvidenceTier;
  reason: string;
  confidence: number;
}

export interface EvidenceTierDistributionProps {
  distribution: {
    tier0: number;
    tier1: number;
    tier2: number;
  };
  className?: string;
}

export interface EvidenceTierResult {
  tier: EvidenceTier;
  confidence: number;
  reason: string;
  indicators: string[];
}

// Tier configuration for consistent usage across components
export const TIER_LABELS: Record<EvidenceTier, string> = {
  TIER_0: 'Self-Declared',
  TIER_1: 'Policy Documents',
  TIER_2: 'System-Generated',
};

export const TIER_COLORS: Record<EvidenceTier, string> = {
  TIER_0: '#6B7280', // gray-500
  TIER_1: '#3B82F6', // blue-500
  TIER_2: '#22C55E', // green-500
};

export const TIER_MULTIPLIERS: Record<EvidenceTier, number> = {
  TIER_0: 0.6, // 40% penalty
  TIER_1: 0.8, // 20% penalty
  TIER_2: 1.0, // No penalty
};

export const TIER_DESCRIPTIONS: Record<EvidenceTier, string> = {
  TIER_0:
    'Self-declared evidence has a 40% penalty on scoring. Consider uploading official policy documents or system-generated reports for better assessment accuracy.',
  TIER_1:
    'Policy documents have a 20% penalty compared to system-generated evidence. Upload compliance reports or audit logs for full scoring.',
  TIER_2:
    'System-generated evidence receives full scoring with no penalty. This is the highest quality evidence type.',
};
