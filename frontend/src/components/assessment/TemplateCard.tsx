import { motion } from 'framer-motion';
import { BarChart3, Clock, Tag, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TemplateCardProps } from './types/template-selection.types';
import { CATEGORY_COLORS } from './types/template-selection.types';

/**
 * TemplateCard
 * Individual template card with selection radio button
 */
export const TemplateCard: React.FC<TemplateCardProps> = ({ template, isSelected, onSelect }) => {
  const color = CATEGORY_COLORS[template.category] || 'gray';

  // Format category for display
  const categoryDisplay = template.category.replace(/_/g, ' ');

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative p-6 rounded-lg border-2 cursor-pointer transition-all',
        isSelected
          ? 'border-cyan-500 bg-cyan-900/20 shadow-md shadow-cyan-500/20'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:shadow-sm'
      )}
      onClick={onSelect}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Selection indicator */}
      <div className="absolute top-4 right-4">
        {isSelected ? (
          <CheckCircle2 className="w-6 h-6 text-cyan-500" />
        ) : (
          <Circle className="w-6 h-6 text-gray-300" />
        )}
      </div>

      {/* Template icon */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl">{template.icon || '📋'}</div>
        <h3 className="text-lg font-semibold text-white pr-8">{template.name}</h3>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 mb-4 line-clamp-3">{template.description}</p>

      {/* Metadata */}
      <div className="flex flex-col gap-2 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          <span>{template.questionCount} questions</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>~{template.estimatedMinutes} minutes</span>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              color === 'cyan' && 'bg-cyan-500/20 text-cyan-400',
              color === 'pink' && 'bg-pink-500/20 text-pink-400',
              color === 'green' && 'bg-green-500/20 text-green-400',
              color === 'gray' && 'bg-gray-500/20 text-gray-400'
            )}
          >
            {categoryDisplay}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
