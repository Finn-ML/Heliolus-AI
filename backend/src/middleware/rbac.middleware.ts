/**
 * Role-Based Access Control (RBAC) Middleware
 * Handles authorization based on user roles
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types/database';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organizationId?: string;
  };
}

/**
 * Check if user has required role(s)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      // Support both Fastify-JWT (request.user) and current mock auth (request.currentUser)
      const authUser: any = (request as any).user ?? (request as any).currentUser;

      // Check if user is authenticated
      if (!authUser) {
        return reply.code(401).send({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(authUser.role)) {
        return reply.code(403).send({
          success: false,
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
          requiredRoles: allowedRoles,
          userRole: authUser.role
        });
      }
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Authorization check failed',
        code: 'AUTH_ERROR'
      });
    }
  };
}

/**
 * Check if user owns the resource or is admin
 */
export function requireOwnershipOrAdmin(getResourceOwnerId: (request: AuthenticatedRequest) => Promise<string | null>) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const authUser: any = (request as any).user ?? (request as any).currentUser;
      if (!authUser) {
        return reply.code(401).send({
          success: false,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Admins can access everything
      if (authUser.role === UserRole.ADMIN) {
        return;
      }

      // Check ownership
      const ownerId = await getResourceOwnerId(request);
      if (!ownerId || ownerId !== authUser.id) {
        return reply.code(403).send({
          success: false,
          message: 'Access denied',
          code: 'FORBIDDEN'
        });
      }
    } catch (error) {
      return reply.code(500).send({
        success: false,
        message: 'Authorization check failed',
        code: 'AUTH_ERROR'
      });
    }
  };
}

/**
 * Role-based feature access
 */
export const FEATURE_PERMISSIONS = {
  // Assessment features
  CREATE_ASSESSMENT: [UserRole.USER, UserRole.ADMIN],
  VIEW_ASSESSMENT: [UserRole.USER, UserRole.ADMIN],
  DELETE_ASSESSMENT: [UserRole.ADMIN],

  // Vendor features
  VIEW_VENDORS: [UserRole.USER, UserRole.ADMIN, UserRole.VENDOR],
  MANAGE_VENDORS: [UserRole.ADMIN],
  VENDOR_SELF_MANAGE: [UserRole.VENDOR],

  // Admin features
  VIEW_ANALYTICS: [UserRole.ADMIN],
  MANAGE_USERS: [UserRole.ADMIN],
  MANAGE_TEMPLATES: [UserRole.ADMIN],
  VIEW_REVENUE: [UserRole.ADMIN],
  MANAGE_CREDITS: [UserRole.ADMIN],

  // Report features
  VIEW_REPORT: [UserRole.USER, UserRole.ADMIN],
  DOWNLOAD_REPORT: [UserRole.USER, UserRole.ADMIN], // Premium feature check separate
  SHARE_REPORT: [UserRole.USER, UserRole.ADMIN],

  // Subscription features
  MANAGE_SUBSCRIPTION: [UserRole.USER, UserRole.ADMIN],
  VIEW_BILLING: [UserRole.USER, UserRole.ADMIN],
};

/**
 * Check if user has permission for a specific feature
 */
export function requireFeature(feature: keyof typeof FEATURE_PERMISSIONS) {
  return requireRole(...FEATURE_PERMISSIONS[feature]);
}

/**
 * Get user permissions based on role
 */
export function getUserPermissions(role: UserRole): string[] {
  const permissions: string[] = [];

  for (const [feature, roles] of Object.entries(FEATURE_PERMISSIONS)) {
    if (roles.includes(role)) {
      permissions.push(feature);
    }
  }

  return permissions;
}

/**
 * Check if user has premium subscription
 */
export async function requirePremium(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const authUser: any = (request as any).user ?? (request as any).currentUser;
    if (!authUser) {
      return reply.code(401).send({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admins have access to all premium features
    if (authUser.role === UserRole.ADMIN) {
      return;
    }

    // Check user's subscription status
    // TODO: Implement subscription check from database
    const hasPremium = false; // Placeholder - implement actual check

    if (!hasPremium) {
      return reply.code(402).send({
        success: false,
        message: 'Premium subscription required',
        code: 'PAYMENT_REQUIRED',
        upgradeUrl: '/pricing'
      });
    }
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'Subscription check failed',
      code: 'SUBSCRIPTION_ERROR'
    });
  }
}
