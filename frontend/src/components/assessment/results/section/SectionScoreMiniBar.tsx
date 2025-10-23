import { Progress } from '@/components/ui/progress';
import type { SectionScoreMiniBarProps } from '../types/results.types';

export const SectionScoreMiniBar: React.FC<SectionScoreMiniBarProps> = ({ score }) => {
  return <Progress value={score} className="h-2" />;
};
