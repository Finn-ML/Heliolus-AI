import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SectionHeader } from './section/SectionHeader';
import { QuestionHeader } from './question/QuestionHeader';
import { QuestionHelp } from './question/QuestionHelp';
import { QuestionProgressDots } from './question/QuestionProgressDots';
import { MultipleChoiceInput } from './inputs/MultipleChoiceInput';
import { TextAreaInput } from './inputs/TextAreaInput';
import { RatingInput } from './inputs/RatingInput';
import { YesNoInput } from './inputs/YesNoInput';
import { EvidenceIndicator } from './evidence/EvidenceIndicator';
import { AutoSaveIndicator } from './shared/AutoSaveIndicator';
import { QuestionNavigation } from './shared/QuestionNavigation';
import {
  getQuestionWeightLabel,
  type QuestionViewProps,
  type Answer,
} from './types/questionnaire.types';

/**
 * QuestionView
 * Main view for answering a single question
 * Handles all question types and evidence display
 */
export const QuestionView: React.FC<QuestionViewProps> = ({
  section,
  questionIndex,
  answer,
  onAnswerChange,
  onNext,
  onPrevious,
  onBackToNav,
  lastSaved,
}) => {
  const question = section.questions[questionIndex];
  const [localAnswer, setLocalAnswer] = useState<string | string[]>(answer?.value || '');
  const [notes, setNotes] = useState(answer?.notes || '');

  // Update local state when answer prop changes
  useEffect(() => {
    setLocalAnswer(answer?.value || '');
    setNotes(answer?.notes || '');
  }, [answer]);

  const handleValueChange = (value: string | string[]) => {
    setLocalAnswer(value);
    onAnswerChange(question.id, {
      questionId: question.id,
      value,
      notes,
      preFilled: answer?.preFilled || false,
      evidenceTier: answer?.evidenceTier,
      sourceDocumentId: answer?.sourceDocumentId,
      aiConfidence: answer?.aiConfidence,
      aiExplanation: answer?.aiExplanation,
    });
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    onAnswerChange(question.id, {
      questionId: question.id,
      value: localAnswer,
      notes: newNotes,
      preFilled: answer?.preFilled || false,
      evidenceTier: answer?.evidenceTier,
      sourceDocumentId: answer?.sourceDocumentId,
      aiConfidence: answer?.aiConfidence,
      aiExplanation: answer?.aiExplanation,
    });
  };

  const renderAnswerInput = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoiceInput
            value={localAnswer as string}
            onChange={handleValueChange}
            options={question.options || []}
            multiple={false}
          />
        );
      case 'MULTIPLE_SELECT':
        return (
          <MultipleChoiceInput
            value={localAnswer as string[]}
            onChange={handleValueChange}
            options={question.options || []}
            multiple={true}
          />
        );
      case 'TEXT':
        return <TextAreaInput value={localAnswer as string} onChange={handleValueChange} />;
      case 'RATING':
        return (
          <RatingInput
            value={Number(localAnswer) || 0}
            onChange={v => handleValueChange(String(v))}
          />
        );
      case 'YES_NO':
        return <YesNoInput value={localAnswer as string} onChange={handleValueChange} />;
      default:
        return null;
    }
  };

  const weightInfo = getQuestionWeightLabel(question.weight);
  const hasAnswer =
    localAnswer &&
    (Array.isArray(localAnswer) ? localAnswer.length > 0 : localAnswer.trim().length > 0);

  // Calculate answered questions for progress dots
  const answeredQuestions = section.questions
    .map((q, idx) => idx)
    .filter(idx => {
      const ans = answer?.value;
      return ans && (Array.isArray(ans) ? ans.length > 0 : String(ans).trim().length > 0);
    });

  return (
    <div className="space-y-6">
      {/* Section header with progress */}
      <SectionHeader
        title={section.title}
        description={section.description}
        weight={section.weight}
        progress={{
          current: questionIndex + 1,
          total: section.questions.length,
        }}
      />

      {/* Question card */}
      <Card className="p-8">
        <QuestionHeader
          questionNumber={questionIndex + 1}
          totalQuestions={section.questions.length}
          weight={question.weight}
          isFoundational={weightInfo.isFoundational}
        />

        <div className="mt-6 space-y-6">
          {/* Question text */}
          <div>
            <h3 className="text-lg font-medium text-white mb-2">{question.text}</h3>
            {question.helpText && <QuestionHelp helpText={question.helpText} />}
          </div>

          {/* Answer input (type-specific) */}
          <div>{renderAnswerInput()}</div>

          {/* Evidence indicator (if pre-filled) */}
          {answer?.preFilled && answer.evidenceTier && (
            <EvidenceIndicator
              tier={answer.evidenceTier}
              sourceDocumentId={answer.sourceDocumentId}
              aiConfidence={answer.aiConfidence}
              aiExplanation={answer.aiExplanation}
            />
          )}

          {/* Optional notes */}
          <div>
            <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="Add any additional context or explanations..."
              rows={3}
              className="w-full"
            />
          </div>

          {/* Auto-save indicator */}
          <AutoSaveIndicator lastSaved={lastSaved} />
        </div>
      </Card>

      {/* Navigation */}
      <div className="space-y-4">
        {/* Progress dots */}
        <div className="flex justify-center">
          <QuestionProgressDots
            total={section.questions.length}
            current={questionIndex}
            answered={answeredQuestions}
          />
        </div>

        {/* Navigation buttons */}
        <QuestionNavigation
          onPrevious={onPrevious}
          onNext={onNext}
          onBackToNav={onBackToNav}
          canGoBack={questionIndex > 0}
          canGoForward={hasAnswer}
          isLastQuestion={questionIndex === section.questions.length - 1}
        />
      </div>
    </div>
  );
};
