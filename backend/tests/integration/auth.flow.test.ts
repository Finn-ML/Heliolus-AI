/**
 * T056: Integration Test - User Registration and Email Verification Flow
 * 
 * Tests the complete authentication flow from user registration through email verification.
 * This validates the integration between auth routes and API endpoints.
 * 
 * Flow tested:
 * 1. User registers with valid data
 * 2. System creates user account with unverified email
 * 3. System generates verification token
 * 4. User verifies email with token
 * 5. User can login with verified account
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestServer } from '../setup';

describe('Integration: User Registration and Email Verification Flow (T056)', () => {
  let server: FastifyInstance;
  let testUserEmail: string;
  let testUserId: string;
  let verificationToken: string;
  let authToken: string;

  beforeAll(async () => {
    // Build test server with all middleware and routes
    server = await buildTestServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    // Generate unique test email for each test
    testUserEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    
    // Reset state variables
    testUserId = '';
    verificationToken = '';
    authToken = '';
  });

  describe('User Registration Flow', () => {
    it('should successfully register new user with organization', async () => {
      const registrationData = {
        email: testUserEmail,
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization Inc.',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: registrationData,
      });

      // Verify HTTP response
      expect(response.statusCode).toBe(201);
      
      const responseData = JSON.parse(response.body);
      expect(responseData).toHaveProperty('token');
      expect(responseData).toHaveProperty('user');
      expect(responseData.user.email).toBe(testUserEmail);
      expect(responseData.user.firstName).toBe('John');
      expect(responseData.user.lastName).toBe('Doe');
      expect(responseData.user.emailVerified).toBe(false);
      expect(responseData.user.role).toBe('USER');
      expect(responseData.user.id).toBeDefined();
      expect(responseData.user.createdAt).toBeDefined();

      // Store values for subsequent tests
      testUserId = responseData.user.id;
      authToken = responseData.token;
    });

    it('should reject duplicate email registration', async () => {
      const registrationData = {
        email: testUserEmail,
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization Inc.',
      };

      // First registration - should succeed
      const firstResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: registrationData,
      });
      expect(firstResponse.statusCode).toBe(201);

      // Second registration with same email - should fail
      const secondResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: registrationData,
      });

      expect(secondResponse.statusCode).toBe(409);
      
      const errorData = JSON.parse(secondResponse.body);
      expect(errorData.message).toContain('Email already registered');
      expect(errorData.code).toBe('EMAIL_EXISTS');
    });

    it('should reject invalid registration data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: '',
        organizationName: '',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: invalidData,
      });

      expect(response.statusCode).toBe(400);
      
      const errorData = JSON.parse(response.body);
      expect(errorData.message).toBeDefined();
      expect(errorData.statusCode).toBe(400);
    });
  });

  describe('Email Verification Flow', () => {
    beforeEach(async () => {
      // Create a test user first
      const registrationData = {
        email: testUserEmail,
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization Inc.',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: registrationData,
      });

      const responseData = JSON.parse(response.body);
      testUserId = responseData.user.id;
      authToken = responseData.token;
      
      // Extract verification token from the user ID for our simplified implementation
      // In a real app, this would be sent via email
      verificationToken = `verify-${Date.now()}-${testUserId.split('-').pop()}`;
    });

    it('should successfully verify email with valid token', async () => {
      // Create a new user
      const uniqueEmail = `verify-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
      const registrationResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          email: uniqueEmail,
          password: 'SecurePassword123!',
          firstName: 'John',
          lastName: 'Doe',
          organizationName: 'Test Organization Inc.',
        },
      });

      expect(registrationResponse.statusCode).toBe(201);
      const registrationData = JSON.parse(registrationResponse.body);
      expect(registrationData.user.emailVerified).toBe(false);
      
      // Get the real verification token using the debug route
      const debugResponse = await server.inject({
        method: 'GET',
        url: `/v1/auth/__debug/verification-token?email=${encodeURIComponent(uniqueEmail)}`,
      });

      expect(debugResponse.statusCode).toBe(200);
      const debugData = JSON.parse(debugResponse.body);
      expect(debugData.verificationToken).toBeDefined();
      expect(debugData.email).toBe(uniqueEmail);
      
      // Use the real verification token to verify email
      const verifyResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/verify-email',
        payload: {
          token: debugData.verificationToken,
        },
      });

      expect(verifyResponse.statusCode).toBe(200);
      const verifyData = JSON.parse(verifyResponse.body);
      expect(verifyData.message).toBe('Email verified successfully');
      
      // Verify that user's emailVerified status is now true
      const meResponse = await server.inject({
        method: 'GET',
        url: '/v1/auth/me',
        headers: {
          authorization: `Bearer ${registrationData.token}`,
        },
      });

      expect(meResponse.statusCode).toBe(200);
      const meData = JSON.parse(meResponse.body);
      expect(meData.emailVerified).toBe(true);
    });

    it('should reject invalid verification token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/verify-email',
        payload: {
          token: 'invalid-token-123',
        },
      });

      expect(response.statusCode).toBe(400);
      
      const errorData = JSON.parse(response.body);
      expect(errorData.message).toContain('Invalid');
      expect(errorData.code).toBe('INVALID_TOKEN');
    });

    it('should handle verification of already verified email', async () => {
      // Create and verify a user first
      const uniqueEmail = `already-verified-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
      const registrationResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: {
          email: uniqueEmail,
          password: 'SecurePassword123!',
          firstName: 'John',
          lastName: 'Doe',
          organizationName: 'Test Organization Inc.',
        },
      });

      expect(registrationResponse.statusCode).toBe(201);
      
      // Get verification token
      const debugResponse = await server.inject({
        method: 'GET',
        url: `/v1/auth/__debug/verification-token?email=${encodeURIComponent(uniqueEmail)}`,
      });

      expect(debugResponse.statusCode).toBe(200);
      const debugData = JSON.parse(debugResponse.body);
      
      // First verification - should succeed
      const firstVerifyResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/verify-email',
        payload: {
          token: debugData.verificationToken,
        },
      });

      expect(firstVerifyResponse.statusCode).toBe(200);
      const firstVerifyData = JSON.parse(firstVerifyResponse.body);
      expect(firstVerifyData.message).toBe('Email verified successfully');
      
      // Second verification - should return already verified message
      const secondVerifyResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/verify-email',
        payload: {
          token: debugData.verificationToken,
        },
      });

      // Should return 400 since token is no longer valid after first use
      expect(secondVerifyResponse.statusCode).toBe(400);
      const secondVerifyData = JSON.parse(secondVerifyResponse.body);
      expect(secondVerifyData.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Login Flow', () => {
    beforeEach(async () => {
      // Create a test user first
      const registrationData = {
        email: testUserEmail,
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization Inc.',
      };

      await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: registrationData,
      });
    });

    it('should successfully login with valid credentials', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: testUserEmail,
          password: 'SecurePassword123!',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const loginData = JSON.parse(response.body);
      expect(loginData).toHaveProperty('token');
      expect(loginData.user.email).toBe(testUserEmail);
      expect(loginData.user.firstName).toBe('John');
      expect(loginData.user.lastName).toBe('Doe');
      expect(loginData.user.role).toBe('USER');
      expect(loginData.user.emailVerified).toBe(false); // Not verified yet
      
      authToken = loginData.token;
    });

    it('should reject invalid credentials', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: testUserEmail,
          password: 'WrongPassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
      
      const errorData = JSON.parse(response.body);
      expect(errorData.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent user', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
      
      const errorData = JSON.parse(response.body);
      expect(errorData.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('User Profile Access', () => {
    beforeEach(async () => {
      // Create and login a test user
      const registrationData = {
        email: testUserEmail,
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization Inc.',
      };

      const registerResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: registrationData,
      });

      const registerData = JSON.parse(registerResponse.body);
      authToken = registerData.token;
    });

    it('should access user profile with valid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/auth/me',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      
      const userData = JSON.parse(response.body);
      expect(userData.email).toBe(testUserEmail);
      expect(userData.firstName).toBe('John');
      expect(userData.lastName).toBe('Doe');
      expect(userData.role).toBe('USER');
      expect(userData.emailVerified).toBe(false);
      expect(userData.id).toBeDefined();
      expect(userData.createdAt).toBeDefined();
    });

    it('should reject request without authorization header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
      
      const errorData = JSON.parse(response.body);
      expect(errorData.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/auth/me',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      
      const errorData = JSON.parse(response.body);
      expect(errorData.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Complete Authentication Flow Integration', () => {
    it('should complete full registration → verification → login → profile access flow', async () => {
      // Step 1: Register user
      const registrationData = {
        email: testUserEmail,
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization Inc.',
      };

      const registerResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: registrationData,
      });

      expect(registerResponse.statusCode).toBe(201);
      const registerData = JSON.parse(registerResponse.body);
      expect(registerData.user.emailVerified).toBe(false);
      
      // Step 2: Get verification token and verify email
      const debugResponse = await server.inject({
        method: 'GET',
        url: `/v1/auth/__debug/verification-token?email=${encodeURIComponent(testUserEmail)}`,
      });

      expect(debugResponse.statusCode).toBe(200);
      const debugData = JSON.parse(debugResponse.body);
      
      const verifyResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/verify-email',
        payload: {
          token: debugData.verificationToken,
        },
      });

      expect(verifyResponse.statusCode).toBe(200);
      const verifyData = JSON.parse(verifyResponse.body);
      expect(verifyData.message).toBe('Email verified successfully');

      // Step 3: Login with registered account (should now show verified)
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          email: testUserEmail,
          password: 'SecurePassword123!',
        },
      });

      expect(loginResponse.statusCode).toBe(200);
      
      const loginData = JSON.parse(loginResponse.body);
      expect(loginData).toHaveProperty('token');
      expect(loginData.user.email).toBe(testUserEmail);
      expect(loginData.user.emailVerified).toBe(true); // Should be verified now

      // Step 4: Access protected endpoint with token
      const meResponse = await server.inject({
        method: 'GET',
        url: '/v1/auth/me',
        headers: {
          authorization: `Bearer ${loginData.token}`,
        },
      });

      expect(meResponse.statusCode).toBe(200);
      
      const meData = JSON.parse(meResponse.body);
      expect(meData.email).toBe(testUserEmail);
      expect(meData.firstName).toBe('John');
      expect(meData.lastName).toBe('Doe');
      expect(meData.emailVerified).toBe(true); // Should be verified
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed request body gracefully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
        payload: 'invalid-json',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect([400, 415]).toContain(response.statusCode);
    });

    it('should handle missing request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/auth/register',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle concurrent registrations with same email', async () => {
      const registrationData = {
        email: testUserEmail,
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization Inc.',
      };

      // Fire two registration requests simultaneously
      const [response1, response2] = await Promise.all([
        server.inject({
          method: 'POST',
          url: '/v1/auth/register',
          payload: registrationData,
        }),
        server.inject({
          method: 'POST',
          url: '/v1/auth/register',
          payload: registrationData,
        }),
      ]);

      // One should succeed, one should fail
      const responses = [response1, response2].sort((a, b) => a.statusCode - b.statusCode);
      
      expect(responses[0].statusCode).toBe(201); // Success
      expect(responses[1].statusCode).toBe(409); // Conflict
      
      const errorData = JSON.parse(responses[1].body);
      expect(errorData.code).toBe('EMAIL_EXISTS');
    });
  });
});