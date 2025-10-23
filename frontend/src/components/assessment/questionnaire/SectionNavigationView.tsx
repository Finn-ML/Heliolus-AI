import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { JourneyStepHeader } from '../shared';
import { SectionCard } from './section/SectionCard';
import {
  calculateSectionProgress,
  calculateOverallProgress,
  type SectionNavigationViewProps,
} from './types/questionnaire.types';

/**
 * SectionNavigationView
 * Overview of all sections with progress tracking
 * Allows navigation to specific sections
 */
export const SectionNavigationView: React.FC<SectionNavigationViewProps> = ({
  template,
  answers,
  onSectionClick,
  onComplete,
  canComplete,
  onBack,
  onSaveDraft,
}) => {
  const overallProgress = useMemo(() => {
    return calculateOverallProgress(template, answers);
  }, [template, answers]);

  return (
    <div className="space-y-6">
      <JourneyStepHeader
        title={template.name}
        description="Complete all sections to receive your risk assessment results"
        stepNumber={5}
        totalSteps={10}
      />

      {/* Overall progress */}
      <div className="bg-gray-800/50 rounded-lg border p-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-400">
            {overallProgress.answered}/{overallProgress.total} questions
          </span>
        </div>
        <Progress value={overallProgress.percentage} className="h-2" />
        <p className="text-xs text-gray-500 mt-2">{overallProgress.percentage}% complete</p>
      </div>

      {/* Section cards */}
      <div className="space-y-4">
        {template.sections.map((section, index) => {
          const sectionProgress = calculateSectionProgress(section, answers);
          const isComplete = sectionProgress.answered === sectionProgress.total;
          const isStarted = sectionProgress.answered > 0;

          return (
            <SectionCard
              key={section.id}
              section={section}
              sectionNumber={index + 1}
              progress={sectionProgress}
              isComplete={isComplete}
              isStarted={isStarted}
              onClick={() => onSectionClick(section.id)}
            />
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {onSaveDraft && (
            <Button variant="outline" onClick={onSaveDraft}>
              Save & Exit
            </Button>
          )}
        </div>

        <Button
          onClick={onComplete}
          disabled={!canComplete}
          className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600"
        >
          Complete Assessment →
        </Button>
      </div>
    </div>
  );
};
