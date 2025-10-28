import { useState } from 'react';
import { Send, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSendRFP } from '@/hooks/useSendRFP';

interface SendRFPButtonProps {
  rfpId: string;
  vendorCount: number;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onSuccess?: () => void;
}

interface SendResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  failures: Array<{
    vendorId: string;
    vendorName: string;
    error: string;
  }>;
}

export function SendRFPButton({ rfpId, vendorCount, size = 'sm', onSuccess }: SendRFPButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  const sendRfpMutation = useSendRFP();

  const handleSend = async () => {
    setConfirmOpen(false);

    try {
      const result = await sendRfpMutation.mutateAsync(rfpId);
      setSendResult(result);
      setResultsOpen(true);

      if (result.sentCount > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Send RFP error:', error);
    }
  };

  const getResultIcon = () => {
    if (!sendResult) return null;

    if (sendResult.sentCount > 0 && sendResult.failedCount === 0) {
      return <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />;
    } else if (sendResult.sentCount > 0 && sendResult.failedCount > 0) {
      return <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />;
    } else {
      return <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />;
    }
  };

  const getResultTitle = () => {
    if (!sendResult) return 'Sending...';

    if (sendResult.sentCount > 0 && sendResult.failedCount === 0) {
      return 'RFP Sent Successfully';
    } else if (sendResult.sentCount > 0 && sendResult.failedCount > 0) {
      return 'RFP Partially Sent';
    } else {
      return 'Failed to Send RFP';
    }
  };

  const getResultDescription = () => {
    if (!sendResult) return 'Please wait...';

    if (sendResult.sentCount > 0 && sendResult.failedCount === 0) {
      return `Your RFP has been successfully sent to ${sendResult.sentCount} vendor${sendResult.sentCount > 1 ? 's' : ''}. They will be notified via email and can respond directly.`;
    } else if (sendResult.sentCount > 0 && sendResult.failedCount > 0) {
      return `Your RFP was sent to ${sendResult.sentCount} vendor${sendResult.sentCount > 1 ? 's' : ''}, but failed for ${sendResult.failedCount}. See details below.`;
    } else {
      return 'We were unable to send your RFP to any vendors. Please check the details below and try again.';
    }
  };

  return (
    <>
      <Button
        onClick={() => setConfirmOpen(true)}
        disabled={sendRfpMutation.isPending || vendorCount === 0}
        size={size}
        variant="default"
      >
        {sendRfpMutation.isPending ? (
          <>
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-1 h-4 w-4" />
            Send
          </>
        )}
      </Button>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send RFP to Vendors?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send your RFP to <span className="font-semibold text-foreground">{vendorCount}</span> vendor
              {vendorCount > 1 ? 's' : ''}. They will be notified via email and can respond directly to you.
              <br />
              <br />
              Make sure you have reviewed all details before sending. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              <Send className="mr-2 h-4 w-4" />
              Send RFP
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Results Dialog */}
      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              {getResultIcon()}
              {getResultTitle()}
            </DialogTitle>
            <DialogDescription className="text-center">
              {getResultDescription()}
            </DialogDescription>
          </DialogHeader>

          {sendResult && (
            <div className="space-y-4">
              {/* Success Summary */}
              {sendResult.sentCount > 0 && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Successfully sent to {sendResult.sentCount} vendor{sendResult.sentCount > 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Vendors will receive an email notification with your RFP details and contact information.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Failure Details */}
              {sendResult.failedCount > 0 && sendResult.failures && sendResult.failures.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900 dark:text-red-100 mb-3">
                        Failed to send to {sendResult.failedCount} vendor{sendResult.failedCount > 1 ? 's' : ''}
                      </p>
                      <div className="space-y-2">
                        {sendResult.failures.map((failure, index) => (
                          <div
                            key={failure.vendorId || index}
                            className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded p-3"
                          >
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {failure.vendorName}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {failure.error}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-3">
                        You can try sending again later or contact support if the issue persists.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {sendResult.sentCount > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    What happens next?
                  </p>
                  <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    <li>• Vendors will review your RFP and respond via email</li>
                    <li>• You can track responses in the RFP Tracking page</li>
                    <li>• Check your email for vendor replies and follow-ups</li>
                    <li>• You can close or archive the RFP once you've selected a vendor</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setResultsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
