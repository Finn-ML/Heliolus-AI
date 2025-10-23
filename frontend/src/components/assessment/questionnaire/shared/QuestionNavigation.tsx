import { ArrowLeft, ArrowRight, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuestionNavigationProps } from '../types/questionnaire.types';

/**
 * QuestionNavigation
 * Navigation buttons for questions (Previous, Next, Back to Sections)
 */
export const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  onPrevious,
  onNext,
  onBackToNav,
  canGoBack,
  canGoForward,
  isLastQuestion,
}) => {
  return (
    <div className="flex items-center justify-between">
      {/* Left: Previous button */}
      <Button variant="outline" onClick={onPrevious} disabled={!canGoBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Previous Question
      </Button>

      {/* Center: Back to sections */}
      <Button variant="ghost" onClick={onBackToNav} className="gap-2">
        <List className="h-4 w-4" />
        Back to Sections
      </Button>

      {/* Right: Next button */}
      <Button
        onClick={onNext}
        disabled={!canGoForward}
        className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 gap-2"
      >
        {isLastQuestion ? 'Complete Section' : 'Next Question'}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
