/**
 * Authentication Routes - Simplified Version
 * Handles basic authentication endpoints for testing
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UserRole } from '../types/database';
import { asyncHandler, authenticationMiddleware } from '../middleware';
import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { emailService } from '../services/email.service';
import { userService } from '../services/user.service';
import { isEmailDomainBlocked, getBlockedDomainErrorMessage } from '../config/blocked-email-domains';

// Request/Response schemas matching the contract tests
// JSON Schema definitions for Fastify validation
const LoginRequestSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 1 },
  },
};

const RegisterRequestSchema = {
  type: 'object',
  required: ['email', 'password', 'firstName', 'lastName', 'organizationName'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
    firstName: { type: 'string', minLength: 1 },
    lastName: { type: 'string', minLength: 1 },
    organizationName: { type: 'string', minLength: 1 },
  },
};

const VerifyEmailSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    token: { type: 'string', minLength: 1 },
  },
};

const SendVerificationSchema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email' },
  },
};

const ForgotPasswordSchema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email' },
  },
};

const ResetPasswordSchema = {
  type: 'object',
  required: ['token', 'newPassword'],
  properties: {
    token: { type: 'string', minLength: 1 },
    newPassword: { type: 'string', minLength: 8 },
  },
};

const AuthResponseSchema = {
  type: 'object',
  properties: {
    token: { type: 'string' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string' },
        emailVerified: { type: 'boolean' },
        createdAt: { type: 'string' },
        hasSeenOnboarding: { type: 'boolean' },
      },
    },
  },
};

const MessageResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
  },
};

type LoginRequest = {
  email: string;
  password: string;
};

type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
};

type VerifyEmailRequest = {
  token: string;
};

type SendVerificationRequest = {
  email: string;
};

// Initialize Prisma Client
const prisma = new PrismaClient();

// JWT secret - use from env or default for development
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for authentication');
}

export default async function authRoutes(server: FastifyInstance) {
  
  // POST /auth/register
  server.post('/register', {
    schema: {
      description: 'Register new user and organization',
      tags: ['Authentication'],
      body: RegisterRequestSchema,
      response: {
        201: AuthResponseSchema,
        409: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            details: { type: 'object' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password, firstName, lastName, organizationName } = request.body as RegisterRequest;

    try {
      // Check if email domain is blocked (free/personal email providers)
      if (isEmailDomainBlocked(email)) {
        reply.status(400).send({
          message: getBlockedDomainErrorMessage(email),
          code: 'BLOCKED_EMAIL_DOMAIN',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        reply.status(409).send({
          message: 'Email already registered',
          code: 'EMAIL_EXISTS',
          statusCode: 409,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Generate email verification token with expiration (24 hours)
      const verificationToken = `verify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user and organization in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user first
        const user = await tx.user.create({
          data: {
            email,
            firstName,
            lastName,
            password: hashedPassword,
            role: UserRole.USER,
            emailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
          }
        });

        // Create organization with user reference
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            country: 'Unknown', // Required field - will be updated during onboarding
            userId: user.id,
          }
        });

        return { user, organization };
      });

      // Send verification email (async, don't block response)
      emailService.sendVerificationEmail(email, verificationToken, `${firstName} ${lastName}`)
        .catch(error => {
          request.log.error({ error, email }, 'Failed to send verification email');
        });

      // Generate JWT token
      const token = jwt.sign(
        {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          organizationId: result.organization.id,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      reply.status(201).send({
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          emailVerified: result.user.emailVerified,
          createdAt: result.user.createdAt.toISOString(),
          hasSeenOnboarding: result.user.hasSeenOnboarding,
        },
      });

    } catch (error) {
      request.log.error({ error, email }, 'Registration failed');
      reply.status(400).send({
        message: 'Registration failed',
        code: 'REGISTRATION_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /auth/login
  server.post('/login', {
    schema: {
      description: 'Authenticate user and return JWT token',
      tags: ['Authentication'],
      body: LoginRequestSchema,
      response: {
        200: AuthResponseSchema,
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            details: { type: 'object' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as LoginRequest;

    try {
      // Find user in database (case-insensitive email lookup)
      const user = await prisma.user.findFirst({
        where: { 
          email: {
            equals: email,
            mode: 'insensitive'
          }
        },
        include: {
          organization: true,
          subscription: true,
        }
      });

      if (!user) {
        reply.status(401).send({
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        reply.status(401).send({
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Update lastLogin timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // DEBUG: Log organization data
      console.log('[AUTH LOGIN] User:', user.email);
      console.log('[AUTH LOGIN] Organization:', user.organization);
      console.log('[AUTH LOGIN] Organization ID:', user.organization?.id);

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organization?.id,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // DEBUG: Decode token to verify
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log('[AUTH LOGIN] Token payload:', decoded);

      reply.status(200).send({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
          hasSeenOnboarding: user.hasSeenOnboarding,
          organization: user.organization ? {
            id: user.organization.id,
            name: user.organization.name,
          } : null,
        },
      });

    } catch (error) {
      request.log.error({ error, email }, 'Login failed');
      reply.status(401).send({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /auth/verify-email
  server.post('/verify-email', {
    schema: {
      description: 'Verify user email with token',
      tags: ['Authentication'],
      body: VerifyEmailSchema,
      response: {
        200: MessageResponseSchema,
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.body as VerifyEmailRequest;

    try {
      // Find user by verification token
      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          emailVerified: false,
          emailVerificationExpires: {
            gt: new Date(), // Token must not be expired
          },
        }
      });

      if (!user) {
        reply.status(400).send({
          message: 'Invalid or expired verification token',
          code: 'INVALID_TOKEN',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (user.emailVerified) {
        reply.status(200).send({
          message: 'Email is already verified',
        });
        return;
      }

      // Update user verification status
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        }
      });

      // Send welcome email (async, don't block response)
      emailService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`)
        .catch(error => {
          request.log.error({ error, email: user.email }, 'Failed to send welcome email');
        });

      reply.status(200).send({
        message: 'Email verified successfully',
      });

    } catch (error) {
      request.log.error({ error }, 'Email verification failed');
      reply.status(400).send({
        message: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /auth/__debug/verification-token - Debug route for tests only
  server.get('/__debug/verification-token', {
    schema: {
      description: 'Get verification token for testing (test environment only)',
      tags: ['Debug'],
      querystring: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            verificationToken: { type: 'string' },
            email: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        403: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    // Only allow in test environment
    if (process.env.NODE_ENV !== 'test') {
      reply.status(403).send({
        message: 'Debug endpoints only available in test environment',
        code: 'FORBIDDEN',
        statusCode: 403,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { email } = request.query as { email: string };

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        emailVerificationToken: true,
      }
    });

    if (!user || !user.emailVerificationToken) {
      reply.status(404).send({
        message: 'User not found or no verification token available',
        code: 'NOT_FOUND',
        statusCode: 404,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    reply.status(200).send({
      verificationToken: user.emailVerificationToken,
      email: user.email,
    });
  }));

  // POST /auth/send-verification - Send verification email
  server.post('/send-verification', {
    schema: {
      description: 'Send verification email to user',
      tags: ['Authentication'],
      body: SendVerificationSchema,
      response: {
        200: MessageResponseSchema,
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        429: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = request.body as SendVerificationRequest;

    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
          emailVerificationToken: true,
          emailVerificationExpires: true,
        }
      });

      if (!user) {
        reply.status(400).send({
          message: 'No user found with this email address',
          code: 'USER_NOT_FOUND',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (user.emailVerified) {
        reply.status(400).send({
          message: 'Email is already verified',
          code: 'EMAIL_ALREADY_VERIFIED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Generate new verification token with expiration
      const verificationToken = `verify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
        }
      });

      // Send verification email
      try {
        await emailService.sendVerificationEmail(
          user.email, 
          verificationToken, 
          `${user.firstName} ${user.lastName}`
        );

        reply.status(200).send({
          message: 'Verification email sent successfully',
        });
      } catch (emailError: any) {
        request.log.error({ error: emailError, email }, 'Failed to send verification email');
        
        // Check if it's a rate limit error
        if (emailError.code === 'RATE_LIMITED') {
          reply.status(429).send({
            message: emailError.message,
            code: 'RATE_LIMITED',
            statusCode: 429,
            timestamp: new Date().toISOString(),
          });
          return;
        }

        // Generic email sending error
        reply.status(400).send({
          message: 'Failed to send verification email. Please try again later.',
          code: 'EMAIL_SEND_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error) {
      request.log.error({ error, email }, 'Send verification email failed');
      reply.status(400).send({
        message: 'Failed to send verification email',
        code: 'SEND_VERIFICATION_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /auth/dev-admin-token - Development-only admin token endpoint
  server.post('/dev-admin-token', {
    schema: {
      description: 'Get admin token for development (development environment only)',
      tags: ['Development'],
      body: {
        type: 'object',
        required: ['devPassword'],
        properties: {
          devPassword: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
              },
            },
          },
        },
        403: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      reply.status(403).send({
        success: false,
        message: 'Dev admin token endpoint only available in development environment',
        code: 'FORBIDDEN',
        statusCode: 403,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { devPassword } = request.body as { devPassword: string };

    // Get dev password from environment variable
    const expectedDevPassword = process.env.DEV_ADMIN_PASSWORD;
    if (!expectedDevPassword) {
      reply.status(500).send({
        success: false,
        message: 'Dev admin password not configured',
        code: 'CONFIG_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (devPassword !== expectedDevPassword) {
      reply.status(403).send({
        success: false,
        message: 'Invalid dev password',
        code: 'FORBIDDEN',
        statusCode: 403,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generate admin JWT token
    const adminToken = jwt.sign(
      {
        id: 'dev-admin-id',
        email: 'admin@example.com',
        firstName: 'Dev',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        organizationId: null,
        emailVerified: true,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    reply.status(200).send({
      success: true,
      data: {
        token: adminToken,
      },
    });
  }));

  // PUT /auth/profile - Update user profile
  server.put('/profile', {
    schema: {
      description: 'Update user profile information',
      tags: ['Authentication'],
      body: {
        type: 'object',
        properties: {
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          company: { type: 'string' },
          jobTitle: { type: 'string' },
          phone: { type: 'string' },
          bio: { type: 'string' },
          timezone: { type: 'string' },
          emailNotifications: { type: 'boolean' },
          pushNotifications: { type: 'boolean' },
          marketingEmails: { type: 'boolean' },
          twoFactorAuth: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' },
                emailVerified: { type: 'boolean' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    // Simple token extraction from Authorization header
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

    const token = authHeader.substring(7);
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.id;

      // Get profile update data
      const profileData = request.body as any;

      // Check if email is being updated and ensure uniqueness
      if (profileData.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: profileData.email,
            NOT: { id: userId }
          }
        });
        
        if (existingUser) {
          reply.status(400).send({
            message: 'Email already in use',
            code: 'EMAIL_EXISTS',
            statusCode: 400,
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      // Update user in database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          company: profileData.company,
          jobTitle: profileData.jobTitle,
          phone: profileData.phone,
          bio: profileData.bio,
          timezone: profileData.timezone,
          emailNotifications: profileData.emailNotifications,
          pushNotifications: profileData.pushNotifications,
          marketingEmails: profileData.marketingEmails,
          twoFactorAuth: profileData.twoFactorAuth,
        },
      });

      reply.status(200).send({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          emailVerified: updatedUser.emailVerified,
          createdAt: updatedUser.createdAt.toISOString(),
        },
      });

    } catch (error) {
      request.log.error({ error }, 'Profile update failed');
      reply.status(401).send({
        message: 'Invalid token',
        code: 'UNAUTHORIZED',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // GET /auth/me - Simple version without authentication middleware
  server.get('/me', {
    schema: {
      description: 'Get current user profile',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            emailVerified: { type: 'boolean' },
            createdAt: { type: 'string' },
            hasSeenOnboarding: { type: 'boolean' },
          },
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    // Simple token extraction from Authorization header
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
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.id;

      // Find user by ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          hasSeenOnboarding: true,
        }
      });

      if (!user) {
        reply.status(401).send({
          message: 'Invalid token',
          code: 'UNAUTHORIZED',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(200).send({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        hasSeenOnboarding: user.hasSeenOnboarding,
      });

    } catch (error) {
      request.log.error({ error }, 'Token verification failed');
      reply.status(401).send({
        message: 'Invalid token',
        code: 'UNAUTHORIZED',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /auth/change-password - Change user password
  server.post('/change-password', {
    schema: {
      description: 'Change user password',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1 },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    // Extract token from Authorization header
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
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.id;

      const { currentPassword, newPassword } = request.body as {
        currentPassword: string;
        newPassword: string;
      };

      // Find user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          password: true,
        }
      });

      if (!user) {
        reply.status(401).send({
          message: 'Invalid token',
          code: 'UNAUTHORIZED',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        reply.status(400).send({
          message: 'Current password is incorrect',
          code: 'INVALID_PASSWORD',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
        }
      });

      reply.status(200).send({
        message: 'Password updated successfully',
      });

    } catch (error) {
      request.log.error({ error }, 'Password change failed');
      reply.status(401).send({
        message: 'Invalid token',
        code: 'UNAUTHORIZED',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /auth/forgot-password - Request password reset
  server.post('/forgot-password', {
    schema: {
      description: 'Request password reset email',
      tags: ['Authentication'],
      body: ForgotPasswordSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = request.body as { email: string };

    try {
      const result = await userService.requestPasswordReset(email);
      
      reply.status(200).send({
        message: result.message,
      });
    } catch (error) {
      request.log.error({ error, email }, 'Password reset request failed');
      reply.status(400).send({
        message: 'Failed to process password reset request',
        code: 'RESET_REQUEST_FAILED',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /auth/reset-password - Reset password with token
  server.post('/reset-password', {
    schema: {
      description: 'Reset password using token from email',
      tags: ['Authentication'],
      body: ResetPasswordSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, newPassword } = request.body as { token: string; newPassword: string };

    try {
      const result = await userService.resetPassword(token, newPassword);
      
      reply.status(200).send({
        message: result.message,
      });
    } catch (error: any) {
      request.log.error({ error, token: token.substring(0, 10) + '...' }, 'Password reset failed');
      
      const statusCode = error.statusCode || 400;
      const code = error.code || 'RESET_FAILED';
      
      reply.status(statusCode).send({
        message: error.message || 'Failed to reset password',
        code,
        statusCode,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /auth/request-email-change - Request email address change with verification
  server.post('/request-email-change', {
    preHandler: authenticationMiddleware,
    schema: {
      description: 'Request to change email address with verification',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['newEmail'],
        properties: {
          newEmail: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: MessageResponseSchema,
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { newEmail } = request.body as { newEmail: string };

    try {
      // Get the authenticated user context from JWT token
      const userPayload = request.currentUser; // Auth middleware adds currentUser to request
      
      if (!userPayload || !userPayload.id) {
        reply.status(401).send({
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create service context from authenticated user
      const context = {
        userId: userPayload.id,
        userRole: userPayload.role,
        organizationId: userPayload.organizationId,
        ip: request.ip,
        userAgent: request.headers['user-agent'] || '',
      };

      const result = await userService.requestEmailChange(newEmail, context);
      
      reply.status(200).send({
        message: result.message,
      });
    } catch (error: any) {
      request.log.error({ error, newEmail: newEmail.substring(0, 3) + '***' }, 'Email change request failed');
      
      const statusCode = error.statusCode || 400;
      const code = error.code || 'EMAIL_CHANGE_REQUEST_FAILED';
      
      reply.status(statusCode).send({
        message: error.message || 'Failed to request email change',
        code,
        statusCode,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /auth/verify-email-change - Verify email change with token
  server.post('/verify-email-change', {
    schema: {
      description: 'Verify email change with verification token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['token', 'newEmail'],
        properties: {
          token: { type: 'string', minLength: 1 },
          newEmail: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: MessageResponseSchema,
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, newEmail } = request.body as { token: string; newEmail: string };

    try {
      const result = await userService.verifyEmailChange(token, newEmail);
      
      reply.status(200).send({
        message: result.message,
      });
    } catch (error: any) {
      request.log.error({ error, token: token.substring(0, 10) + '...', newEmail: newEmail.substring(0, 3) + '***' }, 'Email change verification failed');
      
      const statusCode = error.statusCode || 400;
      const code = error.code || 'EMAIL_CHANGE_VERIFICATION_FAILED';
      
      reply.status(statusCode).send({
        message: error.message || 'Failed to verify email change',
        code,
        statusCode,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // POST /auth/test-all-emails - Test all email templates (development only)
  server.post('/test-all-emails', {
    schema: {
      description: 'Send all available email templates to test email address',
      tags: ['Authentication', 'Testing'],
      body: {
        type: 'object',
        required: ['testEmail'],
        properties: {
          testEmail: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            emailsSent: {
              type: 'array',
              items: { type: 'string' }
            },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { testEmail } = request.body as { testEmail: string };

    try {
      const emailsSent: string[] = [];

      // 1. Verification Email (registration)
      const verificationToken = `verify_${Date.now()}_test`;
      await emailService.sendVerificationEmail(testEmail, verificationToken, 'Test User');
      emailsSent.push('Verification Email (Registration)');

      // 2. Welcome Email
      await emailService.sendWelcomeEmail(testEmail, 'Test User');
      emailsSent.push('Welcome Email');

      // 3. Password Reset Email
      const resetToken = `password_reset_${Date.now()}_test`;
      await emailService.sendPasswordResetEmail(testEmail, resetToken, 'Test User');
      emailsSent.push('Password Reset Email');

      // 4. Email Change Verification
      const changeToken = `email_change_${Date.now()}_test`;
      await emailService.sendEmailChangeVerification(testEmail, changeToken, 'Test User', 'old-email@example.com');
      emailsSent.push('Email Change Verification');

      // 5. Assessment Completion Email
      await emailService.sendAssessmentCompletionEmail(testEmail, 'Test User', 'Financial Crime Risk Assessment');
      emailsSent.push('Assessment Completion Email');

      // 6. Account Status Change Email - Active
      await emailService.sendAccountStatusChangeEmail(testEmail, 'Test User', 'ACTIVE');
      emailsSent.push('Account Status Change Email (Active)');

      // 7. Account Status Change Email - Suspended
      await emailService.sendAccountStatusChangeEmail(testEmail, 'Test User', 'SUSPENDED');
      emailsSent.push('Account Status Change Email (Suspended)');

      request.log.info(`All email templates sent to: ${testEmail}`);

      reply.status(200).send({
        message: `Successfully sent ${emailsSent.length} test emails to ${testEmail}`,
        emailsSent,
      });
    } catch (error: any) {
      request.log.error({ error, testEmail }, 'Failed to send test emails');

      reply.status(500).send({
        message: error.message || 'Failed to send test emails',
        code: 'TEST_EMAILS_FAILED',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      });
    }
  }));

  // PATCH /users/me/onboarding - Update user onboarding status
  server.patch('/users/me/onboarding', {
    preHandler: authenticationMiddleware,
    schema: {
      description: 'Update onboarding tour completion status for current user',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['completed'],
        properties: {
          completed: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' },
                hasSeenOnboarding: { type: 'boolean' },
              },
            },
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { completed } = request.body as { completed: boolean };

    try {
      // Get the authenticated user context from JWT token
      const userPayload = request.currentUser; // Auth middleware adds currentUser to request

      if (!userPayload || !userPayload.id) {
        reply.status(401).send({
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create service context from authenticated user
      const context = {
        userId: userPayload.id,
        userRole: userPayload.role,
        organizationId: userPayload.organizationId,
        ip: request.ip,
        userAgent: request.headers['user-agent'] || '',
      };

      const result = await userService.updateOnboardingStatus(userPayload.id, completed, context);

      if (!result.success) {
        reply.status(400).send({
          message: result.message || 'Failed to update onboarding status',
          code: 'UPDATE_FAILED',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      reply.status(200).send(result);
    } catch (error: any) {
      request.log.error({ error }, 'Onboarding status update failed');

      const statusCode = error.statusCode || 400;
      const code = error.code || 'UPDATE_FAILED';

      reply.status(statusCode).send({
        message: error.message || 'Failed to update onboarding status',
        code,
        statusCode,
        timestamp: new Date().toISOString(),
      });
    }
  }));
}