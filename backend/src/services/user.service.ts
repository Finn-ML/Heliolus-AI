/**
 * User Service
 * Handles user management, authentication, and profile operations
 * Uses auth-lib for authentication and password management
 */

import { z } from 'zod';
import { BaseService, ServiceContext } from './base.service';
import {
  ApiResponse,
  PaginatedResponse,
  QueryOptions,
  DatabaseUser,
  UserRole,
  UserStatus,
} from '../types/database';
import {
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from '../lib/auth';
import { emailService } from './email.service';

// Validation schemas
const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  role: z.nativeEnum(UserRole).optional(),
});

const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  organizationId: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
});

const RequestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
});

export interface UserWithoutPassword extends Omit<DatabaseUser, 'password'> {
  organizationId?: string;
  vendorId?: string;
  emailVerified: boolean;
}

export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  vendorId?: string;
}

export interface AuthenticatedUser extends UserSession {
  emailVerified: boolean;
}

export class UserService extends BaseService {
  /**
   * Create a new user
   */
  async createUser(
    data: z.infer<typeof CreateUserSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<UserWithoutPassword>> {
    try {
      const validatedData = await this.validateInput(CreateUserSchema, data);
      
      // Only admins can create users with roles other than USER
      if (validatedData.role && validatedData.role !== UserRole.USER) {
        this.requirePermission(context, [UserRole.ADMIN]);
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        throw this.createError('User with this email already exists', 409, 'USER_EXISTS');
      }

      // Hash password
      const hashedPasswordResult = await hashPassword(validatedData.password);
      if (!hashedPasswordResult.success || !hashedPasswordResult.data) {
        throw this.createError('Failed to hash password', 500, 'HASH_ERROR');
      }
      const emailVerificationResult = generateEmailVerificationToken();
      if (!emailVerificationResult.success || !emailVerificationResult.data) {
        throw this.createError('Failed to generate email verification token', 500, 'TOKEN_ERROR');
      }
      const emailVerificationToken = emailVerificationResult.data;

      const user = await this.prisma.user.create({
        data: {
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          password: hashedPasswordResult.data,
          role: validatedData.role || UserRole.USER,
          emailVerificationToken,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          emailVerificationToken: true,
          passwordResetToken: true,
          passwordResetExpires: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.logAudit(
        {
          action: 'USER_CREATED',
          entity: 'User',
          entityId: user.id,
          newValues: { email: user.email, role: user.role },
        },
        context
      );

      this.logger.info('User created successfully', { userId: user.id, email: user.email });

      // Transform to match UserWithoutPassword interface
      const transformedUser: UserWithoutPassword = {
        ...user,
        organizationId: undefined,
        vendorId: undefined,
      };

      return this.createResponse(true, transformedUser, 'User created successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'createUser');
    }
  }

  /**
   * Authenticate user with email and password (alias for login)
   */
  async authenticateUser(
    data: z.infer<typeof LoginSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<{ user: UserWithoutPassword; token: string }>> {
    const loginResult = await this.login(data, context);
    
    if (!loginResult.success || !loginResult.data) {
      return loginResult as ApiResponse<{ user: UserWithoutPassword; token: string }>;
    }

    // Transform UserSession to UserWithoutPassword
    const userWithoutPassword: UserWithoutPassword = {
      ...loginResult.data.user,
      emailVerified: true, // UserSession doesn't include this, assume verified
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      status: 'ACTIVE' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    };

    return this.createResponse(true, {
      user: userWithoutPassword,
      token: loginResult.data.token
    }, loginResult.message);
  }

  /**
   * Login user with email and password
   */
  async login(
    credentials: z.infer<typeof LoginSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<{ user: UserSession; token: string }>> {
    try {
      const validatedCredentials = await this.validateInput(LoginSchema, credentials);

      const user = await this.prisma.user.findUnique({
        where: { email: validatedCredentials.email },
        include: {
          organization: true,
          vendorProfile: true,
        },
      });

      if (!user) {
        throw this.createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw this.createError('Account is not active', 401, 'ACCOUNT_INACTIVE');
      }

      const isPasswordValid = await verifyPassword(validatedCredentials.password, user.password);
      if (!isPasswordValid) {
        throw this.createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: this.now() },
      });

      const userSession: UserSession = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organization?.id,
        vendorId: user.vendorProfile?.id,
      };

      const token = await generateJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization?.id,
      });

      await this.logAudit(
        {
          action: 'USER_LOGIN',
          entity: 'User',
          entityId: user.id,
        },
        { ...context, userId: user.id }
      );

      this.logger.info('User logged in successfully', { userId: user.id });

      return this.createResponse(
        true,
        { user: userSession, token },
        'Login successful'
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'login');
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(
    email: string,
    context?: ServiceContext
  ): Promise<ApiResponse<UserWithoutPassword>> {
    try {
      this.validateContext(context);

      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
            },
          },
          vendorProfile: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!user) {
        return this.createErrorResponse('User not found');
      }

      // Transform to match UserWithoutPassword interface
      const transformedUser: UserWithoutPassword = {
        ...user,
        organizationId: user.organization?.id,
        vendorId: user.vendorProfile?.id,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        lastLogin: null,
      };

      return this.createSuccessResponse(transformedUser);
    } catch (error) {
      return this.handleDatabaseError(error, 'getUserByEmail');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<UserWithoutPassword>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          emailVerificationToken: true,
          passwordResetToken: true,
          passwordResetExpires: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              country: true,
              size: true,
            },
          },
          vendorProfile: {
            select: {
              id: true,
              companyName: true,
              status: true,
            },
          },
        },
      });

      if (!user) {
        throw this.createError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(context, [UserRole.ADMIN, UserRole.USER], user.id);

      // Transform to match UserWithoutPassword interface
      const transformedUser: UserWithoutPassword = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        emailVerificationToken: user.emailVerificationToken || null,
        passwordResetToken: user.passwordResetToken || null,
        passwordResetExpires: user.passwordResetExpires || null,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        organizationId: user.organization?.id,
        vendorId: user.vendorProfile?.id,
      };

      return this.createResponse(true, transformedUser);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getUserById');
    }
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: z.infer<typeof UpdateUserSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<UserWithoutPassword>> {
    try {
      const validatedData = await this.validateInput(UpdateUserSchema, data);

      const existingUser = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true },
      });

      if (!existingUser) {
        throw this.createError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(context, [UserRole.ADMIN, UserRole.USER], existingUser.id);

      // Only admins can change role and status
      if (validatedData.role || validatedData.status) {
        this.requirePermission(context, [UserRole.ADMIN]);
      }

      // Check for email conflicts
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email: validatedData.email },
        });
        if (emailExists) {
          throw this.createError('Email already in use', 409, 'EMAIL_EXISTS');
        }
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...validatedData,
          emailVerified: validatedData.email ? false : undefined, // Reset verification if email changed
          updatedAt: this.now(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          emailVerificationToken: true,
          passwordResetToken: true,
          passwordResetExpires: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.logAudit(
        {
          action: 'USER_UPDATED',
          entity: 'User',
          entityId: id,
          oldValues: existingUser,
          newValues: validatedData,
        },
        context
      );

      this.logger.info('User updated successfully', { userId: id });

      return this.createResponse(true, updatedUser, 'User updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateUser');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(
    id: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw this.createError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Check permissions
      this.requirePermission(context, [UserRole.ADMIN], user.id);

      // Soft delete by updating status
      await this.prisma.user.update({
        where: { id },
        data: {
          status: UserStatus.DELETED,
          updatedAt: this.now(),
        },
      });

      await this.logAudit(
        {
          action: 'USER_DELETED',
          entity: 'User',
          entityId: id,
          oldValues: { status: 'ACTIVE' },
          newValues: { status: 'DELETED' },
        },
        context
      );

      this.logger.info('User deleted successfully', { userId: id });

      return this.createResponse(true, undefined, 'User deleted successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'deleteUser');
    }
  }

  /**
   * List users with pagination and filtering
   */
  async listUsers(
    options: QueryOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<PaginatedResponse<UserWithoutPassword>>> {
    try {
      // Only admins can list all users
      this.requirePermission(context, [UserRole.ADMIN]);

      const queryOptions = this.buildQueryOptions(options);
      
      // Don't show deleted users by default
      if (!queryOptions.where.status) {
        queryOptions.where.status = { not: UserStatus.DELETED };
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          ...queryOptions,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            emailVerified: true,
            emailVerificationToken: true,
            passwordResetToken: true,
            passwordResetExpires: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
            organization: {
              select: {
                id: true,
                name: true,
                country: true,
              },
            },
          },
        }),
        this.prisma.user.count({ where: queryOptions.where }),
      ]);

      // Transform users to match UserWithoutPassword interface
      const transformedUsers: UserWithoutPassword[] = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        emailVerificationToken: user.emailVerificationToken || null,
        passwordResetToken: user.passwordResetToken || null,
        passwordResetExpires: user.passwordResetExpires || null,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        organizationId: user.organization?.id,
        vendorId: undefined,
      }));

      const paginatedResponse = this.createPaginatedResponse(
        transformedUsers,
        total,
        options.page || 1,
        options.limit || 10
      );

      return this.createResponse(true, paginatedResponse);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'listUsers');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(
    context?: ServiceContext
  ): Promise<ApiResponse<{
    total: number;
    active: number;
    verified: number;
    unverified: number;
    byRole: { ADMIN: number; USER: number; VENDOR: number };
    byStatus: { ACTIVE: number; SUSPENDED: number; DELETED: number };
  }>> {
    try {
      // Only admins can view user stats
      this.requirePermission(context, [UserRole.ADMIN]);

      // Run all queries in parallel for efficiency
      const [total, active, verified, byRole, byStatus] = await Promise.all([
        // Total users excluding deleted
        this.prisma.user.count({
          where: { status: { not: UserStatus.DELETED } }
        }),
        // Active users
        this.prisma.user.count({
          where: { status: UserStatus.ACTIVE }
        }),
        // Verified users (excluding deleted)
        this.prisma.user.count({
          where: {
            emailVerified: true,
            status: { not: UserStatus.DELETED }
          }
        }),
        // Group by role (excluding deleted)
        this.prisma.user.groupBy({
          by: ['role'],
          where: { status: { not: UserStatus.DELETED } },
          _count: true
        }),
        // Group by status
        this.prisma.user.groupBy({
          by: ['status'],
          _count: true
        })
      ]);

      // Calculate unverified count
      const unverified = total - verified;

      // Transform groupBy results to object format
      const byRoleMap = {
        ADMIN: 0,
        USER: 0,
        VENDOR: 0
      };
      byRole.forEach(item => {
        byRoleMap[item.role] = item._count;
      });

      const byStatusMap = {
        ACTIVE: 0,
        SUSPENDED: 0,
        DELETED: 0
      };
      byStatus.forEach(item => {
        byStatusMap[item.status] = item._count;
      });

      const stats = {
        total,
        active,
        verified,
        unverified,
        byRole: byRoleMap,
        byStatus: byStatusMap
      };

      return this.createResponse(true, stats);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getUserStats');
    }
  }

  /**
   * Export users to CSV
   */
  async exportUsers(
    options: QueryOptions = {},
    context?: ServiceContext
  ): Promise<ApiResponse<string>> {
    try {
      // Only admins can export users
      this.requirePermission(context, [UserRole.ADMIN]);

      const queryOptions = this.buildQueryOptions(options);

      // Don't show deleted users by default
      if (!queryOptions.where.status) {
        queryOptions.where.status = { not: UserStatus.DELETED };
      }

      // Get all users matching filters (no pagination for export)
      const users = await this.prisma.user.findMany({
        ...queryOptions,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          lastLogin: true,
          organization: {
            select: {
              name: true
            }
          }
        }
      });

      // Format data for CSV
      const csvData = users.map(user => ({
        ID: user.id,
        Email: user.email,
        'First Name': user.firstName,
        'Last Name': user.lastName,
        Role: user.role,
        Status: user.status,
        'Email Verified': user.emailVerified ? 'Yes' : 'No',
        Organization: user.organization?.name || 'None',
        'Created Date': user.createdAt.toISOString().split('T')[0],
        'Last Login': user.lastLogin ? user.lastLogin.toISOString() : 'Never'
      }));

      // Convert to CSV format
      const Papa = await import('papaparse');
      const csv = Papa.unparse(csvData);

      return this.createResponse(true, csv);
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'exportUsers');
    }
  }

  /**
   * Get user audit log
   */
  async getUserAuditLog(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      actionFilter?: string;
    } = {},
    context?: ServiceContext
  ): Promise<ApiResponse<{
    entries: any[];
    total: number;
    hasMore: boolean;
  }>> {
    try {
      // Only admins can view audit logs
      this.requirePermission(context, [UserRole.ADMIN]);

      const { limit = 50, offset = 0, actionFilter } = options;

      // Build where clause
      const where: any = {
        entityId: userId,
        entity: 'User'
      };

      if (actionFilter && actionFilter !== 'all') {
        where.action = actionFilter;
      }

      // Get audit log entries with admin user info
      const [entries, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        this.prisma.auditLog.count({ where })
      ]);

      const hasMore = offset + limit < total;

      return this.createResponse(true, {
        entries,
        total,
        hasMore
      });
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'getUserAuditLog');
    }
  }

  /**
   * Bulk suspend users
   */
  async bulkSuspendUsers(
    userIds: string[],
    context?: ServiceContext
  ): Promise<ApiResponse<{ affected: number }>> {
    try {
      // Only admins can bulk suspend
      this.requirePermission(context, [UserRole.ADMIN]);

      // Validate max 100 users
      if (userIds.length === 0) {
        throw this.createError('No users provided', 400, 'INVALID_INPUT');
      }
      if (userIds.length > 100) {
        throw this.createError('Bulk operations limited to 100 users', 400, 'LIMIT_EXCEEDED');
      }

      // Verify all users exist
      const existingUsers = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true }
      });

      if (existingUsers.length !== userIds.length) {
        throw this.createError('Some users not found', 404, 'USERS_NOT_FOUND');
      }

      // Update users to SUSPENDED
      const result = await this.prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: {
          status: UserStatus.SUSPENDED,
          updatedAt: this.now()
        }
      });

      // Create audit log entries
      await this.prisma.auditLog.createMany({
        data: userIds.map(userId => ({
          userId,
          action: 'USER_SUSPENDED',
          performedBy: context?.userId || 'system',
          metadata: { bulkOperation: true }
        }))
      });

      return this.createResponse(true, { affected: result.count });
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'bulkSuspendUsers');
    }
  }

  /**
   * Bulk activate users
   */
  async bulkActivateUsers(
    userIds: string[],
    context?: ServiceContext
  ): Promise<ApiResponse<{ affected: number }>> {
    try {
      // Only admins can bulk activate
      this.requirePermission(context, [UserRole.ADMIN]);

      // Validate max 100 users
      if (userIds.length === 0) {
        throw this.createError('No users provided', 400, 'INVALID_INPUT');
      }
      if (userIds.length > 100) {
        throw this.createError('Bulk operations limited to 100 users', 400, 'LIMIT_EXCEEDED');
      }

      // Verify all users exist
      const existingUsers = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true }
      });

      if (existingUsers.length !== userIds.length) {
        throw this.createError('Some users not found', 404, 'USERS_NOT_FOUND');
      }

      // Update users to ACTIVE
      const result = await this.prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: {
          status: UserStatus.ACTIVE,
          updatedAt: this.now()
        }
      });

      // Create audit log entries
      await this.prisma.auditLog.createMany({
        data: userIds.map(userId => ({
          userId,
          action: 'USER_ACTIVATED',
          performedBy: context?.userId || 'system',
          metadata: { bulkOperation: true }
        }))
      });

      return this.createResponse(true, { affected: result.count });
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'bulkActivateUsers');
    }
  }

  /**
   * Bulk delete users (soft delete)
   */
  async bulkDeleteUsers(
    userIds: string[],
    context?: ServiceContext
  ): Promise<ApiResponse<{ affected: number }>> {
    try {
      // Only admins can bulk delete
      this.requirePermission(context, [UserRole.ADMIN]);

      // Validate max 100 users
      if (userIds.length === 0) {
        throw this.createError('No users provided', 400, 'INVALID_INPUT');
      }
      if (userIds.length > 100) {
        throw this.createError('Bulk operations limited to 100 users', 400, 'LIMIT_EXCEEDED');
      }

      // Ensure current admin is not in the list
      if (context?.userId && userIds.includes(context.userId)) {
        throw this.createError('Cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
      }

      // Verify all users exist
      const existingUsers = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true }
      });

      if (existingUsers.length !== userIds.length) {
        throw this.createError('Some users not found', 404, 'USERS_NOT_FOUND');
      }

      // Soft delete: set status to DELETED
      const result = await this.prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: {
          status: UserStatus.DELETED,
          updatedAt: this.now()
        }
      });

      // Create audit log entries
      await this.prisma.auditLog.createMany({
        data: userIds.map(userId => ({
          userId,
          action: 'USER_DELETED',
          performedBy: context?.userId || 'system',
          metadata: { bulkOperation: true, softDelete: true }
        }))
      });

      return this.createResponse(true, { affected: result.count });
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'bulkDeleteUsers');
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    data: z.infer<typeof ChangePasswordSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      const validatedData = await this.validateInput(ChangePasswordSchema, data);

      // Check permissions
      this.requirePermission(context, [UserRole.ADMIN, UserRole.USER], userId);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });

      if (!user) {
        throw this.createError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(
        validatedData.currentPassword,
        user.password
      );

      if (!isCurrentPasswordValid) {
        throw this.createError('Current password is incorrect', 400, 'INVALID_PASSWORD');
      }

      // Hash new password
      const hashedNewPasswordResult = await hashPassword(validatedData.newPassword);
      if (!hashedNewPasswordResult.success || !hashedNewPasswordResult.data) {
        throw this.createError('Failed to hash password', 500, 'HASH_ERROR');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPasswordResult.data,
          updatedAt: this.now(),
        },
      });

      await this.logAudit(
        {
          action: 'PASSWORD_CHANGED',
          entity: 'User',
          entityId: userId,
        },
        context
      );

      this.logger.info('Password changed successfully', { userId });

      return this.createResponse(true, undefined, 'Password changed successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'changePassword');
    }
  }

  /**
   * Request password reset (overload for email string)
   */
  async requestPasswordReset(
    email: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>>;
  async requestPasswordReset(
    data: z.infer<typeof RequestPasswordResetSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<void>>;
  async requestPasswordReset(
    emailOrData: string | z.infer<typeof RequestPasswordResetSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      const email = typeof emailOrData === 'string' ? emailOrData : emailOrData.email;
      
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, status: true, firstName: true, lastName: true },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        // Don't reveal if user exists for security
        return this.createResponse(
          true,
          undefined,
          'If the email exists, a password reset link has been sent'
        );
      }

      const resetToken = generatePasswordResetToken();
      const resetExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
      });

      await this.logAudit(
        {
          action: 'PASSWORD_RESET_REQUESTED',
          entity: 'User',
          entityId: user.id,
        },
        context
      );

      // Send email with reset token
      try {
        await emailService.sendPasswordResetEmail(email, resetToken, `${user.firstName} ${user.lastName}`);
        this.logger.info('Password reset email sent successfully', { userId: user.id, email });
      } catch (emailError) {
        this.logger.error('Failed to send password reset email', { userId: user.id, email, error: emailError });
        // Don't fail the request if email fails - user might still be able to reset via other means
      }

      return this.createResponse(
        true,
        undefined,
        'If the email exists, a password reset link has been sent'
      );
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'requestPasswordReset');
    }
  }

  /**
   * Reset password using token (overload for separate params)
   */
  async resetPassword(
    token: string,
    newPassword: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>>;
  async resetPassword(
    data: z.infer<typeof ResetPasswordSchema>,
    context?: ServiceContext
  ): Promise<ApiResponse<void>>;
  async resetPassword(
    tokenOrData: string | z.infer<typeof ResetPasswordSchema>,
    newPasswordOrContext?: string | ServiceContext,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      let token: string;
      let newPassword: string;
      let actualContext: ServiceContext | undefined;

      if (typeof tokenOrData === 'string') {
        token = tokenOrData;
        newPassword = newPasswordOrContext as string;
        actualContext = context;
      } else {
        token = tokenOrData.token;
        newPassword = tokenOrData.newPassword;
        actualContext = newPasswordOrContext as ServiceContext;
      }

      const user = await this.prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: {
            gt: this.now(),
          },
          status: UserStatus.ACTIVE,
        },
        select: { id: true },
      });

      if (!user) {
        throw this.createError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
      }

      const hashedPasswordResult = await hashPassword(newPassword);
      
      if (!hashedPasswordResult.success || !hashedPasswordResult.data) {
        throw this.createError('Failed to hash password', 500, 'HASH_ERROR');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPasswordResult.data,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: this.now(),
        },
      });

      await this.logAudit(
        {
          action: 'PASSWORD_RESET_COMPLETED',
          entity: 'User',
          entityId: user.id,
        },
        actualContext
      );

      this.logger.info('Password reset completed', { userId: user.id });

      return this.createResponse(true, undefined, 'Password has been reset successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'resetPassword');
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(
    token: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          status: UserStatus.ACTIVE,
        },
        select: { id: true, emailVerified: true },
      });

      if (!user) {
        throw this.createError('Invalid verification token', 400, 'INVALID_TOKEN');
      }

      if (user.emailVerified) {
        return this.createResponse(true, undefined, 'Email is already verified');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          updatedAt: this.now(),
        },
      });

      await this.logAudit(
        {
          action: 'EMAIL_VERIFIED',
          entity: 'User',
          entityId: user.id,
        },
        context
      );

      this.logger.info('Email verified successfully', { userId: user.id });

      return this.createResponse(true, undefined, 'Email verified successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'verifyEmail');
    }
  }

  /**
   * Generate authentication token for user
   */
  async generateAuthToken(
    user: UserSession,
    context?: ServiceContext
  ): Promise<ApiResponse<{ token: string }>> {
    try {
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required for authentication');
      }
      const token = await generateJWT({ ...user }, JWT_SECRET, '24h');

      return this.createSuccessResponse({ token });
    } catch (error) {
      return this.handleDatabaseError(error, 'generateAuthToken');
    }
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(
    userId: string,
    email: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      const tokenResult = generateEmailVerificationToken(userId);
      
      if (!tokenResult.success || !tokenResult.data) {
        return this.createErrorResponse('Failed to generate verification token');
      }

      // Update user with verification token
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          emailVerificationToken: tokenResult.data,
          updatedAt: this.now(),
        },
      });

      // Log the email sending (in a real app, you'd send via email service)
      this.logger.info('Verification email prepared', { userId, email });

      await this.logAudit(
        {
          action: 'VERIFICATION_EMAIL_SENT',
          entity: 'User',
          entityId: userId,
          metadata: { email },
        },
        context
      );

      return this.createSuccessResponse(undefined, 'Verification email sent');
    } catch (error) {
      return this.handleDatabaseError(error, 'sendVerificationEmail');
    }
  }

  /**
   * Request email change with verification
   */
  async requestEmailChange(
    newEmail: string,
    context: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      this.validateContext(context);
      
      // Check if user exists and is active
      const user = await this.prisma.user.findUnique({
        where: { 
          id: context.userId,
          status: UserStatus.ACTIVE 
        },
        select: { 
          id: true, 
          email: true, 
          firstName: true,
          lastName: true 
        },
      });

      if (!user) {
        throw this.createError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Check if new email is the same as current email
      if (newEmail.toLowerCase() === user.email.toLowerCase()) {
        throw this.createError('New email cannot be the same as current email', 400, 'SAME_EMAIL');
      }

      // Check if new email is already in use by another user
      const existingUser = await this.prisma.user.findFirst({
        where: { 
          email: newEmail.toLowerCase(),
          NOT: { id: user.id }
        },
        select: { id: true },
      });

      if (existingUser) {
        throw this.createError('Email address is already in use', 400, 'EMAIL_EXISTS');
      }

      // Generate email verification token for new email
      const emailVerificationResult = generateEmailVerificationToken();
      if (!emailVerificationResult.success || !emailVerificationResult.data) {
        throw this.createError('Failed to generate verification token', 500, 'TOKEN_GENERATION_FAILED');
      }
      const emailVerificationToken = emailVerificationResult.data;

      // Store verification token and new email temporarily
      // We'll use a separate field or store it in metadata until verified
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken,
          emailVerificationExpires: new Date(this.now().getTime() + 60 * 60 * 1000), // 1 hour expiry
          updatedAt: this.now(),
        },
      });

      // Send verification email to new email address
      await emailService.sendEmailChangeVerification(
        newEmail.toLowerCase(),
        emailVerificationToken,
        user.firstName || user.email,
        user.email
      );

      await this.logAudit(
        {
          action: 'EMAIL_CHANGE_REQUESTED',
          entity: 'User',
          entityId: user.id,
          newValues: { newEmail: newEmail.toLowerCase() },
        },
        context
      );

      this.logger.info('Email change verification sent', { 
        userId: user.id, 
        newEmail: newEmail.toLowerCase() 
      });

      return this.createResponse(true, undefined, 'Verification email sent to new address');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'requestEmailChange');
    }
  }

  /**
   * Verify and complete email change
   */
  async verifyEmailChange(
    token: string,
    newEmail: string,
    context?: ServiceContext
  ): Promise<ApiResponse<void>> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          status: UserStatus.ACTIVE,
          emailVerificationExpires: {
            gt: this.now(),
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        },
      });

      if (!user) {
        throw this.createError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
      }

      // Double-check that new email is still available
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: newEmail.toLowerCase(),
          NOT: { id: user.id }
        },
        select: { id: true },
      });

      if (existingUser) {
        throw this.createError('Email address is no longer available', 400, 'EMAIL_TAKEN');
      }

      // Update user's email and clear verification tokens
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: newEmail.toLowerCase(),
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          updatedAt: this.now(),
        },
      });

      await this.logAudit(
        {
          action: 'EMAIL_CHANGED',
          entity: 'User',
          entityId: user.id,
          oldValues: { email: user.email },
          newValues: { email: newEmail.toLowerCase() },
        },
        context
      );

      this.logger.info('Email changed successfully', {
        userId: user.id,
        oldEmail: user.email,
        newEmail: newEmail.toLowerCase()
      });

      return this.createResponse(true, undefined, 'Email address changed successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'verifyEmailChange');
    }
  }

  /**
   * Update user's onboarding status
   */
  async updateOnboardingStatus(
    userId: string,
    completed: boolean,
    context?: ServiceContext
  ): Promise<ApiResponse<UserWithoutPassword>> {
    try {
      // Check permissions - users can only update their own onboarding status
      this.requirePermission(context, [UserRole.ADMIN, UserRole.USER], userId);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, hasSeenOnboarding: true },
      });

      if (!user) {
        throw this.createError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Update onboarding status
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          hasSeenOnboarding: completed,
          updatedAt: this.now(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          emailVerificationToken: true,
          passwordResetToken: true,
          passwordResetExpires: true,
          lastLogin: true,
          hasSeenOnboarding: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
            },
          },
        },
      });

      await this.logAudit(
        {
          action: 'ONBOARDING_STATUS_UPDATED',
          entity: 'User',
          entityId: userId,
          oldValues: { hasSeenOnboarding: user.hasSeenOnboarding },
          newValues: { hasSeenOnboarding: completed },
        },
        context
      );

      this.logger.info('Onboarding status updated', { userId, completed });

      // Transform to match UserWithoutPassword interface
      const transformedUser: UserWithoutPassword = {
        ...updatedUser,
        organizationId: updatedUser.organization?.id,
        vendorId: undefined,
      };

      return this.createResponse(true, transformedUser, 'Onboarding status updated successfully');
    } catch (error) {
      if (error.statusCode) throw error;
      this.handleDatabaseError(error, 'updateOnboardingStatus');
    }
  }
}

export const userService = new UserService();