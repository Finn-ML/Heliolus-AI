import { SectionProgress } from './SectionProgress';
import type { SectionHeaderProps } from '../types/questionnaire.types';

/**
 * SectionHeader
 * Section title, description, weight, and progress
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  weight,
  progress,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400">{description}</p>
        <p className="text-sm text-gray-500 mt-1">Section Weight: {weight}% of overall score</p>
      </div>

      <SectionProgress current={progress.current} total={progress.total} showPercentage={true} />
    </div>
  );
};
