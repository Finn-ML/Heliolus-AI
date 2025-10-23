import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getQuestionWeightLabel, type QuestionHeaderProps } from '../types/questionnaire.types';

/**
 * QuestionHeader
 * Question number, weight indicator (Foundational/Standard)
 */
export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  questionNumber,
  totalQuestions,
  weight,
  isFoundational,
}) => {
  const weightInfo = getQuestionWeightLabel(weight);

  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-gray-400">
        Question {questionNumber} of {totalQuestions}
      </span>

      {weightInfo.isFoundational && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Star className="h-3 w-3 mr-1 fill-current" />
          Foundational
        </Badge>
      )}
    </div>
  );
};
