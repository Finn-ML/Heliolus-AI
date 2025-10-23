import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JourneyStepContainer, JourneyStepHeader, JourneyNavigation, ErrorState } from './shared';
import { TemplateCard } from './TemplateCard';
import { TemplateCategoryFilter } from './TemplateCategoryFilter';
import { templateApi } from '@/lib/api';
import type { TemplateSelectionStepProps } from './types/template-selection.types';

/**
 * TemplateSelectionStep
 * Main container for template selection step (Step 3 of assessment journey)
 * Allows users to select an assessment template without leaving the journey flow
 */
export const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  assessmentId,
  onTemplateSelected,
  onBack,
  initialTemplateId,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    initialTemplateId || null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch templates using TanStack Query
  const {
    data: templates,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateApi.getTemplates(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (selectedCategory === 'all') return templates;
    return templates.filter(t => t.category.toLowerCase() === selectedCategory);
  }, [templates, selectedCategory]);

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  const handleContinue = () => {
    if (selectedTemplateId) {
      onTemplateSelected(selectedTemplateId);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <JourneyStepContainer>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <p className="mt-4 text-gray-600">Loading assessment templates...</p>
        </div>
      </JourneyStepContainer>
    );
  }

  // Error state
  if (isError) {
    return (
      <JourneyStepContainer>
        <ErrorState message="Failed to load assessment templates" onRetry={refetch} />
      </JourneyStepContainer>
    );
  }

  return (
    <JourneyStepContainer>
      <JourneyStepHeader
        title="Choose Your Assessment Template"
        description="Select the compliance framework that best matches your organization's needs."
        stepNumber={3}
        totalSteps={10}
      />

      <TemplateCategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={['all', 'financial_crime', 'trade_compliance', 'data_privacy']}
      />

      {/* Template grid with animation */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
        role="radiogroup"
        aria-labelledby="template-selection-label"
      >
        <h2 id="template-selection-label" className="sr-only">
          Available Assessment Templates
        </h2>

        <AnimatePresence mode="popLayout">
          {filteredTemplates.map(template => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <TemplateCard
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => setSelectedTemplateId(template.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No templates found for this category.</p>
          <Button variant="link" onClick={() => setSelectedCategory('all')} className="mt-4">
            Clear filters
          </Button>
        </div>
      )}

      {/* Navigation */}
      <JourneyNavigation
        onBack={onBack}
        onContinue={handleContinue}
        canContinue={!!selectedTemplateId}
        continueLabel={selectedTemplate ? `Continue with ${selectedTemplate.name}` : 'Continue'}
      />
    </JourneyStepContainer>
  );
};
