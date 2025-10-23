import { useMemo } from 'react';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JourneyStepHeader } from '../shared';
import {
  calculateEvidenceSummary,
  formatAnswer,
  type ReviewScreenProps,
} from './types/questionnaire.types';

/**
 * ReviewScreen
 * Final review of all answers before submission
 * Shows evidence summary and allows editing
 */
export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  template,
  answers,
  onBack,
  onEditSection,
  onSubmit,
  isSubmitting,
}) => {
  const evidenceSummary = useMemo(() => {
    return calculateEvidenceSummary(answers);
  }, [answers]);

  const totalAnswers = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      <JourneyStepHeader
        title="Review Your Assessment"
        description="Please review your answers before submission"
        stepNumber={5}
        totalSteps={10}
      />

      {/* Completion status */}
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <span className="font-medium text-green-900">
            All sections complete ({totalAnswers} questions answered)
          </span>
        </AlertDescription>
      </Alert>

      {/* Section reviews */}
      <div className="space-y-4">
        {template.sections.map((section, index) => {
          const sectionAnswers = section.questions
            .map(q => ({ question: q, answer: answers[q.id] }))
            .filter(({ answer }) => answer);

          return (
            <Card key={section.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Section {index + 1}: {section.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {section.weight}% of overall score • {sectionAnswers.length} questions
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onEditSection(section.id)}>
                  Edit Section
                </Button>
              </div>

              {/* Show first 3 questions */}
              <div className="space-y-3">
                {sectionAnswers.slice(0, 3).map(({ question, answer }) => (
                  <div key={question.id} className="text-sm border-l-2 border-gray-700 pl-3">
                    <p className="text-gray-700 font-medium">Q: {question.text}</p>
                    <p className="text-white mt-1">
                      A: {formatAnswer(answer.value)}
                      {answer.preFilled && (
                        <span className="ml-2 text-xs text-blue-600">(Pre-filled)</span>
                      )}
                    </p>
                  </div>
                ))}
                {sectionAnswers.length > 3 && (
                  <p className="text-sm text-gray-500 italic">
                    + {sectionAnswers.length - 3} more questions answered
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Evidence summary */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-white mb-4">💡 Evidence Summary</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium">
              {evidenceSummary.tier2Count}
            </span>
            <span>
              answers pre-filled from documents (TIER_2) - {evidenceSummary.tier2Percentage}%
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
              {evidenceSummary.tier1Count}
            </span>
            <span>
              answers claimed with basic evidence (TIER_1) - {evidenceSummary.tier1Percentage}%
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-medium">
              {evidenceSummary.tier0Count}
            </span>
            <span>answers self-declared (TIER_0) - {evidenceSummary.tier0Percentage}%</span>
          </li>
        </ul>
        <div className="mt-4 p-3 bg-gray-800/50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>⚠️ Important:</strong> Your assessment will be scored based on answer quality
            and evidence tier. Higher evidence tiers (TIER_2 &gt; TIER_1 &gt; TIER_0) result in
            higher scores.
          </p>
        </div>
      </Card>

      {/* Submit actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Edit
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Assessment ✓'
          )}
        </Button>
      </div>
    </div>
  );
};
