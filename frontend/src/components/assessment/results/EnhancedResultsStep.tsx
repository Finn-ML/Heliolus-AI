import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { JourneyStepContainer, JourneyStepHeader, JourneyNavigation, ErrorState } from '../shared';
import { OverallScoreCard } from './OverallScoreCard';
import { EvidenceQualityPanel } from './EvidenceQualityPanel';
import { SectionBreakdownPanel } from './SectionBreakdownPanel';
import { MethodologyAccordion } from './MethodologyAccordion';
import { NextStepsPanel } from './NextStepsPanel';
import type { EnhancedResultsStepProps } from './types/results.types';

/**
 * EnhancedResultsStep
 * Main component for displaying assessment results with evidence-weighted scoring
 * Step 7 in the assessment journey
 */
export const EnhancedResultsStep: React.FC<EnhancedResultsStepProps> = ({
  assessmentId,
  onContinue,
  onBack,
}) => {
  const {
    data: results,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['assessment-results', assessmentId],
    queryFn: async () => {
      const { assessmentApi } = await import('@/lib/api');
      return assessmentApi.getEnhancedResults(assessmentId);
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  if (isLoading) {
    return (
      <JourneyStepContainer>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
          <p className="mt-4 text-lg text-gray-400">Calculating your risk score...</p>
          <p className="text-sm text-gray-500">Analyzing answers with evidence weighting</p>
        </div>
      </JourneyStepContainer>
    );
  }

  if (isError || !results) {
    return (
      <JourneyStepContainer>
        <ErrorState message="Failed to calculate assessment results" onRetry={refetch} />
      </JourneyStepContainer>
    );
  }

  return (
    <JourneyStepContainer>
      <JourneyStepHeader
        title="🎉 Your Risk Assessment Results"
        description={`Based on ${results.totalAnswers} answers with evidence-weighted scoring`}
        stepNumber={7}
        totalSteps={10}
      />

      {/* Overall score card */}
      <div className="mt-6">
        <OverallScoreCard
          score={results.overallScore}
          confidenceLevel={results.confidenceLevel}
          totalAnswers={results.totalAnswers}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Evidence quality */}
        <EvidenceQualityPanel distribution={results.evidenceDistribution} />

        {/* Section breakdown */}
        <SectionBreakdownPanel sections={results.sectionBreakdown} />
      </div>

      {/* Methodology explanation */}
      <MethodologyAccordion methodology={results.methodology} />

      {/* Next steps */}
      <NextStepsPanel assessmentId={assessmentId} hasPriorities={results.hasPriorities} />

      {/* Navigation */}
      <div className="mt-8">
        <JourneyNavigation
          onBack={onBack}
          onContinue={onContinue}
          continueLabel="Continue to Gap Analysis"
        />
      </div>
    </JourneyStepContainer>
  );
};
