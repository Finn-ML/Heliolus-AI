import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminTemplateApi, CreateTemplateData, CreateSectionData, CreateQuestionData } from '@/lib/api';
import { AssessmentTemplate } from '@/types/assessment';
import { toast } from 'sonner';

// Query keys for cache management
export const adminTemplateKeys = {
  all: ['adminTemplates'] as const,
  lists: () => [...adminTemplateKeys.all, 'list'] as const,
  list: (filters?: string) => [...adminTemplateKeys.lists(), { filters }] as const,
  details: () => [...adminTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminTemplateKeys.details(), id] as const,
  stats: () => [...adminTemplateKeys.all, 'stats'] as const,
};

// ==================== QUERY HOOKS ====================

/**
 * Fetch all templates for admin management
 */
export function useTemplates() {
  return useQuery({
    queryKey: adminTemplateKeys.lists(),
    queryFn: async () => {
      const response = await adminTemplateApi.getTemplateStats(); // Will need to be replaced with proper getTemplates call
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch single template with sections and questions
 */
export function useTemplate(id: string) {
  return useQuery({
    queryKey: adminTemplateKeys.detail(id),
    queryFn: async () => {
      // Will need proper endpoint - using placeholder
      const response = await adminTemplateApi.getTemplateStats();
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch template statistics
 */
export function useTemplateStats() {
  return useQuery({
    queryKey: adminTemplateKeys.stats(),
    queryFn: async () => {
      const response = await adminTemplateApi.getTemplateStats();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== MUTATION HOOKS ====================

/**
 * Create a new template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTemplateData) => adminTemplateApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTemplateKeys.lists() });
      toast.success('Template created successfully');
    },
    onError: (error: any) => {
      const message = error.code === 'SLUG_EXISTS'
        ? 'Template slug already exists. Please choose a different slug.'
        : `Failed to create template: ${error.message || 'Unknown error'}`;
      toast.error(message);
    },
  });
}

/**
 * Update an existing template with optimistic updates
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTemplateData> }) =>
      adminTemplateApi.updateTemplate(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminTemplateKeys.lists() });

      // Snapshot previous value
      const previousTemplates = queryClient.getQueryData(adminTemplateKeys.lists());

      // Optimistically update to the new value
      queryClient.setQueryData(adminTemplateKeys.lists(), (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((t: any) => (t.id === id ? { ...t, ...data } : t));
        }
        return old;
      });

      // Return context for rollback
      return { previousTemplates };
    },
    onError: (err: any, variables, context) => {
      // Rollback on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(adminTemplateKeys.lists(), context.previousTemplates);
      }
      toast.error(`Failed to update template: ${err.message || 'Unknown error'}`);
    },
    onSuccess: () => {
      // Invalidate to refetch from server
      queryClient.invalidateQueries({ queryKey: adminTemplateKeys.lists() });
      toast.success('Template updated successfully');
    },
  });
}

/**
 * Delete a template with optimistic updates
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminTemplateApi.deleteTemplate(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminTemplateKeys.lists() });

      // Snapshot previous value
      const previousTemplates = queryClient.getQueryData(adminTemplateKeys.lists());

      // Optimistically remove from list
      queryClient.setQueryData(adminTemplateKeys.lists(), (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.filter((t: any) => t.id !== id);
        }
        return old;
      });

      // Return context for rollback
      return { previousTemplates };
    },
    onError: (err: any, variables, context) => {
      // Rollback on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(adminTemplateKeys.lists(), context.previousTemplates);
      }

      const message = err.code === 'TEMPLATE_IN_USE'
        ? `Cannot delete template: ${err.metadata?.assessmentCount || 'some'} assessments are using it`
        : `Failed to delete template: ${err.message || 'Unknown error'}`;
      toast.error(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTemplateKeys.lists() });
      toast.success('Template deleted successfully');
    },
  });
}

/**
 * Create a new section in a template
 */
export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: CreateSectionData }) =>
      adminTemplateApi.createSection(templateId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminTemplateKeys.detail(variables.templateId) });
      toast.success('Section created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create section: ${error.message || 'Unknown error'}`);
    },
  });
}

/**
 * Update a section with optimistic updates
 */
export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSectionData> }) =>
      adminTemplateApi.updateSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTemplateKeys.all });
      toast.success('Section updated successfully');
    },
    onError: (error: any) => {
      const message = error.code === 'TEMPLATE_INACTIVE'
        ? 'Cannot modify inactive template'
        : `Failed to update section: ${error.message || 'Unknown error'}`;
      toast.error(message);
    },
  });
}

/**
 * Delete a section (cascades to questions)
 */
export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminTemplateApi.deleteSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTemplateKeys.all });
      toast.success('Section deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete section: ${error.message || 'Unknown error'}`);
    },
  });
}

/**
 * Create a new question in a section
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: CreateQuestionData }) =>
      adminTemplateApi.createQuestion(sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTemplateKeys.all });
      toast.success('Question created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create question: ${error.message || 'Unknown error'}`);
    },
  });
}

/**
 * Update a question with optimistic updates
 */
export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateQuestionData> }) =>
      adminTemplateApi.updateQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTemplateKeys.all });
      toast.success('Question updated successfully');
    },
    onError: (error: any) => {
      const message = error.code === 'TEMPLATE_INACTIVE'
        ? 'Cannot modify inactive template'
        : `Failed to update question: ${error.message || 'Unknown error'}`;
      toast.error(message);
    },
  });
}

/**
 * Delete a question
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminTemplateApi.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTemplateKeys.all });
      toast.success('Question deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete question: ${error.message || 'Unknown error'}`);
    },
  });
}

/**
 * Bulk create multiple questions in a section
 */
export function useBulkCreateQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, questions }: { sectionId: string; questions: CreateQuestionData[] }) =>
      adminTemplateApi.bulkCreateQuestions(sectionId, questions),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adminTemplateKeys.all });
      const count = Array.isArray(response.data) ? response.data.length : 0;
      toast.success(`${count} questions created successfully`);
    },
    onError: (error: any) => {
      toast.error(`Failed to create questions: ${error.message || 'Unknown error'}`);
    },
  });
}
