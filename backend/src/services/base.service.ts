/**
 * Base Service Class
 * Provides common functionality for all services including:
 * - Database access via Prisma
 * - Logging
 * - Error handling
 * - Audit logging
 * - Input validation
 * - Transaction management
 */

import { PrismaClient } from '../generated/prisma/index.js';
import { z } from 'zod';
import { ApiResponse, PaginatedResponse, QueryOptions, AuditEvent, UserSession } from '../types/database';

export interface ServiceContext {
  userId?: string;
  userRole?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ServiceError extends Error {
  statusCode: number;
  code?: string;
  details?: any;
}

export abstract class BaseService {
  protected prisma: PrismaClient;
  protected logger: any; // Will be replaced with proper logger

  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Simple logger for now - should be replaced with proper logging service
    this.logger = {
      info: (messageOrMeta: string | any, meta?: any) => {
        if (typeof messageOrMeta === 'string') {
          console.log(`[INFO] ${messageOrMeta}`, meta || '');
        } else {
          console.log(`[INFO] ${meta || 'Info'}`, JSON.stringify(messageOrMeta, null, 2));
        }
      },
      warn: (messageOrMeta: string | any, meta?: any) => {
        if (typeof messageOrMeta === 'string') {
          console.warn(`[WARN] ${messageOrMeta}`, meta || '');
        } else {
          console.warn(`[WARN] ${meta || 'Warning'}`, JSON.stringify(messageOrMeta, null, 2));
        }
      },
      error: (messageOrMeta: string | any, meta?: any) => {
        if (typeof messageOrMeta === 'string') {
          console.error(`[ERROR] ${messageOrMeta}`, meta || '');
        } else {
          console.error(`[ERROR] ${meta || 'Error'}`, JSON.stringify(messageOrMeta, null, 2));
        }
      },
      debug: (messageOrMeta: string | any, meta?: any) => {
        if (typeof messageOrMeta === 'string') {
          console.debug(`[DEBUG] ${messageOrMeta}`, meta || '');
        } else {
          console.debug(`[DEBUG] ${meta || 'Debug'}`, JSON.stringify(messageOrMeta, null, 2));
        }
      },
    };

    this.setupPrismaLogging();
  }

  /**
   * Setup Prisma query logging
   */
  private setupPrismaLogging() {
    this.prisma.$on('query', (e) => {
      this.logger.debug('Database Query', {
        query: e.query,
        params: e.params,
        duration: e.duration,
        target: e.target,
      });
    });

    this.prisma.$on('error', (e) => {
      this.logger.error('Database Error', {
        target: e.target,
        message: e.message,
      });
    });
  }

  /**
   * Create a standardized API response
   */
  protected createResponse<T>(
    success: boolean,
    data?: T,
    message?: string,
    error?: string
  ): ApiResponse<T> {
    return {
      success,
      data,
      message,
      error,
    };
  }

  /**
   * Create a paginated response
   */
  protected createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a service error
   */
  protected createError(
    message: string,
    statusCode: number = 400,
    code?: string,
    details?: any
  ): ServiceError {
    const error = new Error(message) as ServiceError;
    error.statusCode = statusCode;
    error.code = code;
    error.details = details;
    return error;
  }

  /**
   * Require admin role for operation
   * Throws 403 FORBIDDEN if user is not admin
   */
  protected requireAdmin(context: ServiceContext): void {
    if (!context || context.userRole !== 'ADMIN') {
      throw this.createError('Admin role required for this operation', 403, 'FORBIDDEN');
    }
  }

