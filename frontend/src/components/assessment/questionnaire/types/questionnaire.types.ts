/**
 * Type definitions for Guided Questionnaire components
 * Based on COMPONENT-SPEC-STEP5-GUIDED-QUESTIONNAIRE.md
 */

// ============================================================================
// Enums
// ============================================================================

export type QuestionType = 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TEXT' | 'RATING' | 'YES_NO';

export type EvidenceTier = 'TIER_0' | 'TIER_1' | 'TIER_2';

export type AIConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type CurrentView = 'section-nav' | 'question' | 'review';

// ============================================================================
// Core Domain Models
// ============================================================================

export interface QuestionOption {
  id: string;
  text: string;
  points: number; // 0-10 scale
}

export interface Question {
  id: string;
  text: string;
  helpText?: string;
  type: QuestionType;
  weight: number; // 0.6-1.0 (within section)
  options?: QuestionOption[];
  order: number;
}

export interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  weight: number; // 0-100 (percentage of overall score)
  order: number;
  questions: Question[];
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  sections: AssessmentSection[];
}

export interface Answer {
  questionId: string;
  value: string | string[]; // string for single, array for multiple
  notes?: string;
  preFilled: boolean;
  evidenceTier?: EvidenceTier;
  sourceDocumentId?: string;
  aiConfidence?: AIConfidence;
  aiExplanation?: string;
}

// ============================================================================
// State Management
// ============================================================================

export interface QuestionnaireState {
  currentView: CurrentView;
  currentSectionId: string | null;
  currentQuestionIndex: number;
  answers: Record<string, Answer>; // Keyed by questionId
  lastSaved: Date | null;
  isSubmitting: boolean;
}

export interface SectionProgress {
  answered: number;
  total: number;
  percentage: number;
}

export interface OverallProgress {
  answered: number;
  total: number;
  percentage: number;
}

// ============================================================================
// Component Props
// ============================================================================

// Main orchestrator
export interface GuidedQuestionnaireStepProps {
  assessmentId: string;
  templateId: string;
  onComplete: () => void;
  onBack: () => void;
  onSaveDraft?: () => void;
}

// Section Navigation View
export interface SectionNavigationViewProps {
  template: AssessmentTemplate;
  answers: Record<string, Answer>;
  onSectionClick: (sectionId: string) => void;
  onComplete: () => void;
  canComplete: boolean;
  onBack: () => void;
  onSaveDraft?: () => void;
}

// Question View
export interface QuestionViewProps {
  section: AssessmentSection;
  questionIndex: number;
  answer: Answer | undefined;
  onAnswerChange: (questionId: string, answer: Answer) => void;
  onNext: () => void;
  onPrevious: () => void;
  onBackToNav: () => void;
  lastSaved: Date | null;
}

// Review Screen
export interface ReviewScreenProps {
  template: AssessmentTemplate;
  answers: Record<string, Answer>;
  onBack: () => void;
  onEditSection: (sectionId: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

// ============================================================================
// Section Components
// ============================================================================

export interface SectionCardProps {
  section: AssessmentSection;
  sectionNumber: number;
  progress: SectionProgress;
  isComplete: boolean;
  isStarted: boolean;
  onClick: () => void;
}

export interface SectionHeaderProps {
  title: string;
  description: string;
  weight: number;
  progress: {
    current: number;
    total: number;
  };
}

export interface SectionProgressProps {
  current: number;
  total: number;
  showPercentage?: boolean;
}

// ============================================================================
// Question Components
// ============================================================================

export interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  answer: Answer | undefined;
  onAnswerChange: (answer: Answer) => void;
  children: React.ReactNode;
}

export interface QuestionHeaderProps {
  questionNumber: number;
  totalQuestions: number;
  weight: number;
  isFoundational: boolean;
}

export interface QuestionHelpProps {
  helpText: string;
}

export interface QuestionProgressDotsProps {
  total: number;
  current: number;
  answered?: number[];
}

// ============================================================================
// Input Components
// ============================================================================

export interface MultipleChoiceInputProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: QuestionOption[];
  multiple?: boolean;
}

export interface TextAreaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  labels?: string[];
}

export interface YesNoInputProps {
  value: string;
  onChange: (value: string) => void;
}

// ============================================================================
// Evidence Components
// ============================================================================

export interface EvidenceIndicatorProps {
  tier: EvidenceTier;
  sourceDocumentId?: string;
  aiConfidence?: AIConfidence;
  aiExplanation?: string;
  onViewDocument?: () => void;
  onViewExplanation?: () => void;
}

