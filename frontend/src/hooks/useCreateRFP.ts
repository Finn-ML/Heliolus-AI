/**
 * Custom hook for creating RFPs
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rfpApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface CreateRFPData {
  organizationId: string;
  title: string;
  objectives?: string;
  requirements?: string;
  timeline?: string;
  budget?: string;
  vendorIds: string[];
  documents?: string[];
}

export function useCreateRFP() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateRFPData) => rfpApi.createRFP(data),
    onSuccess: (newRfp) => {
      queryClient.invalidateQueries({ queryKey: ['rfps'] });
      toast({
        title: 'RFP created successfully',
        description: `"${newRfp.title}" has been created as a draft.`,
      });
    },
    onError: (error: any) => {
      if (error.status === 403) {
        toast({
          title: 'Premium subscription required',
          description: 'This feature requires a Premium subscription. Upgrade to create RFPs.',
          variant: 'destructive',
        });
      } else if (error.status === 400) {
        toast({
          title: 'Validation error',
          description: error.message || 'Please check your inputs and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to create RFP',
          description: 'An error occurred. Please try again.',
          variant: 'destructive',
        });
      }
    },
  });
}
