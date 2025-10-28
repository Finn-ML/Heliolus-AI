/**
 * Email Service - Postmark Integration
 * Handles all email functionality including verification emails and notifications
 */

import { Client as PostmarkClient } from 'postmark';
import { BaseService, ServiceContext } from './base.service';
import { env } from '../config/env.validation';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface EmailTemplateData {
  [key: string]: any;
}

export interface RFPEmailData {
  organizationName: string;
  rfpTitle: string;
  objectives: string;
  requirements: string;
  timeline?: string;
  budget?: string;
  documentUrls: string[];
  contactEmail: string;
  contactName: string;
}

export interface VendorInquiryData {
  companyName: string;
  userName: string;
  userEmail: string;
  message: string;
  budget?: string;
  timeline?: string;
}

export interface EmailService {
  sendVerificationEmail(email: string, token: string, name?: string): Promise<void>;
  sendWelcomeEmail(email: string, name: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void>;
  sendEmailChangeVerification(newEmail: string, token: string, name: string, currentEmail: string): Promise<void>;
  sendNotification(email: string, subject: string, template: string, data: EmailTemplateData): Promise<void>;
  sendAssessmentCompletionEmail(email: string, name: string, assessmentTitle: string): Promise<void>;
  sendAccountStatusChangeEmail(email: string, name: string, status: string): Promise<void>;
  sendRFPToVendor(vendorEmail: string, vendorName: string, rfpData: RFPEmailData): Promise<void>;
  sendVendorInquiry(vendorEmail: string, vendorName: string, inquiryData: VendorInquiryData): Promise<void>;
}

interface PostmarkError {
  code: number;
  message: string;
  errorCode: number;
}

export class EmailServiceImpl extends BaseService implements EmailService {
  private postmarkClient: PostmarkClient;
  private templatesPath: string;
  private fromEmail: string;
  private fromName: string;
  private rateLimitStore: Map<string, number[]> = new Map();

  constructor() {
    super();
    
    // Initialize Postmark client
    if (!env.POSTMARK_API_KEY) {
      this.logger.warn('POSTMARK_API_KEY not configured - email service will be in mock mode');
      // Use a test token for development
      this.postmarkClient = new PostmarkClient('POSTMARK_API_TEST');
    } else {
      this.postmarkClient = new PostmarkClient(env.POSTMARK_API_KEY);
    }
    this.templatesPath = join(process.cwd(), 'src', 'templates');
    this.fromEmail = env.POSTMARK_FROM_EMAIL;
    this.fromName = env.POSTMARK_FROM_NAME;

    this.logger.info('Email service initialized with Postmark', {
      fromEmail: this.fromEmail,
      fromName: this.fromName,
    });
  }

  /**
   * Rate limiting for email sending (max 5 emails per hour per email address)
   */
  private isRateLimited(email: string): boolean {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    const attempts = this.rateLimitStore.get(email) || [];
    const recentAttempts = attempts.filter(timestamp => timestamp > hourAgo);
    
    if (recentAttempts.length >= 5) {
      this.logger.warn('Email rate limit exceeded', { email, attempts: recentAttempts.length });
      return true;
    }

    // Clean up old attempts and add current attempt
    recentAttempts.push(now);
    this.rateLimitStore.set(email, recentAttempts);
    
    return false;
  }

