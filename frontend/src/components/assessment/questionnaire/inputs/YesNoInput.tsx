import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { YesNoInputProps } from '../types/questionnaire.types';

/**
 * YesNoInput
 * Simple yes/no toggle for binary questions
 */
export const YesNoInput: React.FC<YesNoInputProps> = ({ value, onChange }) => {
  const options = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];

  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
      {options.map(option => (
        <div
          key={option.value}
          className={cn(
            'flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer',
            value === option.value
              ? 'border-cyan-500 bg-cyan-900/20'
              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
          )}
          onClick={() => onChange(option.value)}
        >
          <RadioGroupItem value={option.value} id={option.value} />
          <Label
            htmlFor={option.value}
            className="flex-1 cursor-pointer text-base font-medium text-white"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};
