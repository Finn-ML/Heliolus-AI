import { FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DocumentSourceLinkProps } from '../types/questionnaire.types';

/**
 * DocumentSourceLink
 * Clickable link to view source document
 */
export const DocumentSourceLink: React.FC<DocumentSourceLinkProps> = ({
  documentId,
  documentName,
  onClick,
}) => {
  return (
    <Button
      variant="link"
      size="sm"
      onClick={onClick}
      className="h-auto p-0 text-cyan-600 hover:text-cyan-700"
    >
      <FileText className="h-4 w-4 mr-1.5" />
      <span>{documentName}</span>
      <ExternalLink className="h-3 w-3 ml-1" />
    </Button>
  );
};
