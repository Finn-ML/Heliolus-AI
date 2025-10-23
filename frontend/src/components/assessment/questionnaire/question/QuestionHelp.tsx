import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuestionHelpProps } from '../types/questionnaire.types';

/**
 * QuestionHelp
 * Collapsible help text for questions
 */
export const QuestionHelp: React.FC<QuestionHelpProps> = ({ helpText }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-auto p-0 text-cyan-600 hover:text-cyan-700 hover:bg-transparent"
      >
        <HelpCircle className="h-4 w-4 mr-1.5" />
        <span className="text-sm">Need help with this question?</span>
        <ChevronDown
          className={cn('h-4 w-4 ml-1 transition-transform', isExpanded && 'rotate-180')}
        />
      </Button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
          {helpText}
        </div>
      )}
    </div>
  );
};
