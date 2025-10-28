/**
 * Custom hook for fetching strategic roadmap data for RFP auto-population
 */
import { useQuery } from '@tanstack/react-query';
import { rfpApi } from '@/lib/api';

export function useStrategicRoadmap(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['strategic-roadmap', organizationId],
    queryFn: () => rfpApi.getStrategicRoadmap(organizationId!),
    enabled: !!organizationId,
    staleTime: 60000, // 1 minute
  });
}
