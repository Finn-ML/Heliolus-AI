import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export type ContactType = 'DEMO_REQUEST' | 'INFO_REQUEST' | 'RFP' | 'PRICING' | 'GENERAL';

interface ContactVendorData {
  vendorId: string;
  type: ContactType;
  message: string;
  requirements?: Record<string, any>;
  budget?: string;
  timeline?: string;
}

interface ContactResponse {
  id: string;
  vendorId: string;
  type: string;
  message: string;
  status: string;
  createdAt: string;
}

export function useContactVendor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ContactResponse, Error, ContactVendorData>({
    mutationFn: async ({ vendorId, ...data }) => {
      return await vendorApi.contactVendor(vendorId, data);
    },
    onSuccess: (response) => {
      // Invalidate any vendor-related queries
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });

      toast({
        title: 'Contact request sent',
        description: 'The vendor will receive your message and respond via email.',
      });
    },
    onError: (error: any) => {
      let title = 'Failed to send contact request';
      let description = 'An error occurred while contacting the vendor';

      if (error.status === 402) {
        title = 'Premium subscription required';
        description = 'Contacting vendors requires a Premium subscription. Please upgrade your plan.';
      } else if (error.status === 404) {
        title = 'Vendor not found';
        description = 'The vendor you are trying to contact could not be found.';
      } else if (error.status === 400) {
        title = 'Invalid request';
        description = error.message || 'Please check your message and try again.';
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
