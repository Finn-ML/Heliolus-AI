/**
 * Template Selection Component Types
 * Type definitions for Step 3: Template Selection in assessment journey
 */

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  questionCount: number;
  estimatedMinutes: number;
  icon?: string; // emoji or icon name
  version?: string;
  isActive?: boolean;
}

export interface TemplateSelectionStepProps {
  assessmentId: string;
  onTemplateSelected: (templateId: string) => void;
  onBack: () => void;
  initialTemplateId?: string; // if returning to this step
}

export interface TemplateCardProps {
  template: AssessmentTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

export interface TemplateCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export type TemplateCategory = 'all' | 'financial_crime' | 'trade_compliance' | 'data_privacy';

export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Templates',
  financial_crime: 'Financial Crime',
  trade_compliance: 'Trade Compliance',
  data_privacy: 'Data Privacy',
};

export const CATEGORY_COLORS: Record<string, string> = {
  financial_crime: 'cyan',
  trade_compliance: 'pink',
  data_privacy: 'green',
};
