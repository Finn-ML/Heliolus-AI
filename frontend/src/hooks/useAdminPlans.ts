import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminPlanApi, Plan, CreatePlanData, UpdatePlanData } from '@/lib/api';
import { toast } from 'sonner';

// Query keys for cache management
export const adminPlanKeys = {
  all: ['adminPlans'] as const,
  lists: () => [...adminPlanKeys.all, 'list'] as const,
  list: (filters?: any) => [...adminPlanKeys.lists(), { filters }] as const,
  details: () => [...adminPlanKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminPlanKeys.details(), id] as const,
};

// ==================== QUERY HOOKS ====================

/**
 * Fetch all plans for admin management
 */
export function usePlans(params?: {
  activeOnly?: boolean;
  publicOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminPlanKeys.list(params),
    queryFn: async () => {
      const response = await adminPlanApi.listPlans(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch single plan by ID
 */
export function usePlan(id: string) {
  return useQuery({
    queryKey: adminPlanKeys.detail(id),
    queryFn: async () => {
      const response = await adminPlanApi.getPlan(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Create a new plan
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanData) => adminPlanApi.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlanKeys.lists() });
      toast.success('Plan created successfully');
    },
    onError: (error: any) => {
      const message = error.code === 'SLUG_EXISTS'
        ? 'Plan slug already exists. Please choose a different slug.'
        : `Failed to create plan: ${error.message || 'Unknown error'}`;
      toast.error(message);
    },
  });
}

/**
 * Update an existing plan
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanData }) =>
      adminPlanApi.updatePlan(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adminPlanKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminPlanKeys.detail(response.data.id) });
      toast.success('Plan updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update plan: ${error.message || 'Unknown error'}`);
    },
  });
}

/**
 * Delete (deactivate) a plan
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminPlanApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminPlanKeys.lists() });
      toast.success('Plan deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete plan: ${error.message || 'Unknown error'}`);
    },
  });
}
