import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { JourneyNavigationProps } from './types/shared.types';

/**
 * JourneyNavigation
 * Provides consistent Back/Continue button layout with state management
 */
export const JourneyNavigation: React.FC<JourneyNavigationProps> = ({
  onBack,
  onContinue,
  canContinue = true,
  continueLabel = 'Continue',
  backLabel = 'Back',
  isLoading = false,
  showSaveDraft = false,
  onSaveDraft,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between pt-8 mt-8 border-t border-gray-200',
        className
      )}
    >
      {/* Left: Back button or spacer */}
      <div className="flex gap-3">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isLoading} className="min-w-[120px]">
            ← {backLabel}
          </Button>
        )}
        {showSaveDraft && onSaveDraft && (
          <Button variant="outline" onClick={onSaveDraft} disabled={isLoading}>
            Save Draft
          </Button>
        )}
      </div>

      {/* Right: Continue button */}
      <Button
        onClick={onContinue}
        disabled={!canContinue || isLoading}
        className="min-w-[180px] bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>{continueLabel} →</>
        )}
      </Button>
    </div>
  );
};