export interface DocumentSourceLinkProps {
  documentId: string;
  documentName: string;
  onClick?: () => void;
}

export interface AIConfidenceBadgeProps {
  confidence: AIConfidence;
}

export interface EvidenceTierBadgeProps {
  tier: EvidenceTier;
}

// ============================================================================
// Shared Components
// ============================================================================

export interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
  isSaving?: boolean;
}

export interface QuestionNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  onBackToNav: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  isLastQuestion: boolean;
}

// ============================================================================
// Evidence Tier Metadata
// ============================================================================

export const EVIDENCE_TIER_CONFIG = {
  TIER_0: {
    label: 'Self-Declared',
    description: 'No supporting documentation provided',
    multiplier: 0.6,
    color: 'gray',
    icon: '📝',
  },
  TIER_1: {
    label: 'Claimed with Basic Evidence',
    description: 'Supporting documentation referenced but not pre-filled',
    multiplier: 0.8,
    color: 'blue',
    icon: '📄',
  },
  TIER_2: {
    label: 'Pre-filled from Documents',
    description: 'Answer extracted from uploaded documents',
    multiplier: 1.0,
    color: 'green',
    icon: '✅',
  },
} as const;

export const AI_CONFIDENCE_CONFIG = {
  LOW: {
    label: 'Low Confidence',
    description: 'AI is uncertain about this answer',
    color: 'red',
  },
  MEDIUM: {
    label: 'Medium Confidence',
    description: 'AI has moderate confidence in this answer',
    color: 'yellow',
  },
  HIGH: {
    label: 'High Confidence',
    description: 'AI is confident about this answer',
    color: 'green',
  },
} as const;

// ============================================================================
// Helper Types
// ============================================================================

export interface EvidenceSummary {
  tier0Count: number;
  tier1Count: number;
  tier2Count: number;
  tier0Percentage: number;
  tier1Percentage: number;
  tier2Percentage: number;
}

export interface QuestionWeight {
  isFoundational: boolean; // weight > 1.0
  weight: number;
  label: string; // "Foundational" or "Standard"
}

// ============================================================================
// Utility Functions (type guards)
// ============================================================================

export const isMultipleSelect = (answer: Answer): boolean => {
  return Array.isArray(answer.value);
};

export const isAnswerComplete = (answer: Answer | undefined): boolean => {
  if (!answer) return false;
  if (Array.isArray(answer.value)) {
    return answer.value.length > 0;
  }
  return answer.value.trim().length > 0;
};

export const getQuestionWeightLabel = (weight: number): QuestionWeight => {
  const isFoundational = weight > 1.0;
  return {
    isFoundational,
    weight,
    label: isFoundational ? 'Foundational' : 'Standard',
  };
};

export const calculateSectionProgress = (
  section: AssessmentSection,
  answers: Record<string, Answer>
): SectionProgress => {
  const total = section.questions.length;
  const answered = section.questions.filter(q => {
    const answer = answers[q.id];
    return isAnswerComplete(answer);
  }).length;
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  return { answered, total, percentage };
};

export const calculateOverallProgress = (
  template: AssessmentTemplate,
  answers: Record<string, Answer>
): OverallProgress => {
  const total = template.sections.reduce((sum, section) => sum + section.questions.length, 0);
  const answered = Object.values(answers).filter(isAnswerComplete).length;
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  return { answered, total, percentage };
};

export const calculateEvidenceSummary = (answers: Record<string, Answer>): EvidenceSummary => {
  const answerArray = Object.values(answers).filter(isAnswerComplete);
  const total = answerArray.length;

  const tier0Count = answerArray.filter(a => !a.evidenceTier || a.evidenceTier === 'TIER_0').length;
  const tier1Count = answerArray.filter(a => a.evidenceTier === 'TIER_1').length;
  const tier2Count = answerArray.filter(a => a.evidenceTier === 'TIER_2').length;

  return {
    tier0Count,
    tier1Count,
    tier2Count,
    tier0Percentage: total > 0 ? Math.round((tier0Count / total) * 100) : 0,
    tier1Percentage: total > 0 ? Math.round((tier1Count / total) * 100) : 0,
    tier2Percentage: total > 0 ? Math.round((tier2Count / total) * 100) : 0,
  };
};

export const formatAnswer = (value: string | string[] | undefined): string => {
  if (!value) return 'Not answered';
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value;
};
