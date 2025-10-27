/**
 * Fastify Server Setup
 * Production-ready server with all middleware, routes, and error handling
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import cookie from 'fastify-cookie';

import { initializeServices, cleanupServices } from './services';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { loggingMiddleware, authenticationMiddleware } from './middleware';
import { anonymousSessionMiddleware } from './middleware/anonymous-session.middleware';
import { geoblockingMiddleware } from './middleware/geoblocking.middleware';

// Declare server decorations
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// Route imports
import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import organizationRoutes from './routes/organization.routes';
import assessmentRoutes from './routes/assessment.routes';
import vendorRoutes from './routes/vendor.routes';
import subscriptionRoutes from './routes/subscription.routes';
import webhookRoutes from './routes/webhook.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';
import templateRoutes from './routes/template.routes';
import anonymousRoutes from './routes/anonymous.routes';
import claimRoutes from './routes/claim.routes';
import rfpRoutes from './routes/rfp.routes';

export interface AppConfig {
  port: number;
  host: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string | boolean;
  };
  rateLimit: {
    max: number;
    timeWindow: string;
  };
  swagger: {
    enabled: boolean;
  };
}

export async function createServer(config: AppConfig): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      // Simplified logger for testing
      /*transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        }
      } : undefined,*/
    },
    bodyLimit: 10 * 1024 * 1024, // 10MB
    trustProxy: process.env.NODE_ENV === 'production',
  });

  console.log('Debug: Setting up plugins...');
  await setupPlugins(server, config);

  console.log('Debug: Setting up middleware...');
  await setupMiddleware(server);

  console.log('Debug: Setting up error handling...');
  await setupErrorHandling(server);

  console.log('Debug: Setting up routes...');
  await setupRoutes(server);

  console.log('Debug: Server setup complete');

  return server;
}

async function setupPlugins(server: FastifyInstance, config: AppConfig): Promise<void> {
  // CORS - More explicit configuration for Replit environment
  await server.register(cors, {
    origin: (origin, cb) => {
      // Allow all origins in development/Replit environment
      // This handles both same-origin and cross-origin requests
      cb(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Cookie support
  await server.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'heliolus-super-secret-cookie-key',
  });

  // Multipart/form-data support for file uploads
  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 10, // Max 10 files per request
    },
  });

  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    skipOnError: true,
    keyGenerator: (request: FastifyRequest) => {
      // Use user ID if authenticated, otherwise IP
      const user = (request as FastifyRequest & { user?: { id: string } }).user;
      return user?.id || request.ip;
    },
    errorResponseBuilder: (request: FastifyRequest, context: { ttl: number }) => ({
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
      statusCode: 429,
    }),
  });

  // JWT - temporarily disabled due to version compatibility
  /*
  await server.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });
  */

  // Swagger documentation
  if (config.swagger.enabled) {
    await server.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'Heliolus Platform API',
          description: 'Comprehensive compliance and risk management platform API',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'http://localhost:3001',
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    });

    await server.register(swaggerUI, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      staticCSP: true,
      transformSpecification: (swaggerObject: any, request: FastifyRequest, reply: FastifyReply) => {
        return swaggerObject;
      },
      transformSpecificationClone: true,
    });
  }
}

async function setupMiddleware(server: FastifyInstance): Promise<void> {
  // Request logging (first - logs all requests)
  server.addHook('onRequest', loggingMiddleware);

  // Geoblocking (before authentication - blocks sanctioned countries early)
  server.addHook('preHandler', geoblockingMiddleware);

  // Anonymous session middleware (will be applied per route if needed)

  // Authentication middleware (will be applied per route)
  server.decorate('authenticate', authenticationMiddleware);
}

async function setupRoutes(server: FastifyInstance): Promise<void> {
  // Health check
  server.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  });

  // Register API routes with /v1 prefix
  await server.register(async function (server) {
    await server.register(authRoutes, { prefix: '/auth' });
    await server.register(documentRoutes, { prefix: '/documents' });
    await server.register(organizationRoutes, { prefix: '/organizations' });
    await server.register(assessmentRoutes, { prefix: '/assessments' });
    await server.register(vendorRoutes, { prefix: '/vendors' });
    await server.register(subscriptionRoutes, { prefix: '/subscriptions' });
    await server.register(webhookRoutes, { prefix: '/webhooks' });
    await server.register(adminRoutes, { prefix: '/admin' });
    await server.register(userRoutes, { prefix: '/user' });
    await server.register(rfpRoutes);

    // Create single Prisma client instance for anonymous and claim routes
    const { PrismaClient } = await import('./generated/prisma/index.js');
    const prisma = new PrismaClient();
    
    // Register anonymous routes with middleware in the same scope
    await server.register(async function (server) {
      // Register middleware first within this scope
      await server.register(anonymousSessionMiddleware, {
        secret: process.env.COOKIE_SECRET || 'heliolus-super-secret-cookie-key',
        prisma
      });
      
      // Then register routes
      await server.register(anonymousRoutes, { prisma });
      await server.register(claimRoutes, { prisma });
    }, { prefix: '/anon' });

    // Templates: prefer DB-backed routes if enabled; fallback to mocks for compatibility
    const useDbTemplates = process.env.USE_DB_TEMPLATES === 'true';
    if (useDbTemplates) {
      await server.register(templateRoutes, { prefix: '/templates' });
    } else {
      // Direct template routes for frontend compatibility (mock data)
      const MOCK_TEMPLATES = [
      {
        id: 'template_001',
        name: 'Financial Crime Assessment',
        slug: 'financial-crime-assessment',
        category: 'FINANCIAL_CRIME',
        description: 'Comprehensive assessment for financial crime compliance and AML procedures',
        version: '1.0',
        isActive: true,
        estimatedMinutes: 45,
        totalQuestions: 25,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'template_002',
        name: 'Trade Compliance Assessment',
        slug: 'trade-compliance-assessment',
        category: 'TRADE_COMPLIANCE',
        description: 'Assessment for international trade compliance and export controls',
        version: '1.0',
        isActive: true,
        estimatedMinutes: 35,
        totalQuestions: 20,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'template_003',
        name: 'Data Privacy Assessment',
        slug: 'data-privacy-assessment',
        category: 'DATA_PRIVACY',
        description: 'GDPR and data privacy compliance assessment',
        version: '1.0',
        isActive: true,
        estimatedMinutes: 30,
        totalQuestions: 18,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'template_004',
        name: 'Cybersecurity Assessment',
        slug: 'cybersecurity-assessment',
        category: 'CYBERSECURITY',
        description: 'Comprehensive cybersecurity risk and compliance assessment',
        version: '1.0',
        isActive: true,
        estimatedMinutes: 40,
        totalQuestions: 22,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'template_005',
        name: 'ESG Compliance Assessment',
        slug: 'esg-compliance-assessment',
        category: 'ESG',
        description: 'Environmental, Social and Governance compliance assessment',
        version: '1.0',
        isActive: true,
        estimatedMinutes: 50,
        totalQuestions: 28,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
      ];

      // GET /templates - List all templates (mock)
      server.get('/templates', async (request: FastifyRequest<{
        Querystring: {
          category?: string;
          active?: boolean;
          search?: string
        }
      }>, reply: FastifyReply) => {
        try {
          let filteredTemplates = [...MOCK_TEMPLATES];

          if (request.query.category) {
            filteredTemplates = filteredTemplates.filter(
              template => template.category === request.query.category
            );
          }

          if (request.query.active !== undefined) {
            filteredTemplates = filteredTemplates.filter(
              template => template.isActive === request.query.active
            );
          }

          if (request.query.search) {
            const searchTerm = request.query.search.toLowerCase();
            filteredTemplates = filteredTemplates.filter(
              template =>
                template.name.toLowerCase().includes(searchTerm) ||
                template.description.toLowerCase().includes(searchTerm)
            );
          }

          reply.code(200).send({
            success: true,
            data: filteredTemplates
          });
        } catch (error: any) {
          reply.code(500).send({
            success: false,
            message: 'Failed to fetch templates',
            error: error.message
          });
        }
      });

      // GET /templates/:id - Get specific template (mock)
      server.get('/templates/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
          const template = MOCK_TEMPLATES.find(t => t.id === request.params.id);

          if (!template) {
            reply.code(404).send({
              success: false,
              message: 'Template not found'
            });
            return;
          }

          reply.code(200).send({
            success: true,
            data: template
          });
        } catch (error: any) {
          reply.code(500).send({
            success: false,
            message: 'Failed to fetch template',
            error: error.message
          });
        }
      });
    }

  }, { prefix: '/v1' });

  // Simple test endpoint for basic functionality
  await server.register(async function (server) {
    server.get('/test', async () => {
      return { message: 'API is working!', timestamp: new Date().toISOString() };
    });

    // Test token endpoint for regular users (dev-only, creates user in DB if needed)
    server.post('/test-token', async (request: FastifyRequest, reply: FastifyReply) => {
      const { email } = request.body as { email?: string };
      const testEmail = email || 'test@example.com';

      try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
          reply.status(500).send({ error: 'JWT_SECRET not configured' });
          return;
        }

        // Get Prisma client
        const { PrismaClient } = await import('./generated/prisma/index.js');
        const tempPrisma = new PrismaClient();

        // Create or get test user in database
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash('testpassword123', 10);

        const testUser = await tempPrisma.user.upsert({
          where: { email: testEmail },
          update: {
            // Update to ensure USER role and verified status
            role: 'USER',
            emailVerified: true,
          },
          create: {
            id: 'test-user-id',
            email: testEmail,
            firstName: 'Test',
            lastName: 'User',
            password: hashedPassword,
            role: 'USER',
            emailVerified: true,
            status: 'ACTIVE',
          },
          include: {
            organization: true,
          },
        });

        // Load organization if not already included
        let userWithOrg = testUser;
        if (!testUser.organization) {
          userWithOrg = await tempPrisma.user.findUnique({
            where: { id: testUser.id },
            include: { organization: true },
          });
        }

        await tempPrisma.$disconnect();

        // Generate JWT token with organizationId from database
        const jwt = await import('jsonwebtoken');
        const token = jwt.default.sign(
          {
            id: userWithOrg.id,
            email: userWithOrg.email,
            firstName: userWithOrg.firstName,
            lastName: userWithOrg.lastName,
            role: userWithOrg.role,
            organizationId: userWithOrg.organization?.id || null,
            emailVerified: userWithOrg.emailVerified,
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        reply.status(200).send({
          success: true,
          token,
          user: {
            id: userWithOrg.id,
            email: userWithOrg.email,
            firstName: userWithOrg.firstName,
            lastName: userWithOrg.lastName,
            role: userWithOrg.role,
            emailVerified: userWithOrg.emailVerified,
            organizationId: userWithOrg.organization?.id || null,
          },
        });
      } catch (error: any) {
        console.error('Test token generation error:', error);
        reply.status(500).send({
          success: false,
          error: 'Failed to generate test token',
          message: error.message
        });
      }
    });

    // Test admin token endpoint (dev-only, creates user in DB if needed)
    server.post('/test-admin-token', async (request: FastifyRequest, reply: FastifyReply) => {
      const { email } = request.body as { email?: string };
      const testEmail = email || 'admin@example.com';

      try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
          reply.status(500).send({ error: 'JWT_SECRET not configured' });
          return;
        }

        // Get Prisma client
        const { PrismaClient } = await import('./generated/prisma/index.js');
        const tempPrisma = new PrismaClient();

        // Create or get test admin user in database
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash('testpassword123', 10);

        const testUser = await tempPrisma.user.upsert({
          where: { email: testEmail },
          update: {
            // Update to ADMIN role if exists
            role: 'ADMIN',
            emailVerified: true,
          },
          create: {
            id: 'test-admin-id',
            email: testEmail,
            firstName: 'Test',
            lastName: 'Admin',
            password: hashedPassword,
            role: 'ADMIN',
            emailVerified: true,
            status: 'ACTIVE',
          },
        });

        await tempPrisma.$disconnect();

        // Generate JWT token
        const jwt = await import('jsonwebtoken');
        const token = jwt.default.sign(
          {
            id: testUser.id,
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            role: testUser.role,
            organizationId: null,
            emailVerified: testUser.emailVerified,
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        reply.status(200).send({
          success: true,
          token,
          user: {
            id: testUser.id,
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            role: testUser.role,
            emailVerified: testUser.emailVerified,
            organizationId: null,
          },
        });
      } catch (error: any) {
        console.error('Test admin token generation error:', error);
        reply.status(500).send({
          success: false,
          error: 'Failed to generate test admin token',
          message: error.message
        });
      }
    });
  }, { prefix: '/v1' });

  // Catch-all for undefined routes
  server.setNotFoundHandler(notFoundHandler);
}

