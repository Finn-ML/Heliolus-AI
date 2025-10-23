import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { TemplateCategoryFilterProps } from './types/template-selection.types';
import { CATEGORY_LABELS } from './types/template-selection.types';

/**
 * TemplateCategoryFilter
 * Category filter buttons for template selection
 */
export const TemplateCategoryFilter: React.FC<TemplateCategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  categories,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map(category => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(category)}
          className={cn(
            'transition-all',
            selectedCategory === category
              ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500'
              : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-600'
          )}
        >
          {CATEGORY_LABELS[category] || category}
        </Button>
      ))}
    </div>
  );
};
