import { AlertCircle, RefreshCw, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ErrorStateProps } from './types/shared.types';

/**
 * ErrorState
 * Consistent error display with retry functionality
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  submessage,
  onRetry,
  retryLabel = 'Try Again',
  showSupport = true,
  supportEmail = 'support@heliolus.com',
  className,
}) => {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 px-4', className)}
      role="alert"
      aria-live="assertive"
    >
      {/* Error icon */}
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" aria-hidden="true" />
      </div>

      {/* Error message */}
      <h3 className="text-xl font-semibold text-white mb-2 text-center">{message}</h3>

      {submessage && <p className="text-gray-300 text-center max-w-md mb-6">{submessage}</p>}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default" aria-label={`${retryLabel} - Retry loading`}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryLabel}
          </Button>
        )}

        {showSupport && (
          <Button variant="outline" asChild>
            <a href={`mailto:${supportEmail}`}>
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};
