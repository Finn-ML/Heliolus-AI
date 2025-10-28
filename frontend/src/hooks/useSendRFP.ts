import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rfpApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SendRFPResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  failures: Array<{
    vendorId: string;
    vendorName: string;
    error: string;
  }>;
}

export function useSendRFP() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<SendRFPResult, Error, string>({
    mutationFn: (rfpId: string) => rfpApi.sendRFP(rfpId),
    onSuccess: (result, rfpId) => {
      // Invalidate RFP queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['rfps'] });
      queryClient.invalidateQueries({ queryKey: ['rfp', rfpId] });

      // Show appropriate success message based on results
      if (result.sentCount > 0 && result.failedCount === 0) {
        toast({
          title: 'RFP sent successfully',
          description: `Sent to ${result.sentCount} vendor${result.sentCount > 1 ? 's' : ''}`,
        });
      } else if (result.sentCount > 0 && result.failedCount > 0) {
        toast({
          title: 'RFP partially sent',
          description: `Sent to ${result.sentCount} vendor${result.sentCount > 1 ? 's' : ''}, failed for ${result.failedCount}`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Failed to send RFP',
          description: 'Could not send to any vendors. Please try again.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      let title = 'Failed to send RFP';
      let description = 'An error occurred while sending the RFP';

      if (error.status === 403) {
        title = 'Premium subscription required';
        description = 'Sending RFPs requires a Premium subscription. Please upgrade your plan.';
      } else if (error.status === 404) {
        title = 'RFP not found';
        description = 'The RFP you are trying to send could not be found.';
      } else if (error.status === 400) {
        title = 'Invalid RFP';
        description = error.message || 'The RFP cannot be sent in its current state.';
      } else if (error.message) {
        description = error.message;
      }

      toast({
        title,
        description,
        variant: 'destructive',
      });
    },
  });
}
