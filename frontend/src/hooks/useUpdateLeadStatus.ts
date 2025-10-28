import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminLeadsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LeadStatus } from './useLeads';

interface UpdateLeadStatusData {
  leadId: string;
  leadType: 'PREMIUM' | 'BASIC';
  status: LeadStatus;
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ leadId, leadType, status }: UpdateLeadStatusData) => {
      return adminLeadsApi.updateLeadStatus(leadId, leadType, status);
    },
    onSuccess: (data, variables) => {
      // Invalidate leads queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'leads', 'analytics'] });

      toast({
        title: 'Lead status updated',
        description: `Status changed to ${variables.status}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update lead status',
        description: error.message || 'An error occurred while updating the lead',
        variant: 'destructive',
      });
    },
  });
}
