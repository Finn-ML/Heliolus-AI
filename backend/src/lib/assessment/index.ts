/**
 * Assessment Library for Heliolus Platform
 * Hybrid implementation using real scoring with simplified interface
 */

import { ScoreCalculator } from './scorer.js';
import type { ComplianceGap, RiskItem } from './types.js';

// Initialize real scorer
const scoreCalculator = new ScoreCalculator();

// Mock exports for compatibility
export const assessmentEngine = {
  processAssessment: async () => ({ success: true, data: null }),
  calculateScore: async () => ({ success: true, data: 75 }),
};

export const gapAnalyzer = {
  analyze: async () => ({ gaps: [] }),
};

export const riskAnalyzer = {
  analyze: async () => ({ risks: [] }),
};

export const reportGenerator = {
  generate: async () => ({ success: true, data: 'Mock report' }),
};

// Real risk scoring function using the actual ScoreCalculator
export const calculateRiskScore = (gaps: ComplianceGap[], risks: RiskItem[]): number => {
  try {
    // Use real scorer if we have data
    if (gaps && gaps.length > 0 || risks && risks.length > 0) {
      return scoreCalculator.calculateOverallScore(gaps, risks);
    }
    // Return neutral score if no data
    return 50;
  } catch (error) {
    console.error('[Assessment] Error calculating risk score:', error);
    // Fallback to calculated score based on number of gaps/risks
    const gapPenalty = (gaps?.length || 0) * 5;
    const riskPenalty = (risks?.length || 0) * 8;
    return Math.max(0, 100 - gapPenalty - riskPenalty);
  }
};

export const analyzeGaps = (data: any): ComplianceGap[] => {
  // Simple gap analysis based on responses
  const gaps: ComplianceGap[] = [];
  
  if (data && Array.isArray(data.responses)) {
    data.responses.forEach((response: any, index: number) => {
      // Create gap for low-confidence responses or negative answers
      if (response.confidence < 50 || response.value === false || response.value === 'no') {
        gaps.push({
          id: `gap-${index}`,
          category: response.categoryTag || 'General',
          title: `Gap in ${response.questionText || 'compliance area'}`,
          description: `Identified gap based on response analysis`,
          severity: response.confidence < 30 ? 'CRITICAL' : response.confidence < 60 ? 'HIGH' : 'MEDIUM',
          priority: response.confidence < 30 ? 'IMMEDIATE' : 'SHORT_TERM',
          currentState: response.notes || 'Not adequately addressed',
          requiredState: 'Fully compliant and documented',
          gapSize: 100 - (response.confidence || 50),
          estimatedCost: 'RANGE_10K_50K',
          estimatedEffort: 'MEDIUM',
          suggestedActions: [
            'Review and update policies',
            'Implement proper controls',
            'Document procedures'
          ],
          businessImpact: 'Potential compliance risk'
        } as ComplianceGap);
      }
    });
  }
  
  return gaps;
};

export const generateRecommendations = (data: any): string[] => {
  const recommendations = [
    'Implement comprehensive risk assessment framework',
    'Enhance compliance monitoring capabilities',
    'Establish regular audit procedures',
  ];
  
  // Add specific recommendations based on gaps
  if (data.gaps && data.gaps.length > 0) {
    const criticalGaps = data.gaps.filter((g: any) => g.severity === 'CRITICAL');
    if (criticalGaps.length > 0) {
      recommendations.unshift('Address critical compliance gaps immediately');
    }
  }
  
  return recommendations;
};

export const createStrategyMatrix = (gaps: ComplianceGap[], risks: RiskItem[]): any => {
  // Strategy matrix based on priority and severity
  const matrix = gaps.map(gap => ({
    priority: gap.priority,
    severity: gap.severity,
    category: gap.category,
    title: gap.title,
    actions: gap.suggestedActions
  }));
  
  return {
    matrix,
    recommendations: gaps.slice(0, 5).map(g => g.suggestedActions[0] || 'Review compliance status')
  };
};

// Export types
export type {
  AssessmentEngine,
  ComplianceGap,
  RiskItem,
  RiskAnalysis,
  Recommendation
} from './types.js';

// Configuration
export const ASSESSMENT_CONFIG = {
  openai: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 4000,
    temperature: 0.3,
    timeout: 60000
  },
  scoring: {
    weights: {
      compliance: 0.4,      // Increased from 0.3 (redistributed from maturity)
      risk: 0.5,            // Increased from 0.4 (redistributed from maturity)
      maturity: 0,          // Removed (was 0.2) - not in requirements, had bugs
      documentation: 0.1    // Unchanged
    },
    thresholds: {
      low: 30,
      medium: 60,
      high: 80
    },
    methodology: 'Weighted Risk Assessment',
    version: '1.0.0'
  },
  analysis: {
    minResponseLength: 10,
    maxConcurrentAnalyses: 5,
    cacheResultsHours: 24,
    retryAttempts: 3
  },
  credits: {
    basicAssessment: 5,
    detailedAssessment: 15,
    documentAnalysis: 10,
    aiRecommendations: 20
  },
  simulationMode: false // Using real scoring
} as const;
