/**
 * Anonymous API Functions
 * Handles unauthenticated user sessions and data persistence
 */

// Types for anonymous operations
export interface AnonymousSession {
  sessionId: string;
  isAnonymous: boolean;
}

export interface AnonymousProfile {
  name?: string;
  website?: string;
  industry?: string;
  size?: 'STARTUP' | 'SMB' | 'MIDMARKET' | 'ENTERPRISE';
  country?: string;
  region?: string;
  description?: string;
  annualRevenue?: 'UNDER_1M' | 'FROM_1M_10M' | 'FROM_10M_100M' | 'OVER_100M';
  complianceTeamSize?: 'NONE' | 'ONE_TWO' | 'THREE_TEN' | 'OVER_TEN';
  geography?: 'US' | 'EU' | 'UK' | 'APAC' | 'GLOBAL';
  riskProfile?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  complianceGaps?: string[];
  financialCrimeRisk?: string;
  riskAppetite?: string;
  complianceBudget?: string;
  regulatoryRequirements?: string;
  painPoints?: string;
}

export interface AnonymousDocument {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  documentType: 'POLICY' | 'ANNUAL_REPORT' | 'COMPLIANCE_CERT' | 'AUDIT_REPORT' | 'OTHER';
  createdAt: string;
}

export interface AnonymousStatus {
  sessionId: string;
  isAnonymous: boolean;
  hasProfile: boolean;
  documentCount: number;
  assessmentCount: number;
  profileComplete: boolean;
  canProceed: boolean;
}

class AnonymousApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AnonymousApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { sessionId?: string } = {}
): Promise<T> {
  // Use relative URL to leverage Vite proxy
  const url = `/v1/anon${endpoint}`;

  const { sessionId, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  // Add session ID header if provided
  if (sessionId) {
    headers['x-anonymous-session-id'] = sessionId;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include', // Important for anonymous session cookies
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new AnonymousApiError(
      errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }

  return response.json();
}

export const anonymousApi = {
  // Initialize anonymous session
  async initializeSession(): Promise<AnonymousSession> {
    return apiRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Profile management
  async getProfile(
    sessionId?: string
  ): Promise<{ profile: AnonymousProfile | null; sessionId: string }> {
    return apiRequest('/profile', { sessionId });
  },

  async updateProfile(
    profile: Partial<AnonymousProfile>,
    sessionId?: string
  ): Promise<{ profile: AnonymousProfile; message: string }> {
    return apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
      sessionId,
    });
  },

  // Convenience method for saving profile
  async saveProfile(
    profile: Partial<AnonymousProfile>,
    sessionId?: string
  ): Promise<{ profile: AnonymousProfile; message: string }> {
    return this.updateProfile(profile, sessionId);
  },

  // Document management
  async getDocuments(
    sessionId?: string
  ): Promise<{ documents: AnonymousDocument[]; sessionId: string }> {
    return apiRequest('/documents', { sessionId });
  },

  async generateUploadUrl(
    file: {
      filename: string;
      mimeType: string;
      size: number;
      documentType?: 'POLICY' | 'ANNUAL_REPORT' | 'COMPLIANCE_CERT' | 'AUDIT_REPORT' | 'OTHER';
    },
    sessionId?: string
  ): Promise<{
    presignedUrl: string;
    objectKey: string;
    documentId: string;
    expiresIn: number;
  }> {
    return apiRequest('/documents/upload-url', {
      method: 'POST',
      body: JSON.stringify(file),
      sessionId,
    });
  },

  async deleteDocument(documentId: string, sessionId?: string): Promise<{ message: string }> {
    return apiRequest(`/documents/${documentId}`, {
      method: 'DELETE',
      sessionId,
    });
  },

  // Assessment management
  async getAssessments(sessionId?: string): Promise<{ assessments: any[]; sessionId: string }> {
    return apiRequest('/assessments', { sessionId });
  },

  async createAssessment(
    assessment: {
      templateId?: string;
      title?: string;
      answers?: any;
      metadata?: any;
      status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
    },
    sessionId?: string
  ): Promise<{ assessment: any; message: string }> {
    return apiRequest('/assessments', {
      method: 'POST',
      body: JSON.stringify(assessment),
      sessionId,
    });
  },

  async updateAssessment(
    assessmentId: string,
    assessment: {
      templateId?: string;
      title?: string;
      answers?: any;
      metadata?: any;
      status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
    },
    sessionId?: string
  ): Promise<{ assessment: any; message: string }> {
    return apiRequest(`/assessments/${assessmentId}`, {
      method: 'PUT',
      body: JSON.stringify(assessment),
      sessionId,
    });
  },

  // Session status
  async getStatus(sessionId?: string): Promise<AnonymousStatus> {
    return apiRequest('/status', { sessionId });
  },

  // Claim anonymous data (after authentication)
  async claimSession(): Promise<{
    success: boolean;
    migrationResult: {
      organizationId: string | null;
      assessmentIds: string[];
      documentIds: string[];
      documentsRekeyed: number;
      documentsMigrated: number;
    };
    message: string;
  }> {
    return apiRequest('/claim', {
      method: 'POST',
    });
  },
};

export { AnonymousApiError };