async function setupErrorHandling(server: FastifyInstance): Promise<void> {
  // Global error handler
  server.setErrorHandler(errorHandler);

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    server.log.info(`Received ${signal}, shutting down gracefully...`);

    try {
      await cleanupServices();
      await server.close();
      server.log.info('Server closed successfully');
      process.exit(0);
    } catch (error: unknown) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Skip signal handlers in test environment to avoid conflicts
  if (process.env.NODE_ENV !== 'test') {
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
  }
}

export async function startServer(config: AppConfig): Promise<FastifyInstance> {
  const server = await createServer(config);

  try {
    // Initialize services first
    await initializeServices();

    // Start server
    console.log(`Starting server on ${config.host}:${config.port}...`);
    console.log('Debug: About to call server.listen()');

    await server.listen({
      port: config.port,
      host: '0.0.0.0' // Force binding to all interfaces for Replit
    });

    console.log(`✅ Server listening on http://${config.host}:${config.port}`);
    console.log(`✅ Server accessible on http://0.0.0.0:${config.port}`);
    server.log.info(`Server listening on http://${config.host}:${config.port}`);

    if (config.swagger.enabled) {
      server.log.info(`API documentation available at http://${config.host}:${config.port}/docs`);
    }

    return server;
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ COMPLETE SERVER STARTUP ERROR:', error);
    console.error('❌ ERROR STACK:', err.stack);
    console.error('❌ ERROR MESSAGE:', err.message);
    throw error; // Re-throw to let index.ts handle it
  }
}

// Default configuration
export const defaultConfig: AppConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 8543,
  host: '0.0.0.0', // Always listen on all interfaces in Replit
  jwt: {
    secret: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required'); })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    origin: true, // Allow all origins in Replit development
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
  },
  swagger: {
    enabled: process.env.NODE_ENV !== 'production',
  },
};
// Force reload Thu Oct  9 12:44:20 PM UTC 2025
// Force reload for field fixes Thu Oct  9 12:49:58 PM UTC 2025
// Force reload - test users in DB Thu Oct  9 12:58:59 PM UTC 2025
// Debug logging added Thu Oct  9 01:10:22 PM UTC 2025
