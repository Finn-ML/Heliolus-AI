import { Card } from '@/components/ui/card';
import { EvidenceTierBadge } from '../questionnaire/evidence/EvidenceTierBadge';
import type { EvidenceQualityPanelProps } from './types/results.types';

export const EvidenceQualityPanel: React.FC<EvidenceQualityPanelProps> = ({ distribution }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Evidence Quality</h3>

      {/* Legend */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EvidenceTierBadge tier="TIER_2" />
            <span className="text-sm text-gray-400">Pre-filled from documents</span>
          </div>
          <span className="text-sm font-medium text-white">
            {distribution.tier2Count} ({distribution.tier2Percentage}%)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EvidenceTierBadge tier="TIER_1" />
            <span className="text-sm text-gray-400">Claimed with evidence</span>
          </div>
          <span className="text-sm font-medium text-white">
            {distribution.tier1Count} ({distribution.tier1Percentage}%)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EvidenceTierBadge tier="TIER_0" />
            <span className="text-sm text-gray-400">Self-declared</span>
          </div>
          <span className="text-sm font-medium text-white">
            {distribution.tier0Count} ({distribution.tier0Percentage}%)
          </span>
        </div>
      </div>
    </Card>
  );
};
