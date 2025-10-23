import { beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer, AppConfig } from '../src/server';
import { UserRole, SubscriptionPlan, SubscriptionStatus } from '../src/types/database';
import { PrismaClient } from '../src/generated/prisma';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// Initialize Prisma client for test database operations
const prisma = new PrismaClient();

beforeAll(async () => {
  // Global setup for all tests
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Global cleanup
});

beforeEach(() => {
  // Setup before each test
});

// Store test users for cleanup
const testUsers: Array<{ id: string; email: string }> = [];

/**
 * Create a test user with specified subscription plan
 */
export async function createTestUser(planType: 'free' | 'premium' | 'enterprise' | 'admin' | 'temp'): Promise<{ id: string; email: string; token: string }> {
  const userId = randomUUID();
  const organizationId = randomUUID();
  const timestamp = Date.now();
  const email = `test-${planType}-${timestamp}@example.com`;
  
  // Determine user role and subscription plan
  let userRole = UserRole.USER;
  let subscriptionPlan = SubscriptionPlan.FREE;
  
  switch (planType) {
    case 'free':
      subscriptionPlan = SubscriptionPlan.FREE;
      break;
    case 'premium':
      subscriptionPlan = SubscriptionPlan.PREMIUM;
      break;
    case 'enterprise':
      subscriptionPlan = SubscriptionPlan.ENTERPRISE;
      break;
    case 'admin':
      userRole = UserRole.ADMIN;
      subscriptionPlan = SubscriptionPlan.ENTERPRISE;
      break;
    case 'temp':
      // Temporary user without subscription initially
      break;
  }
  
  try {
    // Create user first (user doesn't have organizationId in schema)
    await prisma.user.create({
      data: {
        id: userId,
        email,
        firstName: 'Test',
        lastName: planType.charAt(0).toUpperCase() + planType.slice(1),
        role: userRole,
        password: 'mock-password-hash', // Required field
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // Create organization that references the user
    await prisma.organization.create({
      data: {
        id: organizationId,
        userId,
        name: `Test Organization ${planType}`,
        website: `https://test-${planType}.example.com`,
        size: 'STARTUP',
        country: 'United States',
        riskProfile: 'MEDIUM',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // Create subscription if not temp user
    if (planType !== 'temp') {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const creditsByPlan = {
        [SubscriptionPlan.FREE]: 1,
        [SubscriptionPlan.PREMIUM]: 50,
        [SubscriptionPlan.ENTERPRISE]: 200,
      };
      
      const credits = creditsByPlan[subscriptionPlan] || 1;
      
      await prisma.subscription.create({
        data: {
          id: randomUUID(),
          userId,
          plan: subscriptionPlan,
          status: SubscriptionStatus.ACTIVE,
          creditsBalance: credits,
          creditsUsed: 0,
          creditsPurchased: credits,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      {
        id: userId,
        email,
        firstName: 'Test',
        lastName: planType.charAt(0).toUpperCase() + planType.slice(1),
        role: userRole,
        organizationId,
        emailVerified: true,
        subscriptionPlan,
      },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '24h' }
    );
    
    // Store for cleanup
    testUsers.push({ id: userId, email });
    
    return { id: userId, email, token };
    
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
}

/**
 * Cleanup test users
 */
export async function cleanupTestUsers(): Promise<void> {
  // In a real implementation, this would clean up the database
  // For now, just clear the array
  testUsers.length = 0;
}

/**
 * Build a test server instance with all routes and middleware
 */
export async function buildTestServer(): Promise<FastifyInstance> {
  const testConfig: AppConfig = {
    port: 3001,
    host: '0.0.0.0',
    jwt: {
      secret: process.env.JWT_SECRET || 'test-secret-key',
      expiresIn: '24h',
    },
    cors: {
      origin: true,
    },
    rateLimit: {
      max: 10000, // Much higher limit for testing
      timeWindow: '1 minute',
    },
    swagger: {
      enabled: false, // Disable swagger in tests
    },
  };
  
  const server = await createServer(testConfig);
  return server;
}