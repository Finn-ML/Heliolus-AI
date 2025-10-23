// Assessment Types
export type AssessmentStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Priority = 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
// Updated to match backend enum changes from stories 1-11
export type CostRange =
  | 'UNDER_10K'
  | 'RANGE_10K_50K'
  | 'RANGE_50K_100K'
  | 'RANGE_100K_250K'
  | 'OVER_250K';
export type EffortRange = 'SMALL' | 'MEDIUM' | 'LARGE';
export type RiskCategory =
  | 'GEOGRAPHIC'
  | 'TRANSACTION'
  | 'GOVERNANCE'
  | 'OPERATIONAL'
  | 'REGULATORY'
  | 'REPUTATIONAL';
export type Likelihood = 'RARE' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'CERTAIN';
export type Impact = 'NEGLIGIBLE' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'CATASTROPHIC';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TemplateCategory =
  | 'FINANCIAL_CRIME'
  | 'TRADE_COMPLIANCE'
  | 'DATA_PRIVACY'
  | 'CYBERSECURITY'
  | 'ESG';
export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'TEXT'
  | 'NUMBER'
  | 'RATING'
  | 'CHECKLIST';

// Template interfaces
export interface AssessmentTemplate {
  id: string;
  name: string;
  slug: string;
  category: TemplateCategory;
  description: string;
  version: string;
  isActive: boolean;
  estimatedMinutes: number;
  totalQuestions: number;
  sections: TemplateSection[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  questions: TemplateQuestion[];
}

export interface TemplateQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  helpText?: string;
  order: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  value: string;
  order: number;
}

export interface QuestionValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

// AI Risk Analysis interfaces
export interface KeyFinding {
  finding: string;
  severity: Severity;
  description: string;
}

export interface MitigationStrategy {
  strategy: string;
  priority: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  impact: 'high' | 'medium' | 'low';
  rationale?: string;
  estimatedTimeframe?: string;
  keyActions?: string[];
}

export interface CategoryRiskAnalysis {
  score: number;
  totalGaps: number;
  criticalGaps: number;
  keyFindings: KeyFinding[];
  mitigationStrategies: MitigationStrategy[];
}

export interface AIRiskAnalysis {
  [category: string]: CategoryRiskAnalysis;
}

export interface StrategyMatrixRow {
  priority: number;
  riskArea: string;
  adjustedRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  urgency: string;
  impact: string;
  primaryMitigation: string;
  timeline: string;
  budget: string;
  businessOwner: string;
  gapCount: number;
  criticalGaps: number;
}

// Assessment interfaces
export interface Assessment {
  id: string;
  organizationId: string;
  templateId: string;
  template?: AssessmentTemplate;
  status: AssessmentStatus;
  responses: Record<string, any>;
  riskScore?: number;
  creditsUsed: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  aiRiskAnalysis?: AIRiskAnalysis;
  aiStrategyMatrix?: StrategyMatrixRow[];
  aiGeneratedAt?: string;
}

export interface AssessmentResponse {
  questionId: string;
  answer: any;
  timestamp: string;
}

// Gap Analysis interfaces
export interface Gap {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: Severity;
  priority: Priority;
  estimatedCost: CostRange;
  estimatedEffort: EffortRange;
  recommendations?: string[];
  mitigationSteps?: string[];
}

// Risk Analysis interfaces
export interface Risk {
  id: string;
  category: RiskCategory;
  title: string;
  description: string;
  likelihood: Likelihood;
  impact: Impact;
  riskLevel: RiskLevel;
  mitigationStrategy: string;
  currentControls?: string[];
  recommendedActions?: string[];
}

// Assessment Results
export interface AssessmentResults {
  assessment: Assessment;
  gaps: Gap[];
  risks: Risk[];
  overallRiskScore: number;
  summary: {
    totalGaps: number;
    criticalGaps: number;
    highRisks: number;
    estimatedCost: string;
    estimatedEffort: string;
    priority: Priority;
  };
  recommendations: string[];
  nextSteps: string[];
  lowConfidenceAnswers?: Array<{
    questionId: string;
    question: string;
    sectionTitle: string;
    confidence: number;
    currentAnswer: string;
  }>;
}

// API Request/Response types
export interface CreateAssessmentRequest {
  organizationId: string;
  templateId: string;
}

export interface UpdateAssessmentRequest {
  responses?: Record<string, any>;
  status?: AssessmentStatus;
}

export interface TemplateFilters {
  category?: TemplateCategory;
  active?: boolean;
  search?: string;
}

// Freemium types
export interface FreemiumRestrictions {
  isFreeTier: boolean;
  assessmentsUsed: number;
  assessmentsLimit: number;
  canViewFullResults: boolean;
  canDownloadReports: boolean;
  canAccessMarketplace: boolean;
}

// UI State types
export interface AssessmentFlowState {
  currentSection: number;
  currentQuestion: number;
  responses: Record<string, any>;
  isComplete: boolean;
  isDraft: boolean;
  progress: number;
}

export interface AssessmentProgress {
  sectionIndex: number;
  questionIndex: number;
  totalSections: number;
  totalQuestions: number;
  completedQuestions: number;
  percentComplete: number;
}
