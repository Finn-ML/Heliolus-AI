import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCouponApi, Coupon, CreateCouponData, UpdateCouponData, ValidateCouponData } from '@/lib/api';
import { toast } from 'sonner';

// Query keys for cache management
export const adminCouponKeys = {
  all: ['adminCoupons'] as const,
  lists: () => [...adminCouponKeys.all, 'list'] as const,
  list: (filters?: any) => [...adminCouponKeys.lists(), { filters }] as const,
  details: () => [...adminCouponKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminCouponKeys.details(), id] as const,
};

// ==================== QUERY HOOKS ====================

/**
 * Fetch all coupons for admin management
 */
export function useCoupons(params?: {
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminCouponKeys.list(params),
    queryFn: async () => {
      const response = await adminCouponApi.listCoupons(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch single coupon by ID
 */
export function useCoupon(id: string) {
  return useQuery({
    queryKey: adminCouponKeys.detail(id),
    queryFn: async () => {
      const response = await adminCouponApi.getCoupon(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Create a new coupon
 */
export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCouponData) => adminCouponApi.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.lists() });
      toast.success('Coupon created successfully');
    },
    onError: (error: any) => {
      const message = error.code === 'CODE_EXISTS'
        ? 'Coupon code already exists. Please choose a different code.'
        : `Failed to create coupon: ${error.message || 'Unknown error'}`;
      toast.error(message);
    },
  });
}

/**
 * Update an existing coupon
 */
export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCouponData }) =>
      adminCouponApi.updateCoupon(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.detail(response.data.id) });
      toast.success('Coupon updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update coupon: ${error.message || 'Unknown error'}`);
    },
  });
}

/**
 * Delete (deactivate) a coupon
 */
export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminCouponApi.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCouponKeys.lists() });
      toast.success('Coupon deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete coupon: ${error.message || 'Unknown error'}`);
    },
  });
}

/**
 * Validate a coupon code
 */
export function useValidateCoupon() {
  return useMutation({
    mutationFn: (data: ValidateCouponData) => adminCouponApi.validateCoupon(data),
    onError: (error: any) => {
      toast.error(`Failed to validate coupon: ${error.message || 'Unknown error'}`);
    },
  });
}
