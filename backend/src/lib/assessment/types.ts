/**
 * Assessment library types and interfaces
 */

import { 
  AssessmentStatus, 
  Severity, 
  Priority, 
  RiskCategory, 
  RiskLevel, 
  Likelihood, 
  Impact, 
  TemplateCategory,
  CostRange,
  EffortRange
} from '../../types/database.js';

// Core assessment interfaces
export interface AssessmentEngine {
  createAssessment(request: AssessmentRequest): Promise<AssessmentResult>;
  analyzeResponses(responses: AssessmentResponse[]): Promise<RiskAnalysis>;
  generateRecommendations(analysis: RiskAnalysis): Promise<Recommendation[]>;
  calculateRiskScore(gaps: ComplianceGap[], risks: RiskItem[]): number;
}

export interface AssessmentRequest {
  templateId: string;
  organizationId: string;
  userId: string;
  responses: AssessmentResponse[];
  documents?: DocumentReference[];
  options?: AssessmentOptions;
}

export interface AssessmentResponse {
  questionId: string;
  sectionId: string;
  value: any;
  confidence?: number;
  notes?: string;
  evidence?: string[];
  metadata?: Record<string, any>;
}

export interface AssessmentOptions {
  includeAIAnalysis?: boolean;
  includeDocumentAnalysis?: boolean;
  includeRecommendations?: boolean;
  generateReport?: boolean;
  depth?: 'basic' | 'standard' | 'comprehensive';
  customWeights?: ScoringWeights;
}

export interface DocumentReference {
  id: string;
  filename: string;
  type: string;
  s3Key: string;
  analysisRequired: boolean;
}

// Result structures
export interface AssessmentResult {
  id: string;
  templateId: string;
  organizationId: string;
  userId: string;
  status: AssessmentStatus;
  riskScore: number;
  analysis: RiskAnalysis;
  gaps: ComplianceGap[];
  risks: RiskItem[];
  recommendations: Recommendation[];
  metrics: AssessmentMetrics;
  aiInsights?: AIInsights;
  createdAt: Date;
  completedAt?: Date;
  creditsUsed: number;
}

export interface RiskAnalysis {
  overallRisk: RiskLevel;
  categoryScores: Record<RiskCategory, number>;
  maturityLevel: number;
  complianceScore: number;
  trends?: TrendAnalysis;
  benchmarks?: BenchmarkData;
}

export interface ComplianceGap {
  id: string;
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  severity: Severity;
  priority: Priority;
  currentState: string;
  requiredState: string;
  gapSize: number; // 0-100
  estimatedCost?: CostRange;
  estimatedEffort?: EffortRange;
  suggestedActions: string[];
  regulatoryRef?: string[];
  businessImpact: string;
}

export interface RiskItem {
  id: string;
  category: RiskCategory;
  title: string;
  description: string;
  likelihood: Likelihood;
  impact: Impact;
  riskLevel: RiskLevel;
  currentControls: string[];
  controlEffectiveness: number; // 0-100
  residualRisk: RiskLevel;
  mitigationStrategy?: string;
  ownerRole?: string;
  dueDate?: Date;
}

export interface Recommendation {
  id: string;
  type: 'gap' | 'risk' | 'improvement' | 'vendor';
  title: string;
  description: string;
  rationale: string;
  priority: Priority;
  expectedBenefit: string;
  implementation: ImplementationPlan;
  resources?: ResourceRequirement[];
  kpis?: string[];
  relatedGaps?: string[];
  relatedRisks?: string[];
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  totalDuration: string;
  totalCost?: CostRange;
  prerequisites?: string[];
  risks?: string[];
  successCriteria: string[];
}

export interface ImplementationPhase {
  name: string;
  duration: string;
  activities: string[];
  deliverables: string[];
  resources?: string[];
  cost?: CostRange;
}

export interface ResourceRequirement {
  type: 'internal' | 'external' | 'technology' | 'training';
  description: string;
  quantity?: number;
  cost?: CostRange;
  duration?: string;
}

// AI and analysis types
export interface AIAnalysisConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  prompts: Record<string, string>;
  contextWindow: number;
}

export interface AIInsights {
  summary: string;
  keyFindings: string[];
  industryComparison?: string;
  regulatoryAlignment: string;
  emergingRisks?: string[];
  quickWins: string[];
  strategicRecommendations: string[];
  confidence: number; // 0-100
  analysisDate: Date;
}

export interface ScoringConfig {
  weights: ScoringWeights;
  thresholds: ScoringThresholds;
  methodology: string;
  version: string;
}

export interface ScoringWeights {
  compliance: number;
  risk: number;
  maturity: number;
  documentation: number;
  governance?: number;
  technology?: number;
}

export interface ScoringThresholds {
  low: number;
  medium: number;
  high: number;
  critical?: number;
}

export interface AssessmentMetrics {
  totalQuestions: number;
  answeredQuestions: number;
  completionRate: number;
  confidenceScore: number;
  responseQuality: number;
  analysisDepth: number;
  processingTime: number; // ms
  documentsAnalyzed: number;
  aiTokensUsed?: number;
}

// Template and question types
export interface AssessmentTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: TemplateCategory;
  version: string;
  sections: TemplateSection[];
  scoringCriteria: ScoringConfig;
  aiPrompts: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  weight: number;
  order: number;
  questions: TemplateQuestion[];
}

export interface TemplateQuestion {
  id: string;
  text: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'file' | 'date' | 'scale';
  required: boolean;
  options?: string[];
  validation?: ValidationRules;
  helpText?: string;
  weight: number;
  order: number;
  scoring?: QuestionScoring;
}

export interface ValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
  custom?: string[];
}

export interface QuestionScoring {
  method: 'binary' | 'scale' | 'weighted' | 'matrix';
  scoreMap?: Record<string, number>;
  maxScore: number;
  riskCategories?: RiskCategory[];
}

// Analysis and processing types
export interface DocumentAnalysisResult {
  documentId: string;
  extractedData: Record<string, any>;
  compliance: ComplianceAnalysis;
  risks: DocumentRisk[];
  recommendations: string[];
  confidence: number;
  processingTime: number;
}

export interface ComplianceAnalysis {
  framework: string;
  requirements: ComplianceRequirement[];
  gaps: string[];
  coverage: number; // 0-100
}

export interface ComplianceRequirement {
  id: string;
  text: string;
  met: boolean;
  evidence?: string[];
  confidence: number;
}

export interface DocumentRisk {
  category: RiskCategory;
  description: string;
  severity: Severity;
  evidence: string[];
}

export interface TrendAnalysis {
  timeframe: string;
  direction: 'improving' | 'declining' | 'stable';
  changeRate: number;
  keyDrivers: string[];
  projections?: Record<string, number>;
}

export interface BenchmarkData {
  industry: string;
  companySize: string;
  region: string;
  percentile: number;
  averageScore: number;
  topPerformerScore: number;
  improvementAreas: string[];
}

// Processing and execution types
export interface ProcessingContext {
  organizationId: string;
  userId: string;
  industry?: string;
  companySize?: string;
  region?: string;
  regulatoryFrameworks?: string[];
  previousAssessments?: string[];
}

export interface AnalysisQueue {
  add(analysis: AnalysisTask): Promise<void>;
  process(): Promise<void>;
  getStatus(id: string): AnalysisStatus;
}

export interface AnalysisTask {
  id: string;
  type: 'assessment' | 'document' | 'gap' | 'risk';
  priority: number;
  data: any;
  context: ProcessingContext;
  createdAt: Date;
  attempts: number;
}

export interface AnalysisStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// Error types
export class AssessmentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AssessmentError';
  }
}

export class TemplateNotFoundError extends AssessmentError {
  constructor(templateId: string) {
    super(`Assessment template not found: ${templateId}`, 'TEMPLATE_NOT_FOUND', 404);
    this.name = 'TemplateNotFoundError';
  }
}

export class InsufficientCreditsError extends AssessmentError {
  constructor(required: number, available: number) {
    super(`Insufficient credits: ${required} required, ${available} available`, 'INSUFFICIENT_CREDITS', 402);
    this.name = 'InsufficientCreditsError';
  }
}

export class AIAnalysisError extends AssessmentError {
  constructor(message: string) {
    super(`AI analysis failed: ${message}`, 'AI_ANALYSIS_ERROR', 500);
    this.name = 'AIAnalysisError';
  }
}

export class DocumentAnalysisError extends AssessmentError {
  constructor(message: string) {
    super(`Document analysis failed: ${message}`, 'DOCUMENT_ANALYSIS_ERROR', 500);
    this.name = 'DocumentAnalysisError';
  }
}

export class ValidationError extends AssessmentError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

// Utility types
export interface RecommendationEngine {
  generateRecommendations(
    gaps: ComplianceGap[],
    risks: RiskItem[],
    context: ProcessingContext
  ): Promise<Recommendation[]>;
}

export interface GapAnalyzer {
  identifyGaps(
    responses: AssessmentResponse[],
    template: AssessmentTemplate,
    context: ProcessingContext
  ): Promise<ComplianceGap[]>;
}

export interface RiskAnalyzer {
  assessRisks(
    responses: AssessmentResponse[],
    gaps: ComplianceGap[],
    context: ProcessingContext
  ): Promise<RiskItem[]>;
}

export interface ScoreCalculator {
  calculateOverallScore(
    gaps: ComplianceGap[],
    risks: RiskItem[],
    config: ScoringConfig
  ): number;
  
  calculateCategoryScores(
    gaps: ComplianceGap[],
    risks: RiskItem[]
  ): Record<RiskCategory, number>;
}

// Export configuration type
export interface AssessmentConfig {
  openai: {
    model: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
  };
  scoring: {
    weights: ScoringWeights;
    thresholds: ScoringThresholds;
  };
  analysis: {
    minResponseLength: number;
    maxConcurrentAnalyses: number;
    cacheResultsHours: number;
    retryAttempts: number;
  };
  credits: Record<string, number>;
}