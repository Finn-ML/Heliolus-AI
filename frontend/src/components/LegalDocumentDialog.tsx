import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { legalDocumentsApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LegalDocumentDialogProps {
  type: 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LegalDocumentDialog({ type, open, onOpenChange }: LegalDocumentDialogProps) {
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const title = type === 'PRIVACY_POLICY' ? 'Privacy Policy' : 'Terms of Service';

  // Fetch the active legal document
  const { data: documentResponse, isLoading } = useQuery({
    queryKey: ['legal-document', type],
    queryFn: () => legalDocumentsApi.getActive(type),
    enabled: open,
  });

  const document = documentResponse?.data;

  // Fetch download URL when document is available
  useEffect(() => {
    if (document?.id && open) {
      legalDocumentsApi.getDownloadUrl(document.id).then((response) => {
        if (response.success && response.data) {
          setPdfUrl(response.data);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load document',
            variant: 'destructive',
          });
        }
      });
    }
  }, [document?.id, open, toast]);

  // Clean up PDF URL when dialog closes
  useEffect(() => {
    if (!open) {
      setPdfUrl(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {document ? `Version ${document.version}` : 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 pb-6">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && !document && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground mb-4">
                No {title.toLowerCase()} available at this time.
              </p>
              <p className="text-sm text-muted-foreground">
                Please contact support for more information.
              </p>
            </div>
          )}

          {document && pdfUrl && (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full border rounded-md"
              title={title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface LegalDocumentLinkProps {
  type: 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE';
  className?: string;
  children?: React.ReactNode;
}

export function LegalDocumentLink({ type, className, children }: LegalDocumentLinkProps) {
  const [open, setOpen] = useState(false);

  const defaultText = type === 'PRIVACY_POLICY' ? 'Privacy Policy' : 'Terms of Service';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || 'text-primary hover:underline'}
      >
        {children || defaultText}
      </button>
      <LegalDocumentDialog type={type} open={open} onOpenChange={setOpen} />
    </>
  );
}
