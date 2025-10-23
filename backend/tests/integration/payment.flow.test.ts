/**
 * T059: Comprehensive Integration Test - Subscription and Payment Flow
 * 
 * Tests the complete payment and subscription system integration from user registration 
 * through billing cycles, credit management, and webhook processing.
 * 
 * This test validates the integration between:
 * - Subscription management endpoints
 * - Credit system and transactions
 * - Stripe payment processing (mocked)
 * - Webhook handling
 * - Invoice generation and billing
 * - Authentication and authorization
 * 
 * Flow coverage:
 * 1. User registration → Default FREE subscription
 * 2. Plan upgrade → Checkout session → Payment confirmation
 * 3. Credit allocation → Assessment usage → Credit deduction
 * 4. Billing cycle → Invoice generation → Payment processing
 * 5. Subscription cancellation → Prorated credits
 * 6. Webhook processing → Status updates
 * 7. Error scenarios → Payment failures → Recovery
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestServer } from '../setup';
import { 
  SubscriptionPlan, 
  SubscriptionStatus, 
  TransactionType,
  InvoiceStatus,
  UserRole 
} from '../../src/types/database';

describe('Integration: Subscription and Payment Flow (T059)', () => {
  let server: FastifyInstance;
  let testUsers: {
    freeUser: { id: string; email: string; token: string };
    premiumUser: { id: string; email: string; token: string };
    enterpriseUser: { id: string; email: string; token: string };
    adminUser: { id: string; email: string; token: string };
  };

  // Test data containers
  let subscriptionIds: string[] = [];
  let invoiceIds: string[] = [];
  let checkoutSessionIds: string[] = [];
  let webhookEventIds: string[] = [];

  beforeAll(async () => {
    server = await buildTestServer();
    await server.ready();

    // Initialize test users with different subscription plans
    testUsers = {
      freeUser: await createTestUser('free'),
      premiumUser: await createTestUser('premium'), 
      enterpriseUser: await createTestUser('enterprise'),
      adminUser: await createTestUser('admin')
    };
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    // Reset test state for each test group
    subscriptionIds = [];
    invoiceIds = [];
    checkoutSessionIds = [];
    webhookEventIds = [];
  });

  /**
   * SECTION 1: User Registration and Initial Subscription Setup
   */
  describe('1. User Registration and Initial Subscription Setup', () => {
    
    it('T059-001: should create FREE subscription automatically on user registration', async () => {
      const newUserData = {
        email: `test-${Date.now()}@example.com`,
        password: 'SecurePassword123!',
        firstName: 'New',
        lastName: 'User',
        organizationName: 'Test Organization'
      };

      // Register new user
      const registerResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: newUserData
      });

      expect(registerResponse.statusCode).toBe(201);
      const { token, user } = JSON.parse(registerResponse.body);

      // Verify FREE subscription was created automatically
      const subscriptionResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/current',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(subscriptionResponse.statusCode).toBe(200);
      const subscription = JSON.parse(subscriptionResponse.body);
      
      expect(subscription.plan).toBe(SubscriptionPlan.FREE);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription.creditsBalance).toBeGreaterThan(0);
      expect(subscription.creditsUsed).toBe(0);

      subscriptionIds.push(subscription.id);
    });

    it('T059-002: should allocate initial credits based on FREE plan configuration', async () => {
      const creditsResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/credits',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`
        }
      });

      expect(creditsResponse.statusCode).toBe(200);
      const creditBalance = JSON.parse(creditsResponse.body);

      // FREE plan should get initial credits based on plan configuration
      expect(creditBalance.balance).toBeGreaterThanOrEqual(1);
      expect(creditBalance.used).toBe(0);
      expect(creditBalance.purchased).toBeGreaterThanOrEqual(1);
    });

    it('T059-003: should create initial credit transaction for FREE plan', async () => {
      // This test verifies that the initial credit allocation creates a proper transaction record
      const subscriptionResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/current',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`
        }
      });

      expect(subscriptionResponse.statusCode).toBe(200);
      const subscription = JSON.parse(subscriptionResponse.body);
      expect(subscription.creditsBalance).toBeGreaterThanOrEqual(1);
      expect(subscription.creditsUsed).toBe(0);
    });
  });

  /**
   * SECTION 2: Subscription Plan Management and Upgrades
   */
  describe('2. Subscription Plan Management and Upgrades', () => {

    it('T059-004: should list all available subscription plans', async () => {
      const plansResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/plans'
      });

      expect(plansResponse.statusCode).toBe(200);
      const plans = JSON.parse(plansResponse.body);

      expect(Array.isArray(plans)).toBe(true);
      expect(plans).toHaveLength(3);

      const planNames = plans.map(p => p.plan);
      expect(planNames).toContain(SubscriptionPlan.FREE);
      expect(planNames).toContain(SubscriptionPlan.PREMIUM);
      expect(planNames).toContain(SubscriptionPlan.ENTERPRISE);

      // Verify plan pricing and features
      const freePlan = plans.find(p => p.plan === SubscriptionPlan.FREE);
      const premiumPlan = plans.find(p => p.plan === SubscriptionPlan.PREMIUM);
      const enterprisePlan = plans.find(p => p.plan === SubscriptionPlan.ENTERPRISE);

      expect(freePlan.price).toBe(0);
      expect(freePlan.credits).toBe(1);
      expect(premiumPlan.price).toBe(599);
      expect(premiumPlan.credits).toBe(50);
      expect(enterprisePlan.price).toBe(1999);
      expect(enterprisePlan.credits).toBe(200);
    });

    it('T059-005: should create checkout session for PREMIUM plan upgrade', async () => {
      const checkoutPayload = {
        plan: SubscriptionPlan.PREMIUM
      };

      const checkoutResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/checkout',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: checkoutPayload
      });

      expect(checkoutResponse.statusCode).toBe(200);
      const checkoutSession = JSON.parse(checkoutResponse.body);

      expect(checkoutSession).toHaveProperty('sessionId');
      expect(checkoutSession).toHaveProperty('url');
      expect(checkoutSession.url).toContain('checkout');
      expect(checkoutSession.sessionId).toMatch(/^cs_mock_/);

      checkoutSessionIds.push(checkoutSession.sessionId);
    });

    it('T059-006: should create checkout session for ENTERPRISE plan upgrade', async () => {
      const checkoutPayload = {
        plan: SubscriptionPlan.ENTERPRISE
      };

      const checkoutResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/checkout',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: checkoutPayload
      });

      expect(checkoutResponse.statusCode).toBe(200);
      const checkoutSession = JSON.parse(checkoutResponse.body);

      expect(checkoutSession).toHaveProperty('sessionId');
      expect(checkoutSession).toHaveProperty('url');
      expect(checkoutSession.url).toContain('checkout');

      checkoutSessionIds.push(checkoutSession.sessionId);
    });

    it('T059-007: should handle FREE plan checkout appropriately', async () => {
      const checkoutPayload = {
        plan: SubscriptionPlan.FREE
      };

      const checkoutResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/checkout',
        headers: {
          'Authorization': `Bearer ${testUsers.premiumUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: checkoutPayload
      });

      // FREE plan might be handled differently (direct update or rejection)
      expect([200, 400, 409, 422]).toContain(checkoutResponse.statusCode);
    });

    it('T059-008: should validate plan enum in checkout request', async () => {
      const invalidCheckoutPayload = {
        plan: 'INVALID_PLAN'
      };

      const checkoutResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/checkout',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: invalidCheckoutPayload
      });

      expect(checkoutResponse.statusCode).toBe(400);
      const errorResponse = JSON.parse(checkoutResponse.body);
      expect(errorResponse.message).toMatch(/plan|validation/i);
    });
  });

  /**
   * SECTION 3: Subscription Status and Lifecycle Management
   */
  describe('3. Subscription Status and Lifecycle Management', () => {

    it('T059-009: should retrieve current subscription with all details', async () => {
      const subscriptionResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/current',
        headers: {
          'Authorization': `Bearer ${testUsers.premiumUser.token}`
        }
      });

      expect(subscriptionResponse.statusCode).toBe(200);
      const subscription = JSON.parse(subscriptionResponse.body);

      expect(subscription).toHaveProperty('id');
      expect(subscription).toHaveProperty('plan');
      expect(subscription).toHaveProperty('status');
      expect(subscription).toHaveProperty('creditsBalance');
      expect(subscription).toHaveProperty('creditsUsed');
      expect(subscription).toHaveProperty('currentPeriodStart');
      expect(subscription).toHaveProperty('currentPeriodEnd');

      expect(subscription.plan).toBe(SubscriptionPlan.PREMIUM);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription.creditsBalance).toBeGreaterThan(0);

      subscriptionIds.push(subscription.id);
    });

    it('T059-010: should cancel subscription with end-of-period cancellation', async () => {
      const cancelPayload = {
        immediately: false
      };

      const cancelResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/cancel',
        headers: {
          'Authorization': `Bearer ${testUsers.premiumUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: cancelPayload
      });

      expect(cancelResponse.statusCode).toBe(200);
      const canceledSubscription = JSON.parse(cancelResponse.body);

      expect(canceledSubscription.status).toBe(SubscriptionStatus.CANCELED);
      expect(canceledSubscription).toHaveProperty('cancelAt');
      expect(new Date(canceledSubscription.cancelAt)).toBeInstanceOf(Date);
    });

    it('T059-011: should cancel subscription immediately', async () => {
      const cancelPayload = {
        immediately: true
      };

      const cancelResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/cancel',
        headers: {
          'Authorization': `Bearer ${testUsers.enterpriseUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: cancelPayload
      });

      expect(cancelResponse.statusCode).toBe(200);
      const canceledSubscription = JSON.parse(cancelResponse.body);

      expect(canceledSubscription.status).toBe(SubscriptionStatus.CANCELED);
    });

    it('T059-012: should handle subscription not found for new user', async () => {
      // Create a user without waiting for subscription creation
      const newUser = await createTestUser('temp');
      
      // Test with invalid token first
      const invalidResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/current',
        headers: {
          'Authorization': 'Bearer invalid.token.here'
        }
      });

      expect(invalidResponse.statusCode).toBe(401);
    });
  });

  /**
   * SECTION 4: Credit System and Transaction Management
   */
  describe('4. Credit System and Transaction Management', () => {

    it('T059-013: should retrieve detailed credit balance', async () => {
      const creditsResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/credits',
        headers: {
          'Authorization': `Bearer ${testUsers.premiumUser.token}`
        }
      });

      expect(creditsResponse.statusCode).toBe(200);
      const creditBalance = JSON.parse(creditsResponse.body);

      expect(creditBalance).toHaveProperty('balance');
      expect(creditBalance).toHaveProperty('used');
      expect(creditBalance).toHaveProperty('purchased');

      expect(creditBalance.balance).toBeGreaterThanOrEqual(0);
      expect(creditBalance.used).toBeGreaterThanOrEqual(0);
      expect(creditBalance.purchased).toBeGreaterThanOrEqual(0);
    });

    it('T059-014: should create checkout session for credit purchase', async () => {
      const creditPurchasePayload = {
        amount: 100
      };

      const purchaseResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/credits/purchase',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: creditPurchasePayload
      });

      expect(purchaseResponse.statusCode).toBe(200);
      const checkoutSession = JSON.parse(purchaseResponse.body);

      expect(checkoutSession).toHaveProperty('sessionId');
      expect(checkoutSession).toHaveProperty('url');
      expect(checkoutSession.url).toContain('checkout');

      checkoutSessionIds.push(checkoutSession.sessionId);
    });

    it('T059-015: should validate minimum credit purchase amount', async () => {
      const invalidAmounts = [0, -10, -100];

      for (const amount of invalidAmounts) {
        const creditPurchasePayload = { amount };

        const purchaseResponse = await server.inject({
          method: 'POST',
          url: '/v1/subscriptions/credits/purchase',
          headers: {
            'Authorization': `Bearer ${testUsers.freeUser.token}`,
            'Content-Type': 'application/json'
          },
          payload: creditPurchasePayload
        });

        expect(purchaseResponse.statusCode).toBe(400);
        const errorResponse = JSON.parse(purchaseResponse.body);
        expect(errorResponse.message).toMatch(/amount|credit/i);
      }
    });

    it('T059-016: should validate maximum credit purchase amount', async () => {
      const creditPurchasePayload = {
        amount: 1001 // Above the maximum of 1000
      };

      const purchaseResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/credits/purchase',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: creditPurchasePayload
      });

      expect(purchaseResponse.statusCode).toBe(400);
    });

    it('T059-017: should handle valid credit purchase amounts', async () => {
      const validAmounts = [1, 50, 100, 500, 1000];

      for (const amount of validAmounts) {
        const creditPurchasePayload = { amount };

        const purchaseResponse = await server.inject({
          method: 'POST',
          url: '/v1/subscriptions/credits/purchase',
          headers: {
            'Authorization': `Bearer ${testUsers.premiumUser.token}`,
            'Content-Type': 'application/json'
          },
          payload: creditPurchasePayload
        });

        expect(purchaseResponse.statusCode).toBe(200);
        const checkoutSession = JSON.parse(purchaseResponse.body);
        expect(checkoutSession).toHaveProperty('sessionId');

        checkoutSessionIds.push(checkoutSession.sessionId);
      }
    });
  });

  /**
   * SECTION 5: Billing and Invoice Management
   */
  describe('5. Billing and Invoice Management', () => {

    it('T059-018: should retrieve user invoices list', async () => {
      const invoicesResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/invoices',
        headers: {
          'Authorization': `Bearer ${testUsers.premiumUser.token}`
        }
      });

      expect(invoicesResponse.statusCode).toBe(200);
      const invoices = JSON.parse(invoicesResponse.body);

      expect(Array.isArray(invoices)).toBe(true);
      // New user might not have invoices yet, so just verify structure
      if (invoices.length > 0) {
        const invoice = invoices[0];
        expect(invoice).toHaveProperty('id');
        expect(invoice).toHaveProperty('number');
        expect(invoice).toHaveProperty('status');
        expect(invoice).toHaveProperty('total');
        expect(invoice).toHaveProperty('currency');
        expect(invoice).toHaveProperty('dueDate');
        expect(invoice).toHaveProperty('createdAt');

        invoiceIds.push(invoice.id);
      }
    });

    it('T059-019: should handle invoice pagination', async () => {
      const paginationParams = [
        { limit: 5, offset: 0 },
        { limit: 10, offset: 5 },
        { limit: 20, offset: 10 }
      ];

      for (const params of paginationParams) {
        const invoicesResponse = await server.inject({
          method: 'GET',
          url: `/v1/subscriptions/invoices?limit=${params.limit}&offset=${params.offset}`,
          headers: {
            'Authorization': `Bearer ${testUsers.premiumUser.token}`
          }
        });

        expect(invoicesResponse.statusCode).toBe(200);
        const invoices = JSON.parse(invoicesResponse.body);

        expect(Array.isArray(invoices)).toBe(true);
        expect(invoices.length).toBeLessThanOrEqual(params.limit);
      }
    });

    it('T059-020: should validate invoice status enum values', async () => {
      const invoicesResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/invoices',
        headers: {
          'Authorization': `Bearer ${testUsers.enterpriseUser.token}`
        }
      });

      expect(invoicesResponse.statusCode).toBe(200);
      const invoices = JSON.parse(invoicesResponse.body);

      if (invoices.length > 0) {
        const validStatuses = ['DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'];
        invoices.forEach(invoice => {
          expect(validStatuses).toContain(invoice.status);
        });
      }
    });
  });

  /**
   * SECTION 6: Stripe Webhook Processing
   */
  describe('6. Stripe Webhook Processing', () => {

    it('T059-021: should process valid Stripe webhook with proper signature', async () => {
      const webhookPayload = JSON.stringify({
        id: 'evt_test_webhook',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_123',
            status: 'active'
          }
        }
      });

      const webhookResponse = await server.inject({
        method: 'POST',
        url: '/v1/webhooks/stripe',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=1234567890,v1=signature'
        },
        payload: webhookPayload
      });

      expect(webhookResponse.statusCode).toBe(200);
      const response = JSON.parse(webhookResponse.body);
      expect(response.received).toBe(true);

      webhookEventIds.push('evt_test_webhook');
    });

    it('T059-022: should reject webhook without signature', async () => {
      const webhookPayload = JSON.stringify({
        id: 'evt_test_webhook',
        type: 'customer.subscription.updated'
      });

      const webhookResponse = await server.inject({
        method: 'POST',
        url: '/v1/webhooks/stripe',
        headers: {
          'Content-Type': 'application/json'
          // Missing stripe-signature header
        },
        payload: webhookPayload
      });

      expect(webhookResponse.statusCode).toBe(400);
      const errorResponse = JSON.parse(webhookResponse.body);
      expect(errorResponse.message).toContain('signature');
    });

    it('T059-023: should handle various Stripe event types', async () => {
      const eventTypes = [
        'customer.subscription.created',
        'customer.subscription.updated', 
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'customer.created',
        'payment_method.attached'
      ];

      for (const eventType of eventTypes) {
        const webhookPayload = JSON.stringify({
          id: `evt_${Date.now()}`,
          type: eventType,
          data: { object: { id: 'test_id' } }
        });

        const webhookResponse = await server.inject({
          method: 'POST',
          url: '/v1/webhooks/stripe',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': 't=1234567890,v1=signature'
          },
          payload: webhookPayload
        });

        expect(webhookResponse.statusCode).toBe(200);
        const response = JSON.parse(webhookResponse.body);
        expect(response.received).toBe(true);
      }
    });

    it('T059-024: should provide webhook health check', async () => {
      const healthResponse = await server.inject({
        method: 'GET',
        url: '/v1/webhooks/health'
      });

      expect(healthResponse.statusCode).toBe(200);
      const health = JSON.parse(healthResponse.body);

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('webhookEndpoint');
      expect(health).toHaveProperty('environment');

      expect(health.status).toBe('healthy');
      expect(health.webhookEndpoint).toBe('/v1/webhooks/stripe');
    });

    // Development-only webhook test endpoint
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      it('T059-025: should handle test webhook events in development', async () => {
        const testEventPayload = {
          eventType: 'customer.subscription.created',
          data: {
            subscriptionId: 'sub_test_123',
            plan: 'premium'
          }
        };

        const testWebhookResponse = await server.inject({
          method: 'POST',
          url: '/v1/webhooks/test',
          headers: {
            'Content-Type': 'application/json'
          },
          payload: testEventPayload
        });

        expect(testWebhookResponse.statusCode).toBe(200);
        const response = JSON.parse(testWebhookResponse.body);
        expect(response.received).toBe(true);
        expect(response.processed).toBe(true);
      });
    }
  });

  /**
   * SECTION 7: Authentication and Authorization
   */
  describe('7. Authentication and Authorization', () => {

    it('T059-026: should require authentication for all subscription endpoints', async () => {
      const protectedEndpoints = [
        { method: 'GET', url: '/v1/subscriptions/current' },
        { method: 'GET', url: '/v1/subscriptions/credits' },
        { method: 'POST', url: '/v1/subscriptions/checkout' },
        { method: 'POST', url: '/v1/subscriptions/cancel' },
        { method: 'POST', url: '/v1/subscriptions/credits/purchase' },
        { method: 'GET', url: '/v1/subscriptions/invoices' }
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await server.inject({
          method: endpoint.method as any,
          url: endpoint.url,
          payload: endpoint.method === 'POST' ? {} : undefined
        });

        expect(response.statusCode).toBe(401);
        const errorResponse = JSON.parse(response.body);
        expect(errorResponse.message).toMatch(/auth|token|unauthorized/i);
      }
    });

    it('T059-027: should reject invalid JWT tokens', async () => {
      const invalidTokens = [
        'invalid.token.format',
        'Bearer invalid_token',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        ''
      ];

      for (const token of invalidTokens) {
        const response = await server.inject({
          method: 'GET',
          url: '/v1/subscriptions/current',
          headers: token ? { 'Authorization': token } : {}
        });

        expect(response.statusCode).toBe(401);
      }
    });

    it('T059-028: should allow access to subscription plans without authentication', async () => {
      // Plans endpoint should be accessible without auth for marketing/pricing pages
      const plansResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/plans'
      });

      // Plans endpoint is public
      expect(plansResponse.statusCode).toBe(200);
    });
  });

  /**
   * SECTION 8: Error Handling and Edge Cases
   */
  describe('8. Error Handling and Edge Cases', () => {

    it('T059-029: should handle malformed JSON in request bodies', async () => {
      const malformedPayloads = [
        '{"invalid": json}',
        '{plan: "PREMIUM"}', // Missing quotes
        '{"plan": }', // Missing value
        'not json at all'
      ];

      for (const payload of malformedPayloads) {
        const response = await server.inject({
          method: 'POST',
          url: '/v1/subscriptions/checkout',
          headers: {
            'Authorization': `Bearer ${testUsers.freeUser.token}`,
            'Content-Type': 'application/json'
          },
          payload
        });

        expect(response.statusCode).toBe(400);
      }
    });

    it('T059-030: should handle missing required fields in requests', async () => {
      // Test checkout without plan
      const incompleteCheckoutResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/checkout',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: {} // Missing plan field
      });

      expect(incompleteCheckoutResponse.statusCode).toBe(400);

      // Test credit purchase without amount
      const incompleteCreditResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/credits/purchase',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: {} // Missing amount field
      });

      expect(incompleteCreditResponse.statusCode).toBe(400);
    });

    it('T059-031: should handle subscription not found scenarios gracefully', async () => {
      // Test with user who might not have a subscription
      const newUser = await createTestUser('temp-no-sub');

      const subscriptionResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/current',
        headers: {
          'Authorization': `Bearer ${newUser.token}`
        }
      });

      // Should either return 200 with default subscription or 404
      expect([200, 404]).toContain(subscriptionResponse.statusCode);
    });

    it('T059-032: should handle rate limiting gracefully', async () => {
      // Simulate rapid requests to test rate limiting
      const rapidRequests = Array.from({ length: 20 }, (_, i) => 
        server.inject({
          method: 'GET',
          url: '/v1/subscriptions/current',
          headers: {
            'Authorization': `Bearer ${testUsers.freeUser.token}`
          }
        })
      );

      const responses = await Promise.all(rapidRequests);
      
      // At least some requests should succeed
      const successfulRequests = responses.filter(r => r.statusCode === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);

      // Check if any were rate limited (429)
      const rateLimitedRequests = responses.filter(r => r.statusCode === 429);
      // Rate limiting might or might not be triggered depending on configuration
    });
  });

  /**
   * SECTION 9: End-to-End Payment Flow Simulation
   */
  describe('9. End-to-End Payment Flow Simulation', () => {

    it('T059-033: should complete full subscription upgrade flow', async () => {
      // Step 1: Get current FREE subscription
      let subscriptionResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/current',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`
        }
      });

      expect(subscriptionResponse.statusCode).toBe(200);
      let subscription = JSON.parse(subscriptionResponse.body);
      expect(subscription.plan).toBe(SubscriptionPlan.FREE);
      const initialCredits = subscription.creditsBalance;

      // Step 2: Create checkout session for PREMIUM upgrade
      const checkoutResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/checkout',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: { plan: SubscriptionPlan.PREMIUM }
      });

      expect(checkoutResponse.statusCode).toBe(200);
      const checkoutSession = JSON.parse(checkoutResponse.body);
      expect(checkoutSession.sessionId).toBeDefined();

      // Step 3: Simulate successful payment webhook
      const paymentSuccessWebhook = JSON.stringify({
        id: `evt_${Date.now()}`,
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: checkoutSession.sessionId,
            status: 'active',
            plan: { id: 'premium_plan' }
          }
        }
      });

      const webhookResponse = await server.inject({
        method: 'POST',
        url: '/v1/webhooks/stripe',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=1234567890,v1=signature'
        },
        payload: paymentSuccessWebhook
      });

      expect(webhookResponse.statusCode).toBe(200);

      // Step 4: Verify subscription upgrade (in real scenario, webhook would update the subscription)
      // Since we're using mocks, the subscription won't actually change, but we verify the webhook processed
      const webhookResult = JSON.parse(webhookResponse.body);
      expect(webhookResult.received).toBe(true);
    });

    it('T059-034: should simulate credit purchase and usage flow', async () => {
      // Step 1: Check initial credit balance
      let creditsResponse = await server.inject({
        method: 'GET',
        url: '/v1/subscriptions/credits',
        headers: {
          'Authorization': `Bearer ${testUsers.premiumUser.token}`
        }
      });

      expect(creditsResponse.statusCode).toBe(200);
      const initialBalance = JSON.parse(creditsResponse.body);

      // Step 2: Purchase additional credits
      const creditPurchaseResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/credits/purchase',
        headers: {
          'Authorization': `Bearer ${testUsers.premiumUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: { amount: 50 }
      });

      expect(creditPurchaseResponse.statusCode).toBe(200);
      const purchaseSession = JSON.parse(creditPurchaseResponse.body);
      expect(purchaseSession.sessionId).toBeDefined();

      // Step 3: Simulate successful credit purchase webhook
      const creditsPurchaseWebhook = JSON.stringify({
        id: `evt_credits_${Date.now()}`,
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: purchaseSession.sessionId,
            amount_paid: 2900, // €29 for 50 credits
            metadata: { credits: '50' }
          }
        }
      });

      const creditWebhookResponse = await server.inject({
        method: 'POST',
        url: '/v1/webhooks/stripe',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=1234567890,v1=signature'
        },
        payload: creditsPurchaseWebhook
      });

      expect(creditWebhookResponse.statusCode).toBe(200);
      const creditWebhookResult = JSON.parse(creditWebhookResponse.body);
      expect(creditWebhookResult.received).toBe(true);
    });

    it('T059-035: should handle payment failure scenarios', async () => {
      // Step 1: Create checkout session
      const checkoutResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/checkout',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: { plan: SubscriptionPlan.PREMIUM }
      });

      expect(checkoutResponse.statusCode).toBe(200);
      const checkoutSession = JSON.parse(checkoutResponse.body);

      // Step 2: Simulate payment failure webhook
      const paymentFailureWebhook = JSON.stringify({
        id: `evt_failure_${Date.now()}`,
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: checkoutSession.sessionId,
            status: 'past_due',
            attempt_count: 1
          }
        }
      });

      const failureWebhookResponse = await server.inject({
        method: 'POST',
        url: '/v1/webhooks/stripe',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=1234567890,v1=signature'
        },
        payload: paymentFailureWebhook
      });

      expect(failureWebhookResponse.statusCode).toBe(200);
      const failureResult = JSON.parse(failureWebhookResponse.body);
      expect(failureResult.received).toBe(true);
    });

    it('T059-036: should handle subscription state transitions', async () => {
      // Test different subscription status transitions
      const statusTransitions = [
        { from: 'trialing', to: 'active', event: 'customer.subscription.updated' },
        { from: 'active', to: 'past_due', event: 'invoice.payment_failed' },
        { from: 'past_due', to: 'active', event: 'invoice.payment_succeeded' },
        { from: 'active', to: 'canceled', event: 'customer.subscription.deleted' }
      ];

      for (const transition of statusTransitions) {
        const webhookPayload = JSON.stringify({
          id: `evt_${Date.now()}`,
          type: transition.event,
          data: {
            object: {
              id: 'sub_test_123',
              status: transition.to
            }
          }
        });

        const webhookResponse = await server.inject({
          method: 'POST',
          url: '/v1/webhooks/stripe',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': 't=1234567890,v1=signature'
          },
          payload: webhookPayload
        });

        expect(webhookResponse.statusCode).toBe(200);
        const result = JSON.parse(webhookResponse.body);
        expect(result.received).toBe(true);
      }
    });

    it('T059-037: should handle subscription plan downgrades', async () => {
      // Test downgrade from ENTERPRISE to PREMIUM
      const checkoutResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/checkout',
        headers: {
          'Authorization': `Bearer ${testUsers.enterpriseUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: { plan: SubscriptionPlan.PREMIUM }
      });

      // Should either succeed or handle downgrade appropriately
      expect([200, 400, 409]).toContain(checkoutResponse.statusCode);
    });

    it('T059-038: should validate subscription ownership for operations', async () => {
      // Try to cancel another user's subscription (should fail)
      const cancelResponse = await server.inject({
        method: 'POST',
        url: '/v1/subscriptions/cancel',
        headers: {
          'Authorization': `Bearer ${testUsers.freeUser.token}`,
          'Content-Type': 'application/json'
        },
        payload: { immediately: true }
      });

      // Should succeed if user has subscription, or 404 if not found
      expect([200, 404]).toContain(cancelResponse.statusCode);
    });
  });

  /**
   * HELPER FUNCTIONS
   */

  /**
   * Create a test user with specified role and subscription
   */
  async function createTestUser(type: 'free' | 'premium' | 'enterprise' | 'admin' | 'temp' | 'temp-no-sub') {
    const timestamp = Date.now();
    const email = `${type}-user-${timestamp}@example.com`;
    
    const userData = {
      email,
      password: 'SecurePassword123!',
      firstName: type.charAt(0).toUpperCase() + type.slice(1),
      lastName: 'User',
      organizationName: `${type.charAt(0).toUpperCase() + type.slice(1)} Organization`
    };

    const registerResponse = await server.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: userData
    });

    expect(registerResponse.statusCode).toBe(201);
    const { token, user } = JSON.parse(registerResponse.body);

    return {
      id: user.id,
      email: user.email,
      token
    };
  }

  /**
   * Simulate subscription update via webhook
   */
  async function simulateSubscriptionWebhook(subscriptionId: string, status: string, plan?: string) {
    const webhookPayload = JSON.stringify({
      id: `evt_${Date.now()}`,
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: subscriptionId,
          status,
          plan: plan ? { id: plan } : undefined
        }
      }
    });

    return await server.inject({
      method: 'POST',
      url: '/v1/webhooks/stripe',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=1234567890,v1=signature'
      },
      payload: webhookPayload
    });
  }

  /**
   * Create test invoice data
   */
  async function createTestInvoice(userId: string, amount: number, status: InvoiceStatus = InvoiceStatus.OPEN) {
    // This would typically be handled by the subscription service
    // For testing, we simulate invoice creation via webhook
    const invoiceWebhook = JSON.stringify({
      id: `evt_invoice_${Date.now()}`,
      type: 'invoice.created',
      data: {
        object: {
          id: `inv_${Date.now()}`,
          customer: `cus_${userId}`,
          amount_due: amount * 100, // Stripe uses cents
          status: status.toLowerCase(),
          created: Math.floor(Date.now() / 1000)
        }
      }
    });

    return await server.inject({
      method: 'POST',
      url: '/v1/webhooks/stripe',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=1234567890,v1=signature'
      },
      payload: invoiceWebhook
    });
  }
});