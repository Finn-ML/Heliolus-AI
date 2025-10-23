import { Textarea } from '@/components/ui/textarea';
import type { TextAreaInputProps } from '../types/questionnaire.types';

/**
 * TextAreaInput
 * Multi-line text input for long-form answers
 */
export const TextAreaInput: React.FC<TextAreaInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter your answer here...',
  rows = 4,
}) => {
  return (
    <Textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none"
    />
  );
};
