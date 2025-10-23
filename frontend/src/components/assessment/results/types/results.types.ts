/**
 * Type definitions for Enhanced Results Overview
 * Based on COMPONENT-SPEC-STEP7-RESULTS-OVERVIEW.md
 */

// ============================================================================
// API Response Types
// ============================================================================

export interface EvidenceDistribution {
  tier0Count: number;
  tier1Count: number;
  tier2Count: number;
  tier0Percentage: number; // 0-100
  tier1Percentage: number; // 0-100
  tier2Percentage: number; // 0-100
}

export interface SectionBreakdown {
  sectionId: string;
  sectionName: string;
  score: number; // 0-100
  weight: number; // Section weight percentage (0-100)
  weightedContribution: number; // How much this section contributed to overall
  evidenceCounts: {
    tier0: number;
    tier1: number;
    tier2: number;
  };
}

export interface Methodology {
  scoringApproach: string;
  weightingExplanation: string;
  evidenceImpact: string;
}

export interface EnhancedResultsResponse {
  assessmentId: string;
  overallScore: number; // 0-100
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  totalAnswers: number;
  evidenceDistribution: EvidenceDistribution;
  sectionBreakdown: SectionBreakdown[];
  methodology: Methodology;
  hasPriorities: boolean;
}

// ============================================================================
// Component Props
// ============================================================================

export interface EnhancedResultsStepProps {
  assessmentId: string;
  onContinue: () => void;
  onBack: () => void;
}

export interface OverallScoreCardProps {
  score: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  totalAnswers: number;
}

export interface EvidenceQualityPanelProps {
  distribution: EvidenceDistribution;
}

export interface SectionBreakdownPanelProps {
  sections: SectionBreakdown[];
}

export interface MethodologyAccordionProps {
  methodology: Methodology;
}

export interface NextStepsPanelProps {
  assessmentId: string;
  hasPriorities: boolean;
}

// ============================================================================
// Score Components
// ============================================================================

export interface ScoreCircleProps {
  score: number;
  color: RiskColor;
  size?: 'sm' | 'md' | 'lg';
}

export interface RiskLevelBadgeProps {
  level: RiskLevel;
  color: RiskColor;
  Icon: React.ComponentType<{ className?: string }>;
}

export interface ScoreProgressBarProps {
  score: number;
  color: RiskColor;
}

export interface ConfidenceBadgeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ============================================================================
// Section Components
// ============================================================================

export interface SectionScoreCardProps {
  section: SectionBreakdown;
}

export interface SectionScoreMiniBarProps {
  score: number;
  color?: RiskColor;
}

// ============================================================================
// Evidence Components
// ============================================================================

export interface EvidenceLegendProps {
  distribution: EvidenceDistribution;
}

// ============================================================================
// Enums and Constants
// ============================================================================

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskColor = 'red' | 'orange' | 'yellow' | 'green';

export const RISK_LEVEL_CONFIG = {
  CRITICAL: {
    threshold: [0, 29],
    label: 'CRITICAL',
    color: 'red' as RiskColor,
    message: 'Immediate action required',
    emoji: '🔴',
  },
  HIGH: {
    threshold: [30, 59],
    label: 'HIGH',
    color: 'orange' as RiskColor,
    message: 'Urgent attention required',
    emoji: '🟠',
  },
  MEDIUM: {
    threshold: [60, 79],
    label: 'MEDIUM',
    color: 'yellow' as RiskColor,
    message: 'Good compliance with improvement opportunities',
    emoji: '🟡',
  },
  LOW: {
    threshold: [80, 100],
    label: 'LOW',
    color: 'green' as RiskColor,
    message: 'Strong compliance posture',
    emoji: '🟢',
  },
} as const;

export const CONFIDENCE_LEVEL_CONFIG = {
  LOW: {
    label: 'Low Confidence',
    description: 'Most answers self-declared. Consider uploading supporting documents.',
    color: 'red',
    threshold: [0, 29],
  },
  MEDIUM: {
    label: 'Medium Confidence',
    description: 'Mix of self-declared and documented answers.',
    color: 'yellow',
    threshold: [30, 59],
  },
  HIGH: {
    label: 'High Confidence',
    description: 'Majority of answers backed by uploaded documents.',
    color: 'green',
    threshold: [60, 100],
  },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

export const getRiskLevel = (score: number): RiskLevel => {
  // Higher score = better compliance = lower risk
  // Matches backend thresholds in /backend/src/lib/assessment/index.ts:140-144
  if (score >= 80) return 'LOW';      // Excellent compliance
  if (score >= 60) return 'MEDIUM';   // Good compliance
  if (score >= 30) return 'HIGH';     // Concerning compliance
  return 'CRITICAL';                   // Critical compliance issues
};

export const getRiskLevelConfig = (score: number) => {
  const level = getRiskLevel(score);
  return RISK_LEVEL_CONFIG[level];
};

export const getEvidenceQuality = (evidenceCounts: {
  tier0: number;
  tier1: number;
  tier2: number;
}): { label: string; color: string } => {
  const total = evidenceCounts.tier0 + evidenceCounts.tier1 + evidenceCounts.tier2;
  if (total === 0) return { label: 'Unknown', color: 'gray' };

  const tier2Percentage = (evidenceCounts.tier2 / total) * 100;

  if (tier2Percentage >= 60) return { label: 'High', color: 'green' };
  if (tier2Percentage >= 30) return { label: 'Medium', color: 'yellow' };
  return { label: 'Low', color: 'gray' };
};

export const getConfidenceLevelConfig = (confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
  return CONFIDENCE_LEVEL_CONFIG[confidenceLevel];
};

export const formatScore = (score: number): string => {
  return `${Math.round(score)}/100`;
};

export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

// ============================================================================
// Next Steps Configuration
// ============================================================================

export interface NextStep {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaAction: string;
  icon: string;
  enabled: boolean;
}

export const getNextSteps = (hasPriorities: boolean): NextStep[] => [
  {
    id: 'priorities',
    title: 'Complete Priorities Questionnaire',
    description: 'Help us understand your organizational context (5 minutes)',
    ctaLabel: 'Start Priorities',
    ctaAction: 'priorities',
    icon: '🎯',
    enabled: !hasPriorities,
  },
  {
    id: 'gaps',
    title: 'View Detailed Gap Analysis',
    description: 'Identify specific compliance gaps and priorities',
    ctaLabel: 'View Gaps',
    ctaAction: 'gaps',
    icon: '📊',
    enabled: true,
  },
  {
    id: 'vendors',
    title: 'Explore Vendor Solutions',
    description: 'Find vendors matched to your compliance gaps',
    ctaLabel: 'View Vendors',
    ctaAction: 'vendors',
    icon: '🏢',
    enabled: true,
  },
];
