import { cn } from '@/lib/utils';
import type { QuestionProgressDotsProps } from '../types/questionnaire.types';

/**
 * QuestionProgressDots
 * Dot indicators showing progress through section questions
 */
export const QuestionProgressDots: React.FC<QuestionProgressDotsProps> = ({
  total,
  current,
  answered = [],
}) => {
  return (
    <div className="flex items-center gap-2" role="navigation" aria-label="Question progress">
      {Array.from({ length: total }, (_, index) => {
        const isCurrent = index === current;
        const isAnswered = answered.includes(index);

        return (
          <div
            key={index}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-all',
              isCurrent && 'w-8 bg-cyan-500',
              !isCurrent && isAnswered && 'bg-green-500',
              !isCurrent && !isAnswered && 'bg-gray-300'
            )}
            title={`Question ${index + 1}${isCurrent ? ' (current)' : ''}${isAnswered ? ' (answered)' : ''}`}
          />
        );
      })}
    </div>
  );
};
