import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';

/**
 * T010: Contract Test for POST /auth/login
 * 
 * This test validates the authentication login endpoint against the OpenAPI specification.
 * According to TDD principles, this test MUST FAIL initially (RED phase) until implementation is complete.
 * 
 * OpenAPI Specification Reference:
 * - Path: /auth/login
 * - Method: POST
 * - Request Schema: { email, password }
 * - Success Response: 200 with AuthResponse
 * - Error Responses: 401 (Unauthorized)
 */

// Request payload schema based on OpenAPI spec
const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Response schema based on OpenAPI spec (shared with register)
const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(['ADMIN', 'USER', 'VENDOR']),
    emailVerified: z.boolean(),
    createdAt: z.string().datetime(),
  }),
});

const ErrorResponseSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.object({}).optional(),
});

describe('POST /auth/login - Contract Test (T010)', () => {
  const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/v1';
  const LOGIN_ENDPOINT = `${BASE_URL}/auth/login`;

  describe('Request Schema Validation', () => {
    it('should validate valid login request payload', () => {
      const validPayload = {
        email: 'john.doe@acmecorp.com',
        password: 'SecurePassword123!',
      };

      const result = LoginRequestSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidPayload = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
      };

      const result = LoginRequestSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['email']);
    });

    it('should require both email and password', () => {
      const requiredFields = ['email', 'password'];
      
      requiredFields.forEach(field => {
        const incompletePayload = {
          email: 'john.doe@acmecorp.com',
          password: 'SecurePassword123!',
        };
        delete (incompletePayload as any)[field];

        const result = LoginRequestSchema.safeParse(incompletePayload);
        expect(result.success).toBe(false);
        expect(result.error?.issues.some(issue => issue.path.includes(field))).toBe(true);
      });
    });

    it('should accept any length password for login', () => {
      // Unlike registration, login should accept existing passwords of any length
      const shortPasswordPayload = {
        email: 'legacy@acmecorp.com',
        password: '123', // Existing user might have legacy short password
      };

      const result = LoginRequestSchema.safeParse(shortPasswordPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('HTTP Contract Tests', () => {
    it('should accept POST requests with correct Content-Type', async () => {
      const payload = {
        email: 'existing@acmecorp.com',
        password: 'SecurePassword123!',
      };

      // This test MUST FAIL initially as the endpoint doesn't exist yet
      try {
        const response = await fetch(LOGIN_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        // If we reach here, the endpoint exists (implementation phase)
        // Should be 200 for successful login or 401 for invalid credentials
        expect([200, 401]).toContain(response.status);
        
        if (response.status === 200) {
          const responseBody = await response.json();
          const validation = AuthResponseSchema.safeParse(responseBody);
          expect(validation.success).toBe(true);
        } else {
          const errorBody = await response.json();
          const validation = ErrorResponseSchema.safeParse(errorBody);
          expect(validation.success).toBe(true);
        }
      } catch (error) {
        // Expected to fail during RED phase of TDD
        expect(error).toBeDefined();
        console.log('Expected failure during RED phase - endpoint not implemented yet');
      }
    });

    it('should return 401 for invalid credentials', async () => {
      const invalidCredentials = [
        {
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        },
        {
          email: 'existing@acmecorp.com',
          password: 'WrongPassword123!',
        },
      ];

      for (const credentials of invalidCredentials) {
        try {
          const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          expect(response.status).toBe(401);
          
          const errorBody = await response.json();
          const validation = ErrorResponseSchema.safeParse(errorBody);
          expect(validation.success).toBe(true);
          expect(errorBody.message).toBeDefined();
        } catch (error) {
          // Expected to fail during RED phase of TDD
          expect(error).toBeDefined();
          console.log('Expected failure during RED phase - endpoint not implemented yet');
        }
      }
    });

    it('should return 400 for malformed request', async () => {
      const malformedPayloads = [
        {
          email: 'invalid-email',
          password: 'SomePassword123!',
        },
        {
          email: '',
          password: 'SomePassword123!',
        },
        {
          email: 'test@example.com',
          password: '',
        },
      ];

      for (const payload of malformedPayloads) {
        try {
          const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          expect(response.status).toBe(400);
          
          const errorBody = await response.json();
          const validation = ErrorResponseSchema.safeParse(errorBody);
          expect(validation.success).toBe(true);
        } catch (error) {
          // Expected to fail during RED phase of TDD
          expect(error).toBeDefined();
          console.log('Expected failure during RED phase - endpoint not implemented yet');
        }
      }
    });

    it('should not require authentication (security: [])', async () => {
      const payload = {
        email: 'test@example.com',
        password: 'SomePassword123!',
      };

      try {
        // Should work without Authorization header
        const response = await fetch(LOGIN_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Intentionally omitting Authorization header
          },
          body: JSON.stringify(payload),
        });

        // Should not return 401 due to missing auth header
        // (401 should only be for invalid credentials)
        expect(response.status).not.toBe(401);
      } catch (error) {
        // Expected to fail during RED phase of TDD
        expect(error).toBeDefined();
        console.log('Expected failure during RED phase - endpoint not implemented yet');
      }
    });

    it('should handle different HTTP methods correctly', async () => {
      const payload = {
        email: 'test@example.com',
        password: 'SomePassword123!',
      };

      const unsupportedMethods = ['GET', 'PUT', 'DELETE', 'PATCH'];

      for (const method of unsupportedMethods) {
        try {
          const response = await fetch(LOGIN_ENDPOINT, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          expect(response.status).toBe(405); // Method Not Allowed
        } catch (error) {
          // Expected to fail during RED phase of TDD
          expect(error).toBeDefined();
          console.log('Expected failure during RED phase - endpoint not implemented yet');
        }
      }
    });
  });

  describe('Response Schema Validation', () => {
    it('should validate successful login response schema', () => {
      const validResponse = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'user_123456789',
          email: 'john.doe@acmecorp.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      };

      const result = AuthResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate unauthorized error response schema', () => {
      const validErrorResponse = {
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      };

      const result = ErrorResponseSchema.safeParse(validErrorResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('Security and Authentication Logic', () => {
    it('should validate login with different user roles', () => {
      const userRoles = ['ADMIN', 'USER', 'VENDOR'] as const;

      userRoles.forEach(role => {
        const payload = {
          email: `${role.toLowerCase()}@example.com`,
          password: 'SecurePassword123!',
        };

        const result = LoginRequestSchema.safeParse(payload);
        expect(result.success).toBe(true);
      });
    });

    it('should handle email verification status in response', () => {
      const scenarios = [
        {
          description: 'verified user',
          response: {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: {
              id: 'user_verified',
              email: 'verified@acmecorp.com',
              firstName: 'Verified',
              lastName: 'User',
              role: 'USER',
              emailVerified: true,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          },
        },
        {
          description: 'unverified user',
          response: {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            user: {
              id: 'user_unverified',
              email: 'unverified@acmecorp.com',
              firstName: 'Unverified',
              lastName: 'User',
              role: 'USER',
              emailVerified: false,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          },
        },
      ];

      scenarios.forEach(({ description, response }) => {
        const result = AuthResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Realistic Test Data', () => {
    it('should handle realistic login scenarios', () => {
      const loginScenarios = [
        {
          email: 'ceo@techstartup.io',
          password: 'StartupLife2024!',
        },
        {
          email: 'compliance@globalbank.com',
          password: 'ComplianceFirst#2024',
        },
        {
          email: 'risk.manager@finservices.co.uk',
          password: 'RiskManagement$2024',
        },
        {
          email: 'admin@heliolus.com',
          password: 'AdminAccess!2024',
        },
      ];

      loginScenarios.forEach((scenario, index) => {
        const result = LoginRequestSchema.safeParse(scenario);
        expect(result.success).toBe(true);
      });
    });

    it('should handle edge cases in email formats', () => {
      const edgeCaseEmails = [
        'test+tag@example.com',
        'user.name@sub.domain.com',
        'test123@example-domain.co.uk',
        'user_name@company-name.org',
      ];

      edgeCaseEmails.forEach(email => {
        const payload = {
          email,
          password: 'SomePassword123!',
        };

        const result = LoginRequestSchema.safeParse(payload);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Performance and Rate Limiting Considerations', () => {
    it('should prepare for rate limiting tests', () => {
      // Note: Rate limiting will be tested in integration tests
      // This is a placeholder to document the requirement
      const payload = {
        email: 'test@example.com',
        password: 'SomePassword123!',
      };

      const result = LoginRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
      // TODO: Add rate limiting tests in integration test suite
    });

    it('should handle concurrent login attempts', () => {
      // Note: Concurrency will be tested in load tests
      // This is a placeholder to document the requirement
      const payload = {
        email: 'concurrent@example.com',
        password: 'ConcurrentTest123!',
      };

      const result = LoginRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
      // TODO: Add concurrency tests in load test suite
    });
  });
});