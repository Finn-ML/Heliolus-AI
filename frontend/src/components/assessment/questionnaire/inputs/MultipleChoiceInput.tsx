import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { MultipleChoiceInputProps, QuestionOption } from '../types/questionnaire.types';

/**
 * MultipleChoiceInput
 * Radio buttons (single choice) or checkboxes (multiple choice)
 * Displays points for each option
 */
export const MultipleChoiceInput: React.FC<MultipleChoiceInputProps> = ({
  value,
  onChange,
  options,
  multiple = false,
}) => {
  // Handle single choice (radio)
  const handleSingleChange = (selectedValue: string) => {
    onChange(selectedValue);
  };

  // Handle multiple choice (checkbox)
  const handleMultipleChange = (optionId: string, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : [];
    if (checked) {
      onChange([...currentValues, optionId]);
    } else {
      onChange(currentValues.filter(v => v !== optionId));
    }
  };

  const isSelected = (optionId: string): boolean => {
    if (Array.isArray(value)) {
      return value.includes(optionId);
    }
    return value === optionId;
  };

  if (multiple) {
    // Multiple selection with checkboxes
    return (
      <div className="space-y-3" role="group" aria-label="Multiple choice options">
        {options.map(option => {
          const selected = isSelected(option.id);
          return (
            <div
              key={option.id}
              className={cn(
                'flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer',
                selected
                  ? 'border-cyan-500 bg-cyan-900/20'
                  : 'border-gray-700 hover:border-gray-600'
              )}
              onClick={() => handleMultipleChange(option.id, !selected)}
            >
              <Checkbox
                id={option.id}
                checked={selected}
                onCheckedChange={checked => handleMultipleChange(option.id, checked === true)}
                onClick={e => e.stopPropagation()}
              />
              <div className="flex-1">
                <Label
                  htmlFor={option.id}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <span className="text-base">{option.text}</span>
                  <span className="text-sm text-gray-400 ml-3">
                    {option.points} {option.points === 1 ? 'point' : 'points'}
                  </span>
                </Label>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Single selection with radio buttons
  return (
    <RadioGroup
      value={typeof value === 'string' ? value : ''}
      onValueChange={handleSingleChange}
      className="space-y-3"
    >
      {options.map(option => {
        const selected = isSelected(option.id);
        return (
          <div
            key={option.id}
            className={cn(
              'flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer',
              selected ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-700 hover:border-gray-600'
            )}
            onClick={() => handleSingleChange(option.id)}
          >
            <RadioGroupItem value={option.id} id={option.id} />
            <div className="flex-1">
              <Label
                htmlFor={option.id}
                className="cursor-pointer flex items-center justify-between"
              >
                <span className="text-base">{option.text}</span>
                <span className="text-sm text-gray-400 ml-3">
                  {option.points} {option.points === 1 ? 'point' : 'points'}
                </span>
              </Label>
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
};
