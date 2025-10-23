import { ReactNode } from 'react';
import { LucideIcon, AlertCircle, CheckCircle, Loader2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type CardState = 'incomplete' | 'active' | 'processing' | 'complete' | 'pending';

interface JourneyCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  state: CardState;
  isExpandable?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  children?: ReactNode;
  processingProgress?: number;
  className?: string;
}

const stateConfig = {
  incomplete: {
    icon: AlertCircle,
    borderColor: 'border-orange-500',
    bgColor: 'bg-white dark:bg-gray-900',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/20',
  },
  active: {
    icon: null, // Uses card icon
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/20',
  },
  processing: {
    icon: Loader2,
    borderColor: 'border-cyan-500',
    bgColor: 'bg-gray-900/50 dark:bg-gray-900/30',
    iconColor: 'text-cyan-500',
    iconBg: 'bg-cyan-500/20',
  },
  complete: {
    icon: CheckCircle,
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-50/50 dark:bg-green-950/10',
    iconColor: 'text-green-500',
    iconBg: 'bg-green-500/20',
  },
  pending: {
    icon: Clock,
    borderColor: 'border-gray-700',
    bgColor: 'bg-gray-800/50',
    iconColor: 'text-gray-500',
    iconBg: 'bg-gray-500/20',
  },
};

export function JourneyCard({
  title,
  description,
  icon: CardIcon,
  state,
  isExpandable = false,
  isExpanded = false,
  onToggle,
  children,
  processingProgress,
  className,
}: JourneyCardProps) {
  const config = stateConfig[state];
  const StateIcon = config.icon || CardIcon;
  const isClickable = isExpandable && state !== 'pending';
  const showProgress = state === 'processing' && processingProgress !== undefined;

  return (
    <Card
      className={cn(
        'transition-all duration-300 backdrop-blur-sm',
        config.borderColor,
        config.bgColor,
        isClickable && 'cursor-pointer hover:shadow-lg',
        state === 'pending' && 'opacity-60',
        className
      )}
    >
      <CardHeader
        className={cn('p-6', isClickable && 'cursor-pointer')}
        onClick={isClickable ? onToggle : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className={cn('p-3 rounded-lg', config.iconBg)}>
              <StateIcon
                className={cn(
                  'h-6 w-6',
                  config.iconColor,
                  state === 'processing' && 'animate-spin'
                )}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-gray-400">{description}</p>
              {showProgress && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Processing...</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-500"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          {isExpandable && state !== 'pending' && (
            <div className={cn('transition-transform duration-200', isExpanded && 'rotate-90')}>
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}
        </div>
      </CardHeader>
      {isExpanded && children && (
        <CardContent className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-300">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
