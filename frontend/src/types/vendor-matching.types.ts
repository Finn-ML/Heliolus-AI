// Vendor Matching Types for Story 1.27

import { Gap } from './assessment';

// Strategy Matrix Types
export interface StrategyMatrix {
  assessmentId: string;
  generatedAt: Date;
  immediate: TimelineBucket;
  nearTerm: TimelineBucket;
  strategic: TimelineBucket;
}

export interface TimelineBucket {
  timeline: string; // e.g., "0-6 months", "6-18 months", "18+ months"
  gaps: Gap[];
  gapCount: number;
  effortDistribution: {
    SMALL: number;
    MEDIUM: number;
    LARGE: number;
  };
  estimatedCostRange: string; // e.g., "€50K-€150K estimated"
  topVendors: VendorRecommendation[];
}

export interface VendorRecommendation {
  vendor: Vendor;
  gapsCovered: number;
  coveredGapIds: string[];
}

// Vendor Matching Types
export interface VendorMatchesResponse {
  success: boolean;
  data: {
    matches: VendorMatchScore[];  // Changed from 'vendors' to 'matches'
    count: number;
    threshold: number;
    generatedAt: Date;
  };
}

export interface VendorMatchScore {
  vendorId: string;
  vendor: Vendor;
  baseScore: BaseScore;
  priorityBoost: PriorityBoost;
  totalScore: number; // 0-140
  matchReasons: string[];
}

export interface BaseScore {
  riskAreaCoverage: number; // 0-40
  sizeFit: number; // 0-20
  geoCoverage: number; // 0-20
  priceScore: number; // 0-20
  totalBase: number; // 0-100
}

export interface PriorityBoost {
  topPriorityBoost: number; // 0-20
  matchedPriority?: string;
  featureBoost: number; // 0-10
  missingFeatures: string[];
  deploymentBoost: number; // 0-5
  speedBoost: number; // 0-5
  totalBoost: number; // 0-40
}

// Vendor Types
export interface Vendor {
  id: string;
  companyName: string;
  website?: string;
  headquarters?: string;
  primaryProduct?: string;
  aiCapabilities?: string;
  deploymentOptions?: string;
  integrations?: string;
  dataCoverage?: string;
  awards?: string;
  customerSegments?: string;
  benefitsSnapshot?: string;
  maturityAssessment?: string;
  contactEmail?: string;
  logo?: string;
  categories: string[];
  targetSegments: string[];
  geographicCoverage: string[];
  pricingRange?: string;
  features: string[];
  implementationTimeline?: number;
  featured: boolean;
  verified: boolean;
  rating?: number;
  reviewCount: number;
  status: string;
}

// Extended Vendor with Match Score
export interface VendorWithMatch extends Vendor {
  matchScore?: {
    baseScore: BaseScore;
    priorityBoost: PriorityBoost;
    totalScore: number;
    matchReasons: string[];
  };
}

// Match Quality Labels
export type MatchQuality = 'Highly Relevant' | 'Good Match' | 'Fair Match';

// Helper function to get match quality
export function getMatchQuality(score: number): MatchQuality {
  if (score >= 120) return 'Highly Relevant';
  if (score >= 100) return 'Good Match';
  return 'Fair Match';
}

// Helper function to get match quality color
export function getMatchQualityColor(score: number): string {
  if (score >= 120) return 'bg-green-500/20 text-green-400 border-green-500/50';
  if (score >= 100) return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
}
