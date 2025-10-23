/**
 * Database types export for frontend consumption
 * Generated from Prisma schema
 */

// Re-export all Prisma types
export * from '../generated/prisma/index.js';

// Additional utility types
export type {
  User as DatabaseUser,
  Organization as DatabaseOrganization,
  Document as DatabaseDocument,
  Assessment as DatabaseAssessment,
  Gap as DatabaseGap,
  Risk as DatabaseRisk,
  Template as DatabaseTemplate,
  Section as DatabaseSection,
  Question as DatabaseQuestion,
  Answer as DatabaseAnswer,
  Vendor as DatabaseVendor,
  Solution as DatabaseSolution,
  VendorMatch as DatabaseVendorMatch,
  Subscription as DatabaseSubscription,
  Invoice as DatabaseInvoice,
  CreditTransaction as DatabaseCreditTransaction,
  Report as DatabaseReport,
  VendorContact as DatabaseVendorContact,
  AuditLog as DatabaseAuditLog,
} from '../generated/prisma/index.js';

// Enum exports
export {
  UserRole,
  UserStatus,
  CompanySize,
  AnnualRevenue,
  ComplianceTeamSize,
  Geography,
  RiskProfile,
  DocumentType,
  AssessmentStatus,
  Severity,
  Priority,
  CostRange,
  EffortRange,
  RiskCategory,
  Likelihood,
  Impact,
  RiskLevel,
  TemplateCategory,
  QuestionType,
  VendorCategory,
  VendorStatus,
  PricingModel,
  SubscriptionPlan,
  SubscriptionStatus,
  ReportType,
  ReportFormat,
  ContactType,
  ContactStatus,
  TransactionType,
  InvoiceStatus,
  AnswerStatus,
} from '../generated/prisma/index.js';

// Custom types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Assessment-related types
export interface AssessmentResponse {
  questionId: string;
  value: any;
  metadata?: Record<string, any>;
}

export interface AssessmentResult {
  riskScore: number;
  gaps: any[];
  risks: any[];
  recommendations: Record<string, any>;
  strategyMatrix?: Record<string, any>;
}

// Vendor matching types  
export interface VendorMatchCriteria {
  gapCategories: string[];
  industry?: string;
  companySize?: string;
  budget?: string;
  timeline?: string;
  location?: string;
}

// User session types
export interface UserSession {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
  vendorId?: string;
}

// Database query options
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Credit system types
export interface CreditUsage {
  assessmentType: string;
  credits: number;
  description: string;
}

// File upload types
export interface FileUpload {
  filename: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface S3Upload {
  key: string;
  bucket: string;
  url: string;
}

// Audit types
export interface AuditEvent {
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Import statement for use in other files
export const DATABASE_TYPES_COMMENT = `
/**
 * Import database types:
 * 
 * import { 
 *   DatabaseUser, 
 *   UserRole, 
 *   ApiResponse, 
 *   PaginatedResponse 
 * } from './types/database';
 */
`;