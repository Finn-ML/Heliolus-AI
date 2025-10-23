import { Check, Loader2, Cloud } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AutoSaveIndicatorProps } from '../types/questionnaire.types';

/**
 * AutoSaveIndicator
 * Shows last saved time and saving status
 */
export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  lastSaved,
  isSaving = false,
}) => {
  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Check className="h-4 w-4 text-green-500" />
        <span>Last saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Cloud className="h-4 w-4" />
      <span>Not saved yet</span>
    </div>
  );
};