  /**
   * Validate input data using Zod schema
   */
  protected async validateInput<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): Promise<T> {
    try {
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
        throw this.createError(
          `Validation failed: ${errorMessages}`,
          400,
          'VALIDATION_ERROR',
          error.issues
        );
      }
      throw error;
    }
  }

  /**
   * Handle database errors with proper status codes
   */
  protected handleDatabaseError(error: any, operation: string): never {
    this.logger.error(`Database error in ${operation}`, error);

    // Prisma error codes
    if (error.code === 'P2002') {
      throw this.createError(
        'Resource already exists',
        409,
        'UNIQUE_CONSTRAINT_VIOLATION',
        { constraint: error.meta?.target }
      );
    }

    if (error.code === 'P2025') {
      throw this.createError(
        'Resource not found',
        404,
        'RECORD_NOT_FOUND'
      );
    }

    if (error.code === 'P2003') {
      throw this.createError(
        'Foreign key constraint failed',
        400,
        'FOREIGN_KEY_CONSTRAINT',
        { constraint: error.meta?.field_name }
      );
    }

    // Generic database error
    throw this.createError(
      'Database operation failed',
      500,
      'DATABASE_ERROR',
      { operation, originalError: error.message }
    );
  }

  /**
   * Execute within a transaction
   */
  protected async executeTransaction<T>(
    operation: (tx: any) => Promise<T>,
    context?: ServiceContext
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        this.logger.debug('Starting transaction', { context });
        const result = await operation(tx);
        this.logger.debug('Transaction completed successfully');
        return result;
      });
    } catch (error) {
      this.logger.error('Transaction failed', { error, context });
      throw error;
    }
  }

  /**
   * Log audit event
   */
  protected async logAudit(
    event: AuditEvent,
    context?: ServiceContext
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: context?.userId || null,
          action: event.action,
          entity: event.entity,
          entityId: event.entityId || null,
          oldValues: event.oldValues || null,
          newValues: event.newValues || null,
          ipAddress: context?.ipAddress || null,
          userAgent: context?.userAgent || null,
          metadata: event.metadata || null,
        },
      });
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      this.logger.error('Failed to log audit event', { error, event, context });
    }
  }

  /**
   * Build query options for pagination and filtering
   */
  protected buildQueryOptions(options: QueryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {},
    } = options;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100); // Cap at 100 items per page

    const orderBy = {
      [sortBy]: sortOrder,
    };

    return {
      skip,
      take,
      orderBy,
      where: this.buildWhereClause(filters),
    };
  }

  /**
   * Build where clause from filters
   */
  protected buildWhereClause(filters: Record<string, any>) {
    const where: any = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (typeof value === 'string' && key.includes('search')) {
        // Text search fields
        where[key.replace('search', '')] = {
          contains: value,
          mode: 'insensitive',
        };
      } else if (Array.isArray(value)) {
        // Array filters (in operator)
        where[key] = {
          in: value,
        };
      } else if (typeof value === 'object' && 'gte' in value) {
        // Range filters
        where[key] = value;
      } else {
        // Exact match
        where[key] = value;
      }
    });

    return where;
  }

  /**
   * Check if user has permission to access resource
   */
  protected checkPermission(
    context: ServiceContext,
    requiredRole: string | string[],
    resourceUserId?: string,
    resourceOrganizationId?: string
  ): boolean {
    if (!context.userId) {
      return false;
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // Admin can access everything
    if (context.userRole === 'ADMIN') {
      return true;
    }

    // Check role requirements
    if (!roles.includes(context.userRole || '')) {
      return false;
    }

    // Check resource ownership - user directly owns the resource
    if (resourceUserId && context.userId === resourceUserId) {
      return true;
    }

    // Check organization access - user belongs to same organization
    if (resourceOrganizationId && context.organizationId === resourceOrganizationId) {
      return true;
    }

    // If neither resourceUserId nor resourceOrganizationId is specified, allow access (role check passed)
    if (!resourceUserId && !resourceOrganizationId) {
      return true;
    }

    // Access denied - user doesn't own resource and doesn't share organization
    return false;
  }

  /**
   * Require permission or throw error
   */
  protected requirePermission(
    context: ServiceContext,
    requiredRole: string | string[],
    resourceUserId?: string,
    resourceOrganizationId?: string
  ): void {
    if (!this.checkPermission(context, requiredRole, resourceUserId, resourceOrganizationId)) {
      throw this.createError('Access denied', 403, 'FORBIDDEN');
    }
  }

  /**
   * Get current timestamp
   */
  protected now(): Date {
    return new Date();
  }

  /**
   * Generate unique ID (using cuid format)
   */
  protected generateId(): string {
    return `clx${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup method to be called when service is destroyed
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ status: string; database: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        database: 'connected',
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'unhealthy',
        database: 'disconnected',
      };
    }
  }

  /**
   * Validate service context
   */
  protected validateContext(context?: ServiceContext): void {
    if (!context || !context.userId) {
      throw this.createError('Authentication required', 401, 'UNAUTHORIZED');
    }
  }

  /**
   * Create error response
   */
  protected createErrorResponse<T>(
    message: string, 
    statusCode: number = 400, 
    code?: string
  ): ApiResponse<T> {
    return this.createResponse(false, undefined, undefined, message);
  }

  /**
   * Create success response
   */
  protected createSuccessResponse<T>(
    data: T, 
    message?: string
  ): ApiResponse<T> {
    return this.createResponse(true, data, message);
  }
}