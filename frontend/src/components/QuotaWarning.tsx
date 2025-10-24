import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuotaWarningProps {
  used: number;
  total: number;
  message?: string;
}

export function QuotaWarning({ used, total, message }: QuotaWarningProps) {
  const navigate = useNavigate();
  const percentage = (used / total) * 100;

  // Determine color based on usage
  const getVariant = () => {
    if (used >= total) return 'destructive'; // Red
    if (used === total - 1) return 'default'; // Yellow
    return 'default'; // Green
  };

  const getProgressColor = () => {
    if (used >= total) return 'bg-destructive';
    if (used === total - 1) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getIcon = () => {
    if (used >= total) return AlertCircle;
    if (used === total - 1) return AlertTriangle;
    return AlertCircle;
  };

  const Icon = getIcon();
  const variant = getVariant();

  // Quota exceeded - show prominent alert
  if (used >= total) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Assessment Limit Reached</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>
            You've used all {total} of your free assessments. Upgrade to Premium to unlock unlimited
            assessments and full features.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => navigate('/pricing?upgrade=premium')}
              variant="default"
              size="sm"
            >
              Upgrade to Premium
            </Button>
            <Button
              onClick={() => navigate('/pricing')}
              variant="outline"
              size="sm"
            >
              View Pricing
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Quota warning - show progress bar
  return (
    <Alert variant={variant} className="mb-6">
      <Icon className="h-4 w-4" />
      <AlertTitle>Assessment Quota</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">
          {message || `You've used ${used} of ${total} free assessments. ${total - used} remaining.`}
        </p>
        <div className="space-y-2">
          <Progress value={percentage} className="h-2">
            <div
              className={cn('h-full transition-all', getProgressColor())}
              style={{ width: `${percentage}%` }}
            />
          </Progress>
          <p className="text-xs text-muted-foreground">
            {used} / {total} assessments used
          </p>
        </div>
        {used === total - 1 && (
          <Button
            onClick={() => navigate('/pricing')}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Upgrade for More Assessments
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
