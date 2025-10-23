import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RatingInputProps } from '../types/questionnaire.types';

/**
 * RatingInput
 * 1-5 star rating input with optional labels
 */
export const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onChange,
  min = 1,
  max = 5,
  labels,
}) => {
  const ratings = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-4">
      {/* Star buttons */}
      <div className="flex items-center gap-2">
        {ratings.map(rating => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(rating);
              }
            }}
            className={cn(
              'p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500',
              rating <= value
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-gray-400'
            )}
            aria-label={`Rate ${rating} out of ${max}`}
          >
            <Star className={cn('h-8 w-8', rating <= value && 'fill-current')} />
          </button>
        ))}
      </div>

      {/* Optional labels */}
      {labels && labels.length === ratings.length && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          {labels.map((label, index) => (
            <span key={index} className="text-center">
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Current selection */}
      {value > 0 && (
        <p className="text-sm text-gray-400">
          Selected: {value} out of {max}
        </p>
      )}
    </div>
  );
};
