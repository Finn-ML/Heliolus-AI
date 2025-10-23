import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { EvidenceTier, EvidenceTierExplanationProps } from '@/types/evidence-tier.types';

const tierIcons = {
  TIER_0: AlertTriangle,
  TIER_1: Info,
  TIER_2: CheckCircle,
};

const tierIconColors = {
  TIER_0: 'text-gray-500',
  TIER_1: 'text-blue-500',
  TIER_2: 'text-green-500',
};

const whyItMatters = {
  TIER_0:
    'Self-declared evidence has a 40% penalty on scoring. Consider uploading official policy documents or system-generated reports for better assessment accuracy.',
  TIER_1:
    'Policy documents have a 20% penalty compared to system-generated evidence. Upload compliance reports or audit logs for full scoring.',
  TIER_2:
    'System-generated evidence receives full scoring with no penalty. This is the highest quality evidence type.',
};

export function EvidenceTierExplanation({
  documentId,
  tier,
  reason,
  confidence,
}: EvidenceTierExplanationProps) {
  const navigate = useNavigate();
  const Icon = tierIcons[tier];
  const iconColor = tierIconColors[tier];
  const reasonBullets = reason.split('\n').filter(Boolean);

  const handleUploadClick = () => {
    // Navigate to document upload page with document context
    navigate('/documents/upload', { state: { documentId } });
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="explanation" className="border rounded-lg">
        <AccordionTrigger className="text-sm font-medium px-4 hover:no-underline">
          <div className="flex items-center gap-2">
            <Icon className={cn('w-4 h-4', iconColor)} />
            <span>View Classification Details</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4 text-sm">
            {/* Classification Reasoning */}
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                Classification Reasoning:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                {reasonBullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            </div>

            {/* Confidence Score */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Confidence:</span>
              <span className="text-gray-600 dark:text-gray-400">
                {Math.round(confidence * 100)}%
              </span>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all',
                      tier === 'TIER_0' && 'bg-gray-500',
                      tier === 'TIER_1' && 'bg-blue-500',
                      tier === 'TIER_2' && 'bg-green-500'
                    )}
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Why this matters */}
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
              <h4 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">
                Why this matters:
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{whyItMatters[tier]}</p>
              {tier !== 'TIER_2' && (
                <button
                  className="mt-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline text-xs font-medium transition-colors"
                  onClick={handleUploadClick}
                >
                  Upload better evidence →
                </button>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default EvidenceTierExplanation;