  /**
   * Load email template from file system
   */
  private loadTemplate(templateName: string, type: 'html' | 'text'): string {
    try {
      const templatePath = join(this.templatesPath, `${templateName}.${type}`);
      return readFileSync(templatePath, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to load template: ${templateName}.${type}`, error);
      throw this.createError(`Template not found: ${templateName}`, 500, 'TEMPLATE_NOT_FOUND');
    }
  }

  /**
   * Replace template variables with actual data
   */
  private renderTemplate(template: string, data: EmailTemplateData): string {
    let rendered = template;
    
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    return rendered;
  }

  /**
   * Generate secure verification token
   */
  private generateToken(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const randomPart2 = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${randomPart}_${randomPart2}`;
  }

  /**
   * Send email using Postmark with retry logic
   */
  private async sendEmailWithRetry(
    to: string,
    subject: string,
    htmlBody: string,
    textBody: string,
    retries: number = 3
  ): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.postmarkClient.sendEmail({
          From: `${this.fromName} <${this.fromEmail}>`,
          To: to,
          Subject: subject,
          HtmlBody: htmlBody,
          TextBody: textBody,
          MessageStream: 'outbound',
        });

        this.logger.info('Email sent successfully', {
          to,
          subject,
          messageId: result.MessageID,
          attempt,
        });

        return;
      } catch (error) {
        const postmarkError = error as PostmarkError;
        
        this.logger.error(`Email send attempt ${attempt} failed`, {
          to,
          subject,
          error: postmarkError.message,
          code: postmarkError.code,
          errorCode: postmarkError.errorCode,
        });

        // Don't retry for client errors (4xx)
        if (postmarkError.code >= 400 && postmarkError.code < 500) {
          throw this.createError(
            `Email sending failed: ${postmarkError.message}`,
            400,
            'EMAIL_SEND_ERROR',
            { originalError: postmarkError }
          );
        }

        // Retry for server errors (5xx) or network issues
        if (attempt === retries) {
          throw this.createError(
            `Email sending failed after ${retries} attempts`,
            500,
            'EMAIL_SEND_FAILED',
            { originalError: postmarkError }
          );
        }

        // Wait before retry (exponential backoff with jitter)
        // Formula: 2^attempt * 1000ms + random 0-1000ms
        // Results: attempt 1: 2-3s, attempt 2: 4-5s
        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000; // 0-1000ms random delay
        const delay = baseDelay + jitter;

        this.logger.warn(
          `Email send attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms...`,
          { to, subject }
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string, name?: string): Promise<void> {
    try {
      // Rate limiting check
      if (this.isRateLimited(email)) {
        throw this.createError(
          'Too many verification emails sent. Please try again later.',
          429,
          'RATE_LIMITED'
        );
      }

      const templateData = {
        name: name || 'User',
        email,
        verificationToken: token,
        verificationUrl: `${process.env.FRONTEND_URL || 'https://app.heliolus.com'}/verify-email?token=${token}`,
        supportEmail: 'support@heliolus.com',
        companyName: 'Heliolus',
      };

      const htmlTemplate = this.loadTemplate('verification-email', 'html');
      const textTemplate = this.loadTemplate('verification-email', 'text');

      const htmlBody = this.renderTemplate(htmlTemplate, templateData);
      const textBody = this.renderTemplate(textTemplate, templateData);

      await this.sendEmailWithRetry(
        email,
        'Verify your Heliolus account',
        htmlBody,
        textBody
      );

      this.logger.info('Verification email sent', { email });
    } catch (error) {
      this.logger.error('Failed to send verification email', { email, error });
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const templateData = {
        name,
        email,
        dashboardUrl: `${process.env.FRONTEND_URL || 'https://app.heliolus.com'}/dashboard`,
        supportEmail: 'support@heliolus.com',
        companyName: 'Heliolus',
      };

      const htmlTemplate = this.loadTemplate('welcome-email', 'html');
      const textTemplate = this.loadTemplate('welcome-email', 'text');

      const htmlBody = this.renderTemplate(htmlTemplate, templateData);
      const textBody = this.renderTemplate(textTemplate, templateData);

      await this.sendEmailWithRetry(
        email,
        'Welcome to Heliolus!',
        htmlBody,
        textBody
      );

      this.logger.info('Welcome email sent', { email, name });
    } catch (error) {
      this.logger.error('Failed to send welcome email', { email, error });
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void> {
    try {
      // Rate limiting check
      if (this.isRateLimited(email)) {
        throw this.createError(
          'Too many password reset emails sent. Please try again later.',
          429,
          'RATE_LIMITED'
        );
      }

      const templateData = {
        name: name || 'User',
        email,
        resetToken: token,
        resetUrl: `${process.env.FRONTEND_URL || 'https://app.heliolus.com'}/reset-password?token=${token}`,
        supportEmail: 'support@heliolus.com',
        companyName: 'Heliolus',
      };

      const htmlTemplate = this.loadTemplate('password-reset-email', 'html');
      const textTemplate = this.loadTemplate('password-reset-email', 'text');

      const htmlBody = this.renderTemplate(htmlTemplate, templateData);
      const textBody = this.renderTemplate(textTemplate, templateData);

      await this.sendEmailWithRetry(
        email,
        'Reset your Heliolus password',
        htmlBody,
        textBody
      );

      this.logger.info('Password reset email sent', { email });
    } catch (error) {
      this.logger.error('Failed to send password reset email', { email, error });
      throw error;
    }
  }

  /**
   * Send email change verification email
   */
  async sendEmailChangeVerification(newEmail: string, token: string, name: string, currentEmail: string): Promise<void> {
    try {
      // Rate limiting check for new email address
      if (this.isRateLimited(newEmail)) {
        throw this.createError(
          'Too many email change verification emails sent. Please try again later.',
          429,
          'RATE_LIMITED'
        );
      }

      const templateData = {
        name,
        newEmail,
        currentEmail,
        verificationToken: token,
        verificationUrl: `${process.env.FRONTEND_URL || 'https://app.heliolus.com'}/verify-email-change?token=${token}&email=${encodeURIComponent(newEmail)}`,
        supportEmail: 'support@heliolus.com',
        companyName: 'Heliolus',
      };

      const htmlTemplate = this.loadTemplate('email-change-verification', 'html');
      const textTemplate = this.loadTemplate('email-change-verification', 'text');

      const htmlBody = this.renderTemplate(htmlTemplate, templateData);
      const textBody = this.renderTemplate(textTemplate, templateData);

      await this.sendEmailWithRetry(
        newEmail,
        'Verify your new email address - Heliolus',
        htmlBody,
        textBody
      );

      this.logger.info('Email change verification email sent', { newEmail, currentEmail });
    } catch (error) {
      this.logger.error('Failed to send email change verification email', { newEmail, currentEmail, error });
      throw error;
    }
  }

  /**
   * Send assessment completion notification
   */
  async sendAssessmentCompletionEmail(email: string, name: string, assessmentTitle: string): Promise<void> {
    try {
      const templateData = {
        name,
        assessmentTitle,
        resultsUrl: `${process.env.FRONTEND_URL || 'https://app.heliolus.com'}/assessments`,
        supportEmail: 'support@heliolus.com',
        companyName: 'Heliolus',
      };

      const htmlTemplate = this.loadTemplate('assessment-completion', 'html');
      const textTemplate = this.loadTemplate('assessment-completion', 'text');

      const htmlBody = this.renderTemplate(htmlTemplate, templateData);
      const textBody = this.renderTemplate(textTemplate, templateData);

      await this.sendEmailWithRetry(
        email,
        `Your assessment "${assessmentTitle}" is complete`,
        htmlBody,
        textBody
      );

      this.logger.info('Assessment completion email sent', { email, name, assessmentTitle });
    } catch (error) {
      this.logger.error('Failed to send assessment completion email', { email, error });
      throw error;
    }
  }

  /**
   * Send account status change notification
   */
  async sendAccountStatusChangeEmail(email: string, name: string, status: string): Promise<void> {
    try {
      const templateData = {
        name,
        status,
        statusMessage: this.getStatusMessage(status),
        supportEmail: 'support@heliolus.com',
        companyName: 'Heliolus',
      };

      const htmlTemplate = this.loadTemplate('account-status-change', 'html');
      const textTemplate = this.loadTemplate('account-status-change', 'text');

      const htmlBody = this.renderTemplate(htmlTemplate, templateData);
      const textBody = this.renderTemplate(textTemplate, templateData);

      await this.sendEmailWithRetry(
        email,
        'Account status update',
        htmlBody,
        textBody
      );

      this.logger.info('Account status change email sent', { email, name, status });
    } catch (error) {
      this.logger.error('Failed to send account status change email', { email, error });
      throw error;
    }
  }

  /**
   * Send RFP to vendor
   */
  async sendRFPToVendor(vendorEmail: string, vendorName: string, rfpData: RFPEmailData): Promise<void> {
    try {
      const templateData = {
        vendorName,
        organizationName: rfpData.organizationName,
        rfpTitle: rfpData.rfpTitle,
        objectives: rfpData.objectives,
        requirements: rfpData.requirements,
        timeline: rfpData.timeline || 'Not specified',
        budget: rfpData.budget || 'Not specified',
        documentCount: rfpData.documentUrls.length,
        documentUrls: rfpData.documentUrls,
        contactEmail: rfpData.contactEmail,
        contactName: rfpData.contactName,
        supportEmail: 'support@heliolus.com',
        companyName: 'Heliolus',
      };

      const htmlTemplate = this.loadTemplate('rfp-vendor-notification', 'html');
      const textTemplate = this.loadTemplate('rfp-vendor-notification', 'text');

      const htmlBody = this.renderTemplate(htmlTemplate, templateData);
      const textBody = this.renderTemplate(textTemplate, templateData);

      // Use exponential backoff retry logic from sendEmailWithRetry
      await this.sendEmailWithRetry(
        vendorEmail,
        `RFP: ${rfpData.rfpTitle} - ${rfpData.organizationName}`,
        htmlBody,
        textBody
      );

      this.logger.info('RFP email sent to vendor', {
        vendorEmail,
        vendorName,
        rfpTitle: rfpData.rfpTitle,
        organizationName: rfpData.organizationName
      });
    } catch (error) {
      this.logger.error('Failed to send RFP to vendor', {
        vendorEmail,
        vendorName,
        rfpTitle: rfpData.rfpTitle,
        error
      });
      throw error;
    }
  }

  /**
   * Send vendor inquiry email when user contacts a vendor
   */
  async sendVendorInquiry(vendorEmail: string, vendorName: string, inquiryData: VendorInquiryData): Promise<void> {
    try {
      const templateData = {
        vendorName,
        companyName: inquiryData.companyName,
        userName: inquiryData.userName,
        userEmail: inquiryData.userEmail,
        message: inquiryData.message,
        budget: inquiryData.budget || 'Not specified',
        timeline: inquiryData.timeline || 'Not specified',
        supportEmail: 'support@heliolus.com',
      };

      const htmlTemplate = this.loadTemplate('vendor-inquiry', 'html');
      const textTemplate = this.loadTemplate('vendor-inquiry', 'text');

      const htmlBody = this.renderTemplate(htmlTemplate, templateData);
      const textBody = this.renderTemplate(textTemplate, templateData);

      // Use exponential backoff retry logic from sendEmailWithRetry
      await this.sendEmailWithRetry(
        vendorEmail,
        `New inquiry from ${inquiryData.companyName}`,
        htmlBody,
        textBody
      );

      this.logger.info('Vendor inquiry email sent', {
        vendorEmail,
        vendorName,
        companyName: inquiryData.companyName,
        userEmail: inquiryData.userEmail
      });
    } catch (error) {
      this.logger.error('Failed to send vendor inquiry email', {
        vendorEmail,
        vendorName,
        companyName: inquiryData.companyName,
        error
      });
      // Don't throw - vendor contact should succeed even if email fails
    }
  }

  /**
   * Send custom notification email
   */
  async sendNotification(
    email: string,
    subject: string,
    template: string,
    data: EmailTemplateData
  ): Promise<void> {
    try {
      const templateData = {
        ...data,
        supportEmail: 'support@heliolus.com',
        companyName: 'Heliolus',
      };

      const htmlTemplate = this.loadTemplate(template, 'html');
      const textTemplate = this.loadTemplate(template, 'text');

      const htmlBody = this.renderTemplate(htmlTemplate, templateData);
      const textBody = this.renderTemplate(textTemplate, templateData);

      await this.sendEmailWithRetry(email, subject, htmlBody, textBody);

      this.logger.info('Custom notification email sent', { email, subject, template });
    } catch (error) {
      this.logger.error('Failed to send notification email', { email, error });
      throw error;
    }
  }

  /**
   * Get user-friendly status message
   */
  private getStatusMessage(status: string): string {
    const statusMessages: Record<string, string> = {
      ACTIVE: 'Your account has been activated and you can now access all features.',
      SUSPENDED: 'Your account has been temporarily suspended. Please contact support for assistance.',
      DELETED: 'Your account has been permanently deleted.',
    };

    return statusMessages[status] || 'Your account status has been updated.';
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<boolean> {
    try {
      // Send a test email to verify Postmark configuration
      await this.postmarkClient.sendEmail({
        From: `${this.fromName} <${this.fromEmail}>`,
        To: this.fromEmail, // Send test email to self
        Subject: 'Heliolus Email Service Test',
        HtmlBody: '<p>This is a test email to verify Postmark configuration.</p>',
        TextBody: 'This is a test email to verify Postmark configuration.',
        MessageStream: 'outbound',
      });

      this.logger.info('Email configuration test successful');
      return true;
    } catch (error) {
      this.logger.error('Email configuration test failed', error);
      return false;
    }
  }

  /**
   * Cleanup rate limiting store periodically
   */
  cleanup(): Promise<void> {
    // Clear old rate limiting entries
    const hourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [email, attempts] of this.rateLimitStore.entries()) {
      const recentAttempts = attempts.filter(timestamp => timestamp > hourAgo);
      if (recentAttempts.length === 0) {
        this.rateLimitStore.delete(email);
      } else {
        this.rateLimitStore.set(email, recentAttempts);
      }
    }

    return super.cleanup();
  }
}

// Export singleton instance
export const emailService = new EmailServiceImpl();