/**
 * Services Index
 * Central export point for all service classes
 */

// Base service class
export { BaseService, type ServiceContext, type ServiceError } from './base.service';

// Individual services
export { SubscriptionService } from './subscription.service';
export { UserService } from './user.service';
export { DocumentService } from './document.service';
export { EmailServiceImpl, emailService, type EmailService, type EmailTemplateData } from './email.service';
export { AnalyticsService } from './analytics.service';
export { TemplateService } from './template.service';

// Create service instances
import { SubscriptionService } from './subscription.service';
import { UserService } from './user.service';
import { DocumentService } from './document.service';
import { emailService } from './email.service';
import { VendorService } from './vendor.service';
import { AnalyticsService } from './analytics.service';
import { TemplateService } from './template.service';

export const subscriptionService = new SubscriptionService();
export const userService = new UserService();
export const documentService = new DocumentService();
export const vendorService = new VendorService();
export const analyticsService = new AnalyticsService();
export const templateService = new TemplateService();
// export { OrganizationService, organizationService } from './organization.service';
// export { AssessmentService, assessmentService } from './assessment.service';
// export { ReportService, reportService } from './report.service';

// Type exports
export type { UserWithoutPassword, UserSession } from './user.service';
export type { OrganizationProfile, CompanyInsights } from './organization.service';
export type { AssessmentWithDetails, RiskScoreBreakdown } from './assessment.service';
export type { VendorWithDetails, SolutionWithVendor, VendorMatchResult } from './vendor.service';
export type { SubscriptionWithDetails, CreditBalance, BillingHistory, SubscriptionUsage } from './subscription.service';
export type { DocumentWithMetadata, DocumentAnalysisResult, UploadResult } from './document.service';
export type { ReportWithDetails, ReportContent, ShareableReport } from './report.service';

// Service collection for dependency injection or initialization
export const services = {
  subscription: subscriptionService,
  user: userService,
  document: documentService,
  email: emailService,
  analytics: analyticsService,
  template: templateService,
  // organization: organizationService,
  // assessment: assessmentService,
  vendor: vendorService,
  // report: reportService,
};

/**
 * Initialize all services
 * This can be called during application startup
 */
export async function initializeServices(): Promise<void> {
  console.log('🔧 Initializing services...');

  // Run health checks on available services
  const healthChecks = await Promise.allSettled([
    services.subscription.healthCheck(),
    services.user.healthCheck(),
    services.document.healthCheck(),
    services.email.healthCheck(),
    services.analytics.healthCheck(),
    services.template.healthCheck(),
  ]);

  const serviceNames = ['subscription', 'user', 'document', 'email', 'analytics', 'template'];

  healthChecks.forEach((result, index) => {
    const serviceName = serviceNames[index];
    if (result.status === 'fulfilled') {
      console.log(`✅ ${serviceName} service: ${result.value.status}`);
    } else {
      console.error(`❌ ${serviceName} service failed health check:`, result.reason);
    }
  });

  console.log('🚀 Services initialized successfully!');
}

/**
 * Cleanup all services
 * This should be called during graceful shutdown
 */
export async function cleanupServices(): Promise<void> {
  console.log('🧹 Cleaning up services...');

  // Cleanup available services
  await Promise.all([
    services.subscription.cleanup(),
    services.user.cleanup(),
    services.document.cleanup(),
    services.email.cleanup(),
    services.analytics.cleanup(),
    services.template.cleanup(),
  ]);

  console.log('✅ Services cleaned up successfully!');
}

// Default export for convenience
export default services;