// API Client utilities for Heliolus platform
import { QueryClient } from '@tanstack/react-query';
import {
  AssessmentTemplate,
  Assessment,
  AssessmentResults,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
  TemplateFilters,
  FreemiumRestrictions,
  Gap,
  Severity,
  Priority,
} from '@/types/assessment';
import { StrategyMatrix, VendorMatchesResponse } from '@/types/vendor-matching.types';

// Get the correct API URL for Replit environment
const getApiBaseUrl = () => {
  // Use environment variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Use relative path to leverage Vite's proxy configuration
  // This avoids CORS issues by proxying through the frontend server
  return '';
};

const API_BASE_URL = getApiBaseUrl();

// Check if user is authenticated
const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

// Get current user ID from JWT token
export const getCurrentUserId = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    // Decode JWT to get user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || payload.sub || null;
  } catch (error) {
    console.error('[API] Failed to decode token:', error);
    return null;
  }
};

// Get the appropriate API path prefix based on auth state
const getApiPrefix = (forceAnonymous = false): string => {
  // If explicitly marked as anonymous or no token exists, use /anon prefix
  if (forceAnonymous || !isAuthenticated()) {
    return '/anon';
  }
  return '/v1';
};

// Enhanced fetch with authentication
async function apiRequest<T>(endpoint: string, options: RequestInit = {}, forceAnonymous = false): Promise<T> {
  const token = localStorage.getItem('token');

  // Only add Content-Type header when there's a body to send
  const headers: Record<string, string> = {};

  if (token && !forceAnonymous) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Spread custom headers from options
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  // Add Content-Type only for requests with bodies (but not FormData)
  if (options.body && !headers['Content-Type'] && !headers['content-type']) {
    // Don't set Content-Type for FormData - let the browser set it with proper boundary
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
  }

  // Include credentials to ensure cookies are sent (for anonymous sessions)
  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  // Build URL with appropriate prefix based on auth state
  const prefix = getApiPrefix(forceAnonymous);
  const url = `${API_BASE_URL}${prefix}${endpoint}`;
  console.log('[API] Request to:', url);
  console.log('[API] Auth:', token ? 'Authenticated' : 'Anonymous');
  console.log('[API] Method:', options.method || 'GET');

  try {
    const response = await fetch(url, config);
    console.log('[API] Response status:', response.status);

    if (!response.ok) {
      // Handle 401 Unauthorized - clear stale token and reload
      if (response.status === 401) {
        console.warn('[API] Authentication failed - clearing stale token');
        localStorage.removeItem('token');
        // Force page reload to redirect to login
        window.location.reload();
        return;
      }

      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));

      // Log 404s as info instead of errors (often expected for missing resources)
      if (response.status === 404) {
        console.log('[API] Resource not found (404):', url);
      } else {
        console.error('[API] Error response:', errorData);
      }

      // Add statusCode and code to the error for better handling
      const error: any = new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
      error.statusCode = response.status;
      error.code = errorData.code;
      throw error;
    }

    // Check if response has content before parsing JSON
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.log('[API] Success response: 204 No Content');
      return null; // Return null for empty responses
    }

    // Check if response has JSON content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('[API] Success response:', data);
      return data;
    } else {
      // For non-JSON responses, return the text or null
      const text = await response.text();
      console.log('[API] Success response (non-JSON):', text);
      return (text || null) as T;
    }
  } catch (error: any) {
    // Only log network errors (not HTTP errors which are already logged above)
    if (!error.statusCode) {
      console.error('[API] Network error:', error);
    }
    throw error;
  }
}

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Auth API types
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface AuthMessageResponse {
  message: string;
}

// Assessment Template API
export const templateApi = {
  // Get all templates with optional filters
  getTemplates: async (filters?: TemplateFilters): Promise<AssessmentTemplate[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.active !== undefined) params.append('active', filters.active.toString());
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const endpoint = queryString ? `/templates?${queryString}` : '/templates';

    const response = await apiRequest<ApiResponse<AssessmentTemplate[]>>(endpoint);
    return response.data;
  },

  // Get single template by ID with full question details
  getTemplate: async (templateId: string): Promise<AssessmentTemplate> => {
    const response = await apiRequest<ApiResponse<AssessmentTemplate>>(`/templates/${templateId}`);
    return response.data;
  },
};

// Auth API
export const authApi = {
  // Forgot password - request reset link
  forgotPassword: async (email: string): Promise<ApiResponse<AuthMessageResponse>> => {
    const response = await apiRequest<ApiResponse<AuthMessageResponse>>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response;
  },

  // Reset password with token
  resetPassword: async (
    token: string,
    password: string
  ): Promise<ApiResponse<AuthMessageResponse>> => {
    const response = await apiRequest<ApiResponse<AuthMessageResponse>>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    return response;
  },
};

// Assessment API
export const assessmentApi = {
  // Create new assessment
  createAssessment: async (data: CreateAssessmentRequest): Promise<Assessment> => {
    const response = await apiRequest<Assessment>('/assessments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  // Get user's assessments
  getAssessments: async (): Promise<Assessment[]> => {
    // Request all assessments with a high limit to get COMPLETED ones (they're on later pages)
    // Add timestamp to prevent any HTTP-level caching
    const timestamp = Date.now();
    const response = await apiRequest<any>(`/assessments?limit=100&_t=${timestamp}`);

    // Debug the raw response
    console.log('[API] Raw assessments response:', response);
    console.log('[API] Response data array:', response.data);

    // Find and debug our specific assessment
    const targetAssessment = response.data?.find((a: any) => a.id === 'cmh3fju610001phrlckdz3aa2');
    if (targetAssessment) {
      console.log('[API] Assessment cmh3fju610001phrlckdz3aa2 from backend:', {
        id: targetAssessment.id,
        status: targetAssessment.status,
        hasPriorities: targetAssessment.hasPriorities,
        hasPrioritiesType: typeof targetAssessment.hasPriorities,
        fullObject: targetAssessment,
      });
    } else {
      console.log('[API] WARNING: Assessment cmh3fju610001phrlckdz3aa2 not in backend response!');
    }

    // Backend returns { data: [...], pagination: {...} }
    return response.data || [];
  },

  // Get single assessment
  getAssessment: async (assessmentId: string): Promise<Assessment> => {
    const response = await apiRequest<Assessment>(`/assessments/${assessmentId}`);
    return response;
  },

  // Update assessment (save progress, update responses)
  updateAssessment: async (
    assessmentId: string,
    data: UpdateAssessmentRequest
  ): Promise<Assessment> => {
    const response = await apiRequest<ApiResponse<Assessment>>(`/assessments/${assessmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Complete assessment and generate results
  completeAssessment: async (assessmentId: string): Promise<AssessmentResults> => {
    const response = await apiRequest<ApiResponse<AssessmentResults>>(
      `/assessments/${assessmentId}/complete`,
      {
        method: 'POST',
      }
    );
    return response.data;
  },

  // Get assessment results
  getAssessmentResults: async (assessmentId: string): Promise<AssessmentResults> => {
    return await apiRequest<AssessmentResults>(`/assessments/${assessmentId}/results`);
  },

  // Delete assessment
  deleteAssessment: async (assessmentId: string): Promise<void> => {
    await apiRequest<ApiResponse<void>>(`/assessments/${assessmentId}`, {
      method: 'DELETE',
    });
  },

  // Generate PDF report for assessment (Premium feature)
  generatePDFReport: async (assessmentId: string): Promise<{ url: string; filename: string }> => {
    const response = await apiRequest<ApiResponse<{ url: string; filename: string }>>(
      `/assessments/${assessmentId}/report`
    );
    return response.data;
  },

  // Download PDF report for assessment
  downloadPDFReport: async (assessmentId: string): Promise<void> => {
    const token = localStorage.getItem('token');
    const prefix = getApiPrefix();
    const url = `${API_BASE_URL}${prefix}/assessments/${assessmentId}/report/download`;

    // Build headers with authentication
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      // Fetch the PDF as a blob
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies for anonymous sessions
      });

      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `assessment-report-${assessmentId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('[API] Error downloading PDF report:', error);
      throw error;
    }
  },

  // Get enhanced results with evidence weighting
  getEnhancedResults: async (assessmentId: string): Promise<any> => {
    const response = await apiRequest<any>(`/assessments/${assessmentId}/enhanced-results`);
    return response;
  },

  // Get all answers for an assessment
  getAssessmentAnswers: async (assessmentId: string): Promise<any[]> => {
    const response = await apiRequest<ApiResponse<any[]>>(`/assessments/${assessmentId}/answers`);
    return response.data;
  },

  // Create or update answer
  saveAnswer: async (assessmentId: string, answer: any): Promise<any> => {
    const response = await apiRequest<ApiResponse<any>>(`/assessments/${assessmentId}/answers`, {
      method: 'POST',
      body: JSON.stringify(answer),
    });
    return response.data;
  },

  // Update individual answer
  updateAnswer: async (answerId: string, data: any): Promise<any> => {
    const response = await apiRequest<ApiResponse<any>>(`/answers/${answerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update multiple answers with manual input (for low-confidence questions)
  updateAssessmentAnswers: async (
    assessmentId: string,
    answers: Record<string, string>
  ): Promise<void> => {
    await apiRequest(`/assessments/${assessmentId}/update-answers`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  // Execute AI analysis on assessment
  executeAssessment: async (
    assessmentId: string,
    data?: { documentIds?: string[] }
  ): Promise<{
    assessmentId: string;
    status: string;
    progress: {
      totalQuestions: number;
      processedQuestions: number;
      successfulAnalyses: number;
      failedAnalyses: number;
    };
    creditsUsed: number;
  }> => {
    const response = await apiRequest<{
      assessmentId: string;
      status: string;
      progress: {
        totalQuestions: number;
        processedQuestions: number;
        successfulAnalyses: number;
        failedAnalyses: number;
      };
      creditsUsed: number;
    }>(`/assessments/${assessmentId}/execute`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response;
  },

  // Get AI processing progress
  getAssessmentProgress: async (
    assessmentId: string
  ): Promise<{
    assessmentId: string;
    status: string;
    progress: {
      totalQuestions: number;
      processedQuestions: number;
      successfulAnalyses: number;
      failedAnalyses: number;
      currentQuestion?: {
        id: string;
        text: string;
        sectionName: string;
      };
    };
    answers: Array<{
      id: string;
      questionId: string;
      status: string;
      response?: string;
      evidenceTier?: string;
      aiScore?: number;
      aiExplanation?: string;
    }>;
  }> => {
    const response = await apiRequest<{
      assessmentId: string;
      status: string;
      progress: {
        totalQuestions: number;
        processedQuestions: number;
        successfulAnalyses: number;
        failedAnalyses: number;
        currentQuestion?: {
          id: string;
          text: string;
          sectionName: string;
        };
      };
      answers: Array<{
        id: string;
        questionId: string;
        status: string;
        response?: string;
        evidenceTier?: string;
        aiScore?: number;
        aiExplanation?: string;
      }>;
    }>(`/assessments/${assessmentId}/progress`);
    return response;
  },

  // Get strategy matrix with timeline-based buckets (Story 1.27)
  getStrategyMatrix: async (assessmentId: string): Promise<StrategyMatrix> => {
    const response = await apiRequest<ApiResponse<StrategyMatrix>>(
      `/assessments/${assessmentId}/strategy-matrix`
    );
    return response.data;
  },

  // Get vendor matches with priority boost scoring (Story 1.27)
  getVendorMatches: async (
    assessmentId: string,
    threshold = 0,  // Changed from 80 to 0 to show all matches
    limit = 50      // Increased from 20 to 50
  ): Promise<VendorMatchesResponse> => {
    const params = new URLSearchParams();
    params.append('threshold', threshold.toString());
    params.append('limit', limit.toString());

    const response = await apiRequest<VendorMatchesResponse>(
      `/assessments/${assessmentId}/vendor-matches-v2?${params.toString()}`
    );
    return response;
  },

  // Submit priorities questionnaire (Story 1.14)
  submitPriorities: async (assessmentId: string, priorities: any): Promise<any> => {
    const response = await apiRequest<ApiResponse<any>>(`/assessments/${assessmentId}/priorities`, {
      method: 'POST',
      body: JSON.stringify(priorities),
    });
    return response.data;
  },

  // Get priorities for assessment (Story 1.14)
  getPriorities: async (assessmentId: string): Promise<any> => {
    try {
      // Add timestamp to prevent any HTTP-level caching
      const timestamp = Date.now();
      const response = await apiRequest<ApiResponse<any>>(
        `/assessments/${assessmentId}/priorities?_t=${timestamp}`
      );

      // Debug logging for specific assessment
      if (assessmentId === 'cmh3fju610001phrlckdz3aa2') {
        console.log('[API] getPriorities SUCCESS for cmh3fju610001phrlckdz3aa2:', {
          response,
          data: response.data,
          hasData: !!response.data
        });
      }

      return response.data;
    } catch (error: any) {
      // Debug error for specific assessment
      if (assessmentId === 'cmh3fju610001phrlckdz3aa2') {
        console.error('[API] getPriorities ERROR for cmh3fju610001phrlckdz3aa2:', {
          error,
          statusCode: error?.statusCode,
          message: error?.message,
          response: error?.response
        });
      }

      // Return null if priorities not found (404) - expected for assessments without priorities
      if (error?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  // Update priorities for assessment (Story 1.14)
  updatePriorities: async (assessmentId: string, priorities: any): Promise<any> => {
    const response = await apiRequest<ApiResponse<any>>(`/assessments/${assessmentId}/priorities`, {
      method: 'PUT',
      body: JSON.stringify(priorities),
    });
    return response.data;
  },

  // Generate and store AI analysis (Story 3.3)
  generateAIAnalysis: async (assessmentId: string): Promise<any> => {
    const response = await apiRequest<ApiResponse<any>>(
      `/assessments/${assessmentId}/generate-ai-analysis`,
      {
        method: 'POST',
      }
    );
    return response.data;
  },

  // Get assessment gaps (Epic 13 - Story 13.3)
  getGaps: async (
    assessmentId: string,
    filters?: {
      severity?: Severity;
      category?: string;
      priority?: Priority;
    }
  ): Promise<Gap[]> => {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.priority) params.append('priority', filters.priority);

    const queryString = params.toString();
    const url = `/assessments/${assessmentId}/gaps${queryString ? '?' + queryString : ''}`;
    const response = await apiRequest<ApiResponse<Gap[]>>(url);
    return response.data;
  },
};

// Freemium/Subscription API
export const freemiumApi = {
  // Get user's freemium restrictions
  getFreemiumStatus: async (): Promise<FreemiumRestrictions> => {
    const response = await apiRequest<ApiResponse<FreemiumRestrictions>>('/user/freemium-status');
    return response.data;
  },
};

// React Query keys for cache management
export const queryKeys = {
  // Templates
  templates: ['templates'] as const,
  templatesFiltered: (filters: TemplateFilters) => ['templates', filters] as const,
  template: (id: string) => ['templates', id] as const,

  // Assessments
  assessments: ['assessments'] as const,
  assessment: (id: string) => ['assessments', id] as const,
  assessmentResults: (id: string) => ['assessments', id, 'results'] as const,
  strategyMatrix: (id: string) => ['assessments', id, 'strategy-matrix'] as const,
  vendorMatches: (id: string, threshold?: number) =>
    ['assessments', id, 'vendor-matches', threshold] as const,
  priorities: (id: string) => ['assessments', id, 'priorities'] as const,

  // Organizations
  myOrganization: ['organizations', 'my'] as const,
  organization: (id: string) => ['organizations', id] as const,

  // Documents
  organizationDocuments: (orgId: string) => ['documents', 'organizations', orgId] as const,
  document: (id: string) => ['documents', id] as const,

  // User/Freemium
  freemiumStatus: ['freemium-status'] as const,
};

// Organization API
export const organizationApi = {
  // Get current user's organization
  getMyOrganization: async (): Promise<any> => {
    try {
      const response = await apiRequest<any>('/organizations/my-organization');
      // This endpoint returns the organization object directly, not wrapped in ApiResponse
      return response;
    } catch (error: any) {
      // Return null if organization not found (404) - this is expected for new users
      if (error?.statusCode === 404 || error?.code === 'ORGANIZATION_NOT_FOUND') {
        return null;
      }
      // Re-throw other errors
      throw error;
    }
  },

  // Get organization by ID
  getOrganization: async (orgId: string): Promise<any> => {
    const response = await apiRequest<ApiResponse<any>>(`/organizations/${orgId}`);
    return response.data;
  },

  // Create organization
  createOrganization: async (data: any): Promise<any> => {
    const response = await apiRequest<ApiResponse<any>>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update organization
  updateOrganization: async (orgId: string, data: any): Promise<any> => {
    const response = await apiRequest<any>(`/organizations/${orgId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    // This endpoint returns the organization object directly, not wrapped in ApiResponse
    return response;
  },

  // Parse website for organization data
  parseWebsite: async (orgId: string, url: string): Promise<any> => {
    const response = await apiRequest<any>(`/organizations/${orgId}/parse-website`, {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    // This endpoint returns the extraction result directly, not wrapped in ApiResponse
    return response;
  },
};

// Document API
export const documentApi = {
  // Get upload URL for document
  getUploadUrl: async (data: any): Promise<any> => {
    const response = await apiRequest<any>('/documents/upload-url', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  // Confirm document upload
  confirmUpload: async (docId: string): Promise<any> => {
    const response = await apiRequest<ApiResponse<any>>(`/documents/${docId}/confirm-upload`, {
      method: 'POST',
    });
    return response.data;
  },

  // Analyze document
  analyzeDocument: async (docId: string, options: any): Promise<any> => {
    const response = await apiRequest<ApiResponse<any>>(`/documents/${docId}/analyze`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
    return response.data;
  },

  // Get organization documents
  getOrganizationDocuments: async (orgId: string): Promise<any> => {
    try {
      // Backend returns { data: [...], pagination: {...} } directly (not wrapped in ApiResponse)
      const response = await apiRequest<any>(`/documents/organizations/${orgId}/documents`);
      return response;
    } catch (error: any) {
      // Return empty paginated response if no documents found (404)
      if (error?.statusCode === 404) {
        return { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
      }
      throw error;
    }
  },

  // Delete document
  deleteDocument: async (docId: string): Promise<void> => {
    await apiRequest<void>(`/documents/${docId}`, {
      method: 'DELETE',
    });
  },
};

// React Query mutations
export const createMutations = (queryClient: QueryClient) => ({
  // Organization mutations
  updateOrganization: (orgId: string) => ({
    mutationFn: (data: any) => organizationApi.updateOrganization(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myOrganization });
      queryClient.invalidateQueries({ queryKey: queryKeys.organization(orgId) });
    },
  }),

  createOrganization: {
    mutationFn: organizationApi.createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myOrganization });
    },
  },

  // Document mutations
  deleteDocument: (orgId: string) => ({
    mutationFn: documentApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizationDocuments(orgId) });
    },
  }),
  // Create assessment mutation
  createAssessment: {
    mutationFn: assessmentApi.createAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
    },
  },

  // Update assessment mutation
  updateAssessment: (assessmentId: string) => ({
    mutationFn: (data: UpdateAssessmentRequest) =>
      assessmentApi.updateAssessment(assessmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessment(assessmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
    },
  }),

  // Complete assessment mutation
  completeAssessment: (assessmentId: string) => ({
    mutationFn: () => assessmentApi.completeAssessment(assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessment(assessmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessmentResults(assessmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.freemiumStatus });
    },
  }),

  // Delete assessment mutation
  deleteAssessment: (assessmentId: string) => ({
    mutationFn: () => assessmentApi.deleteAssessment(assessmentId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.assessment(assessmentId) });
      queryClient.removeQueries({ queryKey: queryKeys.assessmentResults(assessmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments });
    },
  }),
});

// RFP API
export const rfpApi = {
  // Create a new RFP
  createRFP: async (data: {
    organizationId: string;
    title: string;
    objectives?: string;
    requirements?: string;
    timeline?: string;
    budget?: string;
    vendorIds: string[];
    documents?: string[];
  }) => {
    const response = await apiRequest<ApiResponse<any>>('/rfps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Get all RFPs for the current user
  getRFPs: async (filters?: {
    status?: string;
    leadStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (filters?.status) searchParams.set('status', filters.status);
    if (filters?.leadStatus) searchParams.set('leadStatus', filters.leadStatus);
    if (filters?.dateFrom) searchParams.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) searchParams.set('dateTo', filters.dateTo);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/rfps?${queryString}` : '/rfps';

    const response = await apiRequest<ApiResponse<any[]>>(endpoint);
    return response.data;
  },

  // Get a single RFP by ID
  getRFP: async (rfpId: string) => {
    const response = await apiRequest<ApiResponse<any>>(`/rfps/${rfpId}`);
    return response.data;
  },

  // Update an existing RFP (DRAFT only)
  updateRFP: async (rfpId: string, data: {
    title?: string;
    objectives?: string;
    requirements?: string;
    timeline?: string;
    budget?: string;
    vendorIds?: string[];
    documents?: string[];
  }) => {
    const response = await apiRequest<ApiResponse<any>>(`/rfps/${rfpId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete an RFP
  deleteRFP: async (rfpId: string) => {
    const response = await apiRequest<ApiResponse<{ success: boolean; message: string }>>(`/rfps/${rfpId}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  // Get strategic roadmap for RFP auto-population
  getStrategicRoadmap: async (organizationId: string) => {
    const response = await apiRequest<ApiResponse<{
      organizationProfile: any;
      assessmentContext: any;
      topGaps: any[];
      phasedRoadmap: any;
      hasCompletedAssessment: boolean;
      formatted: {
        companyOverview: string;
        projectObjectives: string;
        suggestedRequirements: string;
      };
    }>>(`/organizations/${organizationId}/strategic-roadmap`);
    return response.data;
  },

  // Send RFP to vendors
  sendRFP: async (rfpId: string) => {
    const response = await apiRequest<ApiResponse<{
      success: boolean;
      sentCount: number;
      failedCount: number;
      failures: Array<{
        vendorId: string;
        vendorName: string;
        error: string;
      }>;
    }>>(`/rfps/${rfpId}/send`, {
      method: 'POST',
    });
    return response.data;
  },
};

// Subscription API
export const subscriptionApi = {
  // Get current user's subscription
  getCurrentSubscription: async () => {
    const response = await apiRequest<{
      id: string;
      plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
      status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
      creditsBalance: number;
      creditsUsed: number;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      cancelAt?: string;
    }>('/subscriptions/current');
    return response;
  },

  // Get subscription plans
  getPlans: async () => {
    const response = await apiRequest<ApiResponse<Array<{
      name: string;
      price: number;
      interval: string;
      features: string[];
      creditsIncluded: number;
    }>>>('/subscriptions/plans');
    return response.data;
  },

  // Create checkout session
  createCheckout: async (plan: 'FREE' | 'PREMIUM' | 'ENTERPRISE') => {
    const response = await apiRequest<ApiResponse<{
      checkoutUrl: string;
      sessionId: string;
    }>>('/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
    return response.data;
  },

  // Get credit balance
  getCredits: async () => {
    const response = await apiRequest<ApiResponse<{
      balance: number;
      used: number;
      total: number;
    }>>('/subscriptions/credits');
    return response.data;
  },
};

// Vendor API
export const vendorApi = {
  // Contact a vendor
  contactVendor: async (vendorId: string, data: {
    type: 'DEMO_REQUEST' | 'INFO_REQUEST' | 'RFP' | 'PRICING' | 'GENERAL';
    message: string;
    requirements?: Record<string, any>;
    budget?: string;
    timeline?: string;
  }) => {
    const response = await apiRequest<{
      id: string;
      vendorId: string;
      type: string;
      message: string;
      status: string;
      createdAt: string;
    }>(`/vendors/${vendorId}/contact`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  // Get approved vendors (for vendor selection)
  getVendors: async (filters?: {
    status?: string;
    category?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (filters?.status) searchParams.set('status', filters.status);
    if (filters?.category) searchParams.set('category', filters.category);
    if (filters?.search) searchParams.set('search', filters.search);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/vendors?${queryString}` : '/vendors';

    const response = await apiRequest<ApiResponse<any[]>>(endpoint);
    return response.data;
  },

  // Get single vendor details
  getVendor: async (vendorId: string) => {
    const response = await apiRequest<ApiResponse<any>>(`/vendors/${vendorId}`);
    return response.data;
  },

  // Track vendor click (for analytics)
  trackVendorClick: async (vendorId: string) => {
    try {
      await apiRequest<{ success: boolean; message?: string }>(`/vendors/${vendorId}/click`, {
        method: 'POST',
      });
    } catch (error) {
      // Silently fail - don't disrupt user experience if tracking fails
      console.warn('Failed to track vendor click:', error);
    }
  },
};

// Admin Analytics API
export const adminAnalyticsApi = {
  // Get assessment analytics
  getAssessmentAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.groupBy) searchParams.set('groupBy', params.groupBy);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/analytics/assessments?${queryString}` : '/admin/analytics/assessments';

    const response = await apiRequest<ApiResponse<any>>(endpoint);
    return response.data;
  },

  // Get vendor analytics
  getVendorAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/analytics/vendors?${queryString}` : '/admin/analytics/vendors';

    const response = await apiRequest<ApiResponse<any>>(endpoint);
    return response.data;
  },

  // Get user analytics
  getUserAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/analytics/users?${queryString}` : '/admin/analytics/users';

    const response = await apiRequest<ApiResponse<any>>(endpoint);
    return response.data;
  },

  // Get activity feed
  getActivityFeed: async (params?: {
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/analytics/activity-feed?${queryString}` : '/admin/analytics/activity-feed';

    const response = await apiRequest<ApiResponse<any>>(endpoint);
    return response.data;
  },

  // Export analytics
  exportAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/analytics/export?${queryString}` : '/admin/analytics/export';

    const token = localStorage.getItem('token');
    const prefix = getApiPrefix();
    const url = `${API_BASE_URL}${prefix}${endpoint}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to export analytics: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `heliolus-analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('[API] Error exporting analytics:', error);
      throw error;
    }
  },

  // Get revenue analytics
  getRevenueAnalytics: async (params: {
    view: 'overview' | 'trends' | 'customers' | 'breakdown';
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    searchParams.set('view', params.view);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);

    const queryString = searchParams.toString();
    const endpoint = `/admin/analytics/revenue?${queryString}`;

    const response = await apiRequest<ApiResponse<any>>(endpoint);
    return response.data;
  },
};

// Admin Leads API
export const adminLeadsApi = {
  // Get all leads with filters
  getLeads: async (filters?: {
    type?: 'ALL' | 'PREMIUM' | 'BASIC';
    status?: string[];
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (filters?.type) searchParams.set('type', filters.type);
    if (filters?.status) filters.status.forEach(s => searchParams.append('status', s));
    if (filters?.startDate) searchParams.set('startDate', filters.startDate);
    if (filters?.endDate) searchParams.set('endDate', filters.endDate);
    if (filters?.page) searchParams.set('page', filters.page.toString());
    if (filters?.limit) searchParams.set('limit', filters.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/leads?${queryString}` : '/admin/leads';

    const response = await apiRequest<ApiResponse<{
      leads: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>>(endpoint);
    return response.data;
  },

  // Get single lead by ID
  getLead: async (leadId: string, leadType: 'PREMIUM' | 'BASIC') => {
    const response = await apiRequest<ApiResponse<any>>(`/admin/leads/${leadId}?type=${leadType}`);
    return response.data;
  },

  // Update lead status
  updateLeadStatus: async (leadId: string, leadType: 'PREMIUM' | 'BASIC', status: string) => {
    const response = await apiRequest<ApiResponse<any>>(`/admin/leads/${leadId}?type=${leadType}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data;
  },

  // Get lead analytics
  getLeadAnalytics: async () => {
    const response = await apiRequest<ApiResponse<{
      totalLeads: number;
      premiumLeads: number;
      basicLeads: number;
      conversionRate: number;
      byStatus: Record<string, number>;
      byMonth: Array<{ month: string; premium: number; basic: number }>;
    }>>('/admin/leads/analytics');
    return response.data;
  },

  // Export leads to CSV
  exportLeads: async (filters?: {
    type?: 'ALL' | 'PREMIUM' | 'BASIC';
    status?: string[];
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (filters?.type) searchParams.set('type', filters.type);
    if (filters?.status) filters.status.forEach(s => searchParams.append('status', s));
    if (filters?.startDate) searchParams.set('startDate', filters.startDate);
    if (filters?.endDate) searchParams.set('endDate', filters.endDate);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/admin/leads/export?${queryString}` : '/admin/leads/export';

    try {
      const response = await fetch(`${getApiBaseUrl()}${getApiPrefix()}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const filename = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('[API] Error exporting leads:', error);
      throw error;
    }
  },
};

// TypeScript interfaces for Admin Template API
export interface CreateTemplateData {
  name: string;
  slug: string;
  category: 'FINANCIAL_CRIME' | 'TRADE_COMPLIANCE' | 'DATA_PRIVACY' | 'CYBERSECURITY' | 'ESG';
  description: string;
  version?: string;
  isActive?: boolean;
  creditCost?: number;
}

export interface CreateSectionData {
  title: string;
  description?: string;
  order: number;
  weight?: number;
}

export interface CreateQuestionData {
  text: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MULTISELECT' | 'FILE' | 'DATE' | 'RATING';
  order: number;
  required?: boolean;
  options?: string[];
  helpText?: string;
  aiPromptHint?: string;
  weight?: number;
  categoryTag?: string;
  scoringRules?: any;
  validation?: any;
}

export interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  categoryCounts: Record<string, number>;
  averageQuestions: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  metadata?: any;
}

// Admin Template API (requires ADMIN role)
export const adminTemplateApi = {
  // Templates
  createTemplate: async (data: CreateTemplateData): Promise<ApiResponse<AssessmentTemplate>> => {
    return await apiRequest<ApiResponse<AssessmentTemplate>>('/admin/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTemplate: async (id: string, data: Partial<CreateTemplateData>): Promise<ApiResponse<AssessmentTemplate>> => {
    return await apiRequest<ApiResponse<AssessmentTemplate>>(`/admin/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTemplate: async (id: string): Promise<ApiResponse<void>> => {
    return await apiRequest<ApiResponse<void>>(`/admin/templates/${id}`, {
      method: 'DELETE',
    });
  },

  getTemplates: async (): Promise<ApiResponse<AssessmentTemplate[]>> => {
    return await apiRequest<ApiResponse<AssessmentTemplate[]>>('/templates');
  },

  getTemplate: async (id: string): Promise<ApiResponse<AssessmentTemplate>> => {
    return await apiRequest<ApiResponse<AssessmentTemplate>>(`/templates/${id}`);
  },

  getTemplateStats: async (): Promise<ApiResponse<TemplateStats>> => {
    return await apiRequest<ApiResponse<TemplateStats>>('/admin/templates/stats');
  },

  // Sections
  createSection: async (templateId: string, data: CreateSectionData): Promise<ApiResponse<any>> => {
    return await apiRequest<ApiResponse<any>>(`/admin/templates/${templateId}/sections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSection: async (id: string, data: Partial<CreateSectionData>): Promise<ApiResponse<any>> => {
    return await apiRequest<ApiResponse<any>>(`/admin/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteSection: async (id: string): Promise<ApiResponse<void>> => {
    return await apiRequest<ApiResponse<void>>(`/admin/sections/${id}`, {
      method: 'DELETE',
    });
  },

  // Questions
  createQuestion: async (sectionId: string, data: CreateQuestionData): Promise<ApiResponse<any>> => {
    return await apiRequest<ApiResponse<any>>(`/admin/sections/${sectionId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateQuestion: async (id: string, data: Partial<CreateQuestionData>): Promise<ApiResponse<any>> => {
    return await apiRequest<ApiResponse<any>>(`/admin/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteQuestion: async (id: string): Promise<ApiResponse<void>> => {
    return await apiRequest<ApiResponse<void>>(`/admin/questions/${id}`, {
      method: 'DELETE',
    });
  },

  bulkCreateQuestions: async (sectionId: string, questions: CreateQuestionData[]): Promise<ApiResponse<any[]>> => {
    return await apiRequest<ApiResponse<any[]>>(`/admin/sections/${sectionId}/questions/bulk`, {
      method: 'POST',
      body: JSON.stringify({ questions }),
    });
  },
};

// ==================== LEGAL DOCUMENTS API ====================

export interface LegalDocument {
  id: string;
  type: 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE';
  filename: string;
  s3Key: string;
  s3Bucket: string;
  fileSize: number;
  mimeType: string;
  version: string;
  isActive: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadLegalDocumentRequest {
  type: 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE';
  filename: string;
  mimeType: string;
  fileSize: number;
  version?: string;
}

export interface UploadLegalDocumentResponse {
  document: LegalDocument;
  uploadUrl: string;
  fields: Record<string, string>;
}

export const legalDocumentsApi = {
  // Public endpoints
  getActive: async (type: 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE'): Promise<ApiResponse<LegalDocument | null>> => {
    return await apiRequest<ApiResponse<LegalDocument | null>>(`/legal-documents/active/${type}`);
  },

  getDownloadUrl: async (documentId: string): Promise<ApiResponse<string>> => {
    return await apiRequest<ApiResponse<string>>(`/legal-documents/${documentId}/download`);
  },

  // Admin endpoints
  upload: async (data: UploadLegalDocumentRequest): Promise<ApiResponse<UploadLegalDocumentResponse>> => {
    return await apiRequest<ApiResponse<UploadLegalDocumentResponse>>('/legal-documents/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list: async (type: 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE'): Promise<ApiResponse<LegalDocument[]>> => {
    return await apiRequest<ApiResponse<LegalDocument[]>>(`/legal-documents/list/${type}`);
  },

  activate: async (documentId: string): Promise<ApiResponse<LegalDocument>> => {
    return await apiRequest<ApiResponse<LegalDocument>>(`/legal-documents/${documentId}/activate`, {
      method: 'POST',
    });
  },

  delete: async (documentId: string): Promise<ApiResponse<void>> => {
    return await apiRequest<ApiResponse<void>>(`/legal-documents/${documentId}`, {
      method: 'DELETE',
    });
  },

  // Helper to upload file to object storage using presigned URL
  uploadToS3: async (url: string, fields: Record<string, string>, file: File): Promise<void> => {
    // Replit Object Storage uses simple PUT request (not multipart POST like S3)
    // The fields parameter is not used but kept for API compatibility
    const response = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }
  },
};

// ==================== PLAN MANAGEMENT API ====================

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description?: string;
  isActive: boolean;
  isPublic: boolean;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  stripeProductId?: string;
  stripeMonthlyPriceId?: string;
  stripeAnnualPriceId?: string;
  monthlyCredits: number;
  assessmentCredits: number;
  maxAssessments: number;
  maxUsers: number;
  features?: string[];
  trialDays: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanData {
  slug: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  currency?: string;
  monthlyCredits?: number;
  assessmentCredits?: number;
  maxAssessments?: number;
  maxUsers?: number;
  features?: string[];
  trialDays?: number;
  isActive?: boolean;
  isPublic?: boolean;
  displayOrder?: number;
  createInStripe?: boolean;
}

export interface UpdatePlanData {
  name?: string;
  description?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  monthlyCredits?: number;
  assessmentCredits?: number;
  maxAssessments?: number;
  maxUsers?: number;
  features?: string[];
  trialDays?: number;
  isActive?: boolean;
  isPublic?: boolean;
  displayOrder?: number;
  syncToStripe?: boolean;
}

export const adminPlanApi = {
  listPlans: async (params?: {
    activeOnly?: boolean;
    publicOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: Plan[]; pagination: PaginationInfo }>> => {
    const queryParams = new URLSearchParams();
    if (params?.activeOnly) queryParams.append('activeOnly', 'true');
    if (params?.publicOnly) queryParams.append('publicOnly', 'true');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `/admin/plans?${queryString}` : '/admin/plans';

    return await apiRequest<ApiResponse<{ data: Plan[]; pagination: PaginationInfo }>>(url);
  },

  getPlan: async (id: string): Promise<ApiResponse<Plan>> => {
    return await apiRequest<ApiResponse<Plan>>(`/admin/plans/${id}`);
  },

  createPlan: async (data: CreatePlanData): Promise<ApiResponse<Plan>> => {
    return await apiRequest<ApiResponse<Plan>>('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePlan: async (id: string, data: UpdatePlanData): Promise<ApiResponse<Plan>> => {
    return await apiRequest<ApiResponse<Plan>>(`/admin/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePlan: async (id: string): Promise<ApiResponse<void>> => {
    return await apiRequest<ApiResponse<void>>(`/admin/plans/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== PUBLIC PLANS API ====================

export const publicPlanApi = {
  listPlans: async (): Promise<ApiResponse<Plan[]>> => {
    const response = await fetch(`${API_BASE_URL}/v1/public/plans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch plans: ${response.statusText}`);
    }

    return await response.json();
  },
};

// ==================== COUPON MANAGEMENT API ====================

export interface Coupon {
  id: string;
  code: string;
  stripeCouponId?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  currency?: string;
  isActive: boolean;
  maxRedemptions?: number;
  timesRedeemed: number;
  validFrom: string;
  validUntil?: string;
  applicablePlans: string[];
  minimumAmount?: number;
  newCustomersOnly: boolean;
  durationInMonths?: number;
  name?: string;
  description?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponData {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  currency?: string;
  maxRedemptions?: number;
  validFrom?: string;
  validUntil?: string;
  applicablePlans?: string[];
  minimumAmount?: number;
  newCustomersOnly?: boolean;
  durationInMonths?: number;
  name?: string;
  description?: string;
  isActive?: boolean;
  createInStripe?: boolean;
}

export interface UpdateCouponData {
  code?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  maxRedemptions?: number;
  validUntil?: string;
  applicablePlans?: string[];
  minimumAmount?: number;
  newCustomersOnly?: boolean;
  durationInMonths?: number;
  name?: string;
  description?: string;
  isActive?: boolean;
  syncToStripe?: boolean;
}

export interface ValidateCouponData {
  code: string;
  planSlug?: string;
  amount?: number;
}

export const adminCouponApi = {
  listCoupons: async (params?: {
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: Coupon[]; pagination: PaginationInfo }>> => {
    const queryParams = new URLSearchParams();
    if (params?.activeOnly) queryParams.append('activeOnly', 'true');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `/admin/coupons?${queryString}` : '/admin/coupons';

    return await apiRequest<ApiResponse<{ data: Coupon[]; pagination: PaginationInfo }>>(url);
  },

  getCoupon: async (id: string): Promise<ApiResponse<Coupon>> => {
    return await apiRequest<ApiResponse<Coupon>>(`/admin/coupons/${id}`);
  },

  createCoupon: async (data: CreateCouponData): Promise<ApiResponse<Coupon>> => {
    return await apiRequest<ApiResponse<Coupon>>('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCoupon: async (id: string, data: UpdateCouponData): Promise<ApiResponse<Coupon>> => {
    return await apiRequest<ApiResponse<Coupon>>(`/admin/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCoupon: async (id: string): Promise<ApiResponse<void>> => {
    return await apiRequest<ApiResponse<void>>(`/admin/coupons/${id}`, {
      method: 'DELETE',
    });
  },

  validateCoupon: async (data: ValidateCouponData): Promise<ApiResponse<{ valid: boolean; coupon?: Coupon; error?: string }>> => {
    return await apiRequest<ApiResponse<{ valid: boolean; coupon?: Coupon; error?: string }>>('/admin/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export { apiRequest };
