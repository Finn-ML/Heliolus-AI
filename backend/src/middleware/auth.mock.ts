/**
 * Mock Authentication Middleware for Development
 * Provides stub authentication for testing API functionality
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types/database';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../lib/auth/secret.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  vendorId?: string;
  emailVerified: boolean;
  iat?: number;
  exp?: number;
}

// Extend FastifyRequest to include authenticated user
declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: AuthenticatedUser;
  }
}

/**
 * Authentication middleware - decodes JWT tokens or provides mock auth
 */
export async function authenticationMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      message: 'Missing or invalid authorization header',
      code: 'UNAUTHORIZED',
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Try to decode JWT token
    const JWT_SECRET = getJwtSecret();
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Set authenticated user from token
    // Support both 'id' and 'userId' field names
    const user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role || UserRole.USER,
      organizationId: decoded.organizationId,
      emailVerified: decoded.emailVerified || true,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    request.currentUser = user;
    // Also set request.user for compatibility with premium tier middleware
    (request as any).user = user;
  } catch (error) {
    // If JWT decode fails, return unauthorized
    reply.status(401).send({
      message: 'Invalid or expired token',
      code: 'TOKEN_INVALID',
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
    return;
  }
}

/**
 * Mock optional authentication middleware
 */
export async function optionalAuthenticationMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Optional authentication - set user if needed
  if (request.headers.authorization) {
    await authenticationMiddleware(request, reply);
  }
}

/**
 * Mock role requirement middleware
 */
export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.currentUser) {
      reply.status(401).send({
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    // Mock role check - always pass
  };
}

/**
 * Mock ownership requirement middleware
 */
export function requireOwnership(resourceOwnerIdExtractor?: (request: FastifyRequest) => string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.currentUser) {
      reply.status(401).send({
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    // Mock ownership check - always pass
  };
}

/**
 * Mock organization requirement middleware
 */
export function requireOrganization() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.currentUser) {
      reply.status(401).send({
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    // Mock organization check - always pass
  };
}

/**
 * Mock vendor requirement middleware
 */
export function requireVendor() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.currentUser) {
      reply.status(401).send({
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    // Mock vendor check - always pass
  };
}