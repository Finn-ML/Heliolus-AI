import { Lightbulb, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EvidenceTierBadge } from './EvidenceTierBadge';
import { AIConfidenceBadge } from './AIConfidenceBadge';
import { DocumentSourceLink } from './DocumentSourceLink';
import type { EvidenceIndicatorProps } from '../types/questionnaire.types';

/**
 * EvidenceIndicator
 * Displays evidence information for pre-filled answers
 * Shows source document, evidence tier, AI confidence, and explanation
 */
export const EvidenceIndicator: React.FC<EvidenceIndicatorProps> = ({
  tier,
  sourceDocumentId,
  aiConfidence,
  aiExplanation,
  onViewDocument,
  onViewExplanation,
}) => {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Lightbulb className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="font-medium text-blue-900">💡 Pre-filled from uploaded documents</p>
            <EvidenceTierBadge tier={tier} />
          </div>

          {/* Document source */}
          {sourceDocumentId && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Source:</span>
              <DocumentSourceLink
                documentId={sourceDocumentId}
                documentName={`Document_${sourceDocumentId.slice(0, 8)}.pdf`}
                onClick={onViewDocument}
              />
            </div>
          )}

          {/* AI Confidence */}
          {aiConfidence && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">AI Confidence:</span>
              <AIConfidenceBadge confidence={aiConfidence} />
            </div>
          )}

          {/* AI Explanation */}
          {aiExplanation && onViewExplanation && (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={onViewExplanation}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Eye className="h-4 w-4 mr-2" />
                View AI Explanation
              </Button>
            </div>
          )}

          {/* Helper text */}
          <p className="text-xs text-gray-400">
            This answer was automatically generated from your uploaded documents. You can edit it if
            needed.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};
