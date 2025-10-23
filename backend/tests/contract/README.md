# Authentication Contract Tests

This directory contains contract tests for authentication endpoints that validate against the OpenAPI specification.

## Test Overview

These tests follow Test-Driven Development (TDD) principles and are designed to **FAIL INITIALLY** (RED phase) until the authentication endpoints are implemented.

### Test Files

- **T009**: `auth.register.test.ts` - POST /auth/register
- **T010**: `auth.login.test.ts` - POST /auth/login  
- **T011**: `auth.verify.test.ts` - POST /auth/verify-email
- **T012**: `auth.reset.test.ts` - POST /auth/reset-password

## What These Tests Validate

Each test validates multiple aspects of the API contract:

### Request/Response Schemas
- Request payload structure matches OpenAPI specification
- Response payload structure matches OpenAPI specification
- Required fields are enforced
- Data types are validated (email format, password length, etc.)

### HTTP Contract
- Correct HTTP methods are supported
- Appropriate status codes are returned
- Content-Type headers are handled correctly
- Authentication requirements match specification

### Business Logic
- Email format validation (business emails preferred)
- Password complexity requirements
- Token format validation
- Error message consistency

### Security Considerations
- Input sanitization against common attack vectors
- Rate limiting preparation
- Token expiration and reuse prevention
- Payload size limits

## Running the Tests

```bash
# Run all contract tests
npm run test:contract

# Run specific test file
npx vitest tests/contract/auth.register.test.ts

# Run tests in watch mode
npm run test:watch

# Run all tests
npm test
```

## Expected Behavior

### RED Phase (Current State)
- All HTTP-related tests should fail with connection errors
- Schema validation tests should pass
- Business logic validation tests should pass
- This confirms the contract is well-defined before implementation

### GREEN Phase (After Implementation)
- All tests should pass when endpoints are implemented correctly
- Any failing tests indicate contract violations that need to be addressed

### REFACTOR Phase
- Tests remain green while code is optimized
- Contract ensures no regression in API behavior

## Test Data

Tests use realistic business scenarios:
- Corporate email addresses
- Strong passwords meeting business requirements
- Realistic organization names
- Various token formats (JWT, UUID, custom)

## OpenAPI Specification

These tests are based on the OpenAPI specification located at:
`/home/runner/workspace/specs/001-heliolus-platform/contracts/openapi.yaml`

Any changes to the API specification should be reflected in these contract tests to maintain consistency.