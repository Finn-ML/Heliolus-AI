import { useQuery } from '@tanstack/react-query';
import { adminLeadsApi } from '@/lib/api';

export type LeadType = 'ALL' | 'PREMIUM' | 'BASIC';
export type LeadStatus = 'NEW' | 'IN_PROGRESS' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

export interface LeadFilters {
  type?: LeadType;
  status?: LeadStatus[];
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface Lead {
  id: string;
  type: 'PREMIUM' | 'BASIC';
  status: string;
  companyName: string;
  userName: string;
  userEmail: string;
  submissionDate: string;
  vendors: Array<{ id: string; name: string }>;
  message?: string | null;
  phone?: string | null;
  rfpTitle?: string | null;
  objectives?: string | null;
  requirements?: string | null;
  budget?: string | null;
  timeline?: string | null;
  documents?: string[];
}

export interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useLeads(filters?: LeadFilters) {
  return useQuery<LeadsResponse>({
    queryKey: ['admin', 'leads', filters],
    queryFn: () => adminLeadsApi.getLeads(filters),
    staleTime: 30000, // 30 seconds
  });
}

export function useLead(leadId: string, leadType: 'PREMIUM' | 'BASIC', enabled = true) {
  return useQuery({
    queryKey: ['admin', 'lead', leadId, leadType],
    queryFn: () => adminLeadsApi.getLead(leadId, leadType),
    enabled: enabled && !!leadId && !!leadType,
    staleTime: 30000,
  });
}

export function useLeadAnalytics() {
  return useQuery({
    queryKey: ['admin', 'leads', 'analytics'],
    queryFn: adminLeadsApi.getLeadAnalytics,
    staleTime: 60000, // 1 minute
  });
}
