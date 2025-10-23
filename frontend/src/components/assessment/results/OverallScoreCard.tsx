import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScoreCircle } from './score/ScoreCircle';
import { RiskLevelBadge } from './score/RiskLevelBadge';
import { ScoreProgressBar } from './score/ScoreProgressBar';
import { ConfidenceBadge } from './score/ConfidenceBadge';
import { getRiskLevelConfig, type OverallScoreCardProps } from './types/results.types';

/**
 * OverallScoreCard
 * Large score display with risk level, progress bar, and confidence indicator
 */
export const OverallScoreCard: React.FC<OverallScoreCardProps> = ({
  score,
  confidenceLevel,
  totalAnswers,
}) => {
  const riskConfig = getRiskLevelConfig(score);

  const IconComponent =
    riskConfig.color === 'red'
      ? AlertTriangle  // CRITICAL
      : riskConfig.color === 'orange'
        ? AlertTriangle  // HIGH
        : riskConfig.color === 'yellow'
          ? AlertCircle  // MEDIUM
          : CheckCircle; // LOW

  return (
    <Card className="p-8 text-center bg-gradient-to-br from-white to-gray-50">
      <h3 className="text-lg font-medium text-gray-700 mb-6">Risk Score</h3>

      {/* Animated score circle */}
      <div className="flex justify-center mb-6">
        <ScoreCircle score={score} color={riskConfig.color} size="lg" />
      </div>

      {/* Risk level badge */}
      <div className="flex justify-center mb-6">
        <RiskLevelBadge
          level={riskConfig.label as any}
          color={riskConfig.color}
          Icon={IconComponent}
        />
      </div>

      {/* Progress bar */}
      <div className="max-w-md mx-auto mb-6">
        <ScoreProgressBar score={score} color={riskConfig.color} />
        <p className="mt-2 text-sm text-gray-400 flex items-center justify-center gap-2">
          <span>{riskConfig.emoji}</span>
          <span>{riskConfig.message}</span>
        </p>
      </div>

      {/* Confidence */}
      <div className="pt-6 border-t border-gray-700">
        <div className="flex justify-center items-center gap-2 mb-2">
          <span className="text-sm text-gray-400">Confidence:</span>
          <ConfidenceBadge level={confidenceLevel} />
        </div>
        <p className="text-xs text-gray-500">
          Based on evidence tier distribution from {totalAnswers} answers
        </p>
      </div>
    </Card>
  );
};
