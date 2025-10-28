// Epic 13 - Story 13.3: Feature Coverage List Component
import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FeatureCoverageListProps {
  missingFeatures: string[];
  mustHaveFeatures?: string[];
  className?: string;
}

export const FeatureCoverageList: React.FC<FeatureCoverageListProps> = ({
  missingFeatures,
  mustHaveFeatures = [],
  className = ''
}) => {
  // Calculate coverage
  const totalFeatures = mustHaveFeatures.length || 10; // Default to 10 if not provided
  const matchedCount = totalFeatures - missingFeatures.length;
  const coveragePercent = (matchedCount / totalFeatures) * 100;

  return (
    <div className={className}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-400">Feature Coverage</h4>
          <span className="text-sm text-gray-300">
            {matchedCount}/{totalFeatures} features
          </span>
        </div>
        <Progress
          value={coveragePercent}
          className={`h-2 ${
            coveragePercent >= 80
              ? 'bg-green-900/30 [&>div]:bg-green-500'
              : coveragePercent >= 60
              ? 'bg-yellow-900/30 [&>div]:bg-yellow-500'
              : 'bg-red-900/30 [&>div]:bg-red-500'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">{coveragePercent.toFixed(0)}% coverage</p>
      </div>

      {missingFeatures.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-400">Missing Features:</p>
          <ul className="space-y-1">
            {missingFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingFeatures.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-green-400 text-sm font-medium">All features available</span>
        </div>
      )}
    </div>
  );
};
