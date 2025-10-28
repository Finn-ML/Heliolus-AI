/**
 * Custom hook for fetching user's RFPs with filters
 */
import { useQuery } from '@tanstack/react-query';
import { rfpApi } from '@/lib/api';

export interface RFPFilters {
  status?: string;
  leadStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useRFPs(filters?: RFPFilters) {
  return useQuery({
    queryKey: ['rfps', filters],
    queryFn: () => rfpApi.getRFPs(filters),
    staleTime: 30000, // 30 seconds
  });
}
