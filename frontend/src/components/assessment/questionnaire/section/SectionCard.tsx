import { CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { SectionCardProps } from '../types/questionnaire.types';

/**
 * SectionCard
 * Card displaying section information with progress and action button
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  sectionNumber,
  progress,
  isComplete,
  isStarted,
  onClick,
}) => {
  const getStatusIcon = () => {
    if (isComplete) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (isStarted) return <Clock className="h-5 w-5 text-yellow-500" />;
    return <PlayCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isComplete) return 'Complete';
    if (isStarted) return 'In Progress';
    return 'Not Started';
  };

  const getActionButton = () => {
    if (isComplete) {
      return (
        <Button variant="outline" onClick={onClick} className="w-full">
          Review Answers
        </Button>
      );
    }
    if (isStarted) {
      return (
        <Button onClick={onClick} className="w-full bg-cyan-600 hover:bg-cyan-700">
          Continue Section →
        </Button>
      );
    }
    return (
      <Button onClick={onClick} className="w-full bg-cyan-600 hover:bg-cyan-700">
        Start Section →
      </Button>
    );
  };

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md cursor-pointer',
        isComplete && 'border-green-200 bg-green-50/50',
        isStarted && !isComplete && 'border-yellow-200 bg-yellow-50/50'
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <span className="text-sm font-medium text-gray-400">{getStatusText()}</span>
            </div>
            <CardTitle className="text-lg">
              Section {sectionNumber}: {section.title}
            </CardTitle>
            <CardDescription className="mt-2">{section.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">
              {progress.answered}/{progress.total} questions complete
            </span>
            <span className="font-medium text-white">{section.weight}% of overall score</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>

        {/* Action button */}
        {getActionButton()}
      </CardContent>
    </Card>
  );
};
