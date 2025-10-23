# Epic 7: API Endpoints (Pay-Gating)

**Epic ID:** 7
**Status:** Draft
**Priority:** P0 - Critical
**Estimated Effort:** 4-6 hours
**Dependencies:** Epic 5 (Services), Epic 6 (Billing Logic)

---

## Epic Description

Create REST API endpoints to expose assessment quota checking, admin credit management, subscription billing information, and additional assessment purchases to frontend and admin interfaces.

---

## Business Value

- Enable frontend to check user quotas before assessment creation
- Provide admin UI ability to grant Enterprise credits
- Support subscription management and upgrades
- Enable additional assessment purchases

---

## Stories

### Story 3.1: Add Quota Check Error Handling to Assessment Routes

**As a** frontend application
**I want** clear error responses when users exceed quotas
**So that** I can display appropriate upgrade prompts

**Acceptance Criteria:**
1. Modify `POST /v1/assessments` endpoint in `assessment.routes.ts`
2. Wrap `assessmentService.createAssessment()` call in try-catch
3. Catch errors with code `FREEMIUM_QUOTA_EXCEEDED`
4. Return HTTP 402 Payment Required with response:
   ```json
   {
     "success": false,
     "error": "Free users can create maximum 2 assessments. Upgrade to Premium for unlimited access.",
     "code": "FREEMIUM_QUOTA_EXCEEDED",
     "upgradeUrl": "/pricing?upgrade=premium"
   }
   ```
5. All other errors handled by existing error middleware
6. Successful assessment creation returns 200 with assessment data

**Technical Notes:**
- File: `backend/src/routes/assessment.routes.ts`
- Existing POST endpoint at line ~450
- HTTP 402 specifically indicates payment required
- Include `upgradeUrl` to streamline user flow

---

### Story 3.2: Create Admin Credit Grant Endpoint

**As a** system administrator
**I want** API endpoint to grant credits to users
**So that** I can manage Enterprise customer credit allocations

**Acceptance Criteria:**
1. New endpoint: `POST /v1/admin/users/:userId/credits`
2. Route protected by: `[authMiddleware, rbacMiddleware(['ADMIN'])]`
3. Request schema validation:
   ```typescript
   params: z.object({ userId: z.string() })
   body: z.object({
     amount: z.number().min(1),
     reason: z.string()
   })
   ```
4. Endpoint calls: `adminCreditService.addCreditsToUser(userId, amount, reason, context)`
5. Success response (200):
   ```json
   {
     "success": true,
     "data": { /* CreditTransaction record */ }
   }
   ```
6. Error responses:
   - 403 if non-admin attempts access
   - 404 if user/subscription not found
7. Endpoint added to admin routes file

**Technical Notes:**
- File: `backend/src/routes/admin.routes.ts`
- Instantiate AdminCreditService in route handler
- Pass request.user as context for audit trail
- Credit amount must be positive integer

---

### Story 3.3: Create Admin Credit History Endpoint

**As a** system administrator
**I want** to view credit transaction history for users
**So that** I can audit Enterprise credit allocations

**Acceptance Criteria:**
1. New endpoint: `GET /v1/admin/users/:userId/credits`
2. Route protected by: `[authMiddleware, rbacMiddleware(['ADMIN'])]`
3. Request schema validation:
   ```typescript
   params: z.object({ userId: z.string() })
   ```
4. Endpoint calls: `adminCreditService.getUserCreditHistory(userId)`
5. Success response (200):
   ```json
   {
     "success": true,
     "data": [
       {
         "id": "...",
         "type": "ADMIN_GRANT",
         "amount": 50,
         "balance": 150,
         "description": "Monthly allocation",
         "createdAt": "2025-10-23T...",
         "metadata": { ... }
       }
     ]
   }
   ```
6. Transactions sorted by `createdAt` descending (most recent first)
7. Error responses:
   - 403 if non-admin
   - 404 if user not found

**Technical Notes:**
- File: `backend/src/routes/admin.routes.ts`
- Returns array of CreditTransaction records
- Include transaction metadata for audit details
- No pagination initially (add later if needed)

---

### Story 3.4: Create Subscription Upgrade Endpoint

**As a** user
**I want** to upgrade my subscription via API
**So that** I can move from FREE to PREMIUM tier

**Acceptance Criteria:**
1. New endpoint: `POST /v1/subscriptions/:userId/upgrade`
2. Route protected by: `authMiddleware`
3. Request schema validation:
   ```typescript
   params: z.object({ userId: z.string() })
   body: z.object({
     plan: z.enum(['PREMIUM']),
     billingCycle: z.enum(['MONTHLY', 'ANNUAL']),
     stripePaymentMethodId: z.string()
   })
   ```
4. Endpoint calls: `subscriptionService.createSubscription(userId, plan, billingCycle)`
5. For now, payment processing is mocked (Stripe integration future story)
6. Success response (200):
   ```json
   {
     "success": true,
     "data": { /* Updated subscription record */ }
   }
   ```
7. Endpoint triggers assessment unlock for existing Freemium assessments (future enhancement)
8. Error responses:
   - 401 if unauthenticated
   - 403 if userId doesn't match authenticated user (unless admin)
   - 400 if invalid plan or billing cycle

**Technical Notes:**
- File: `backend/src/routes/subscription.routes.ts`
- Mock Stripe payment for now - add TODO comment for real integration
- Should update existing subscription, not create duplicate
- Send confirmation email (future enhancement)

---

### Story 3.5: Create Purchase Additional Assessment Endpoint

**As a** Premium user
**I want** to purchase additional assessments via API
**So that** I can complete more than my monthly allocation

**Acceptance Criteria:**
1. New endpoint: `POST /v1/subscriptions/:userId/purchase-assessment`
2. Route protected by: `authMiddleware`
3. Request schema validation:
   ```typescript
   params: z.object({ userId: z.string() })
   body: z.object({
     stripePriceId: z.string()
   })
   ```
4. Endpoint validates user has PREMIUM or ENTERPRISE plan
5. Endpoint calls: `subscriptionService.purchaseAdditionalAssessment(userId, stripePriceId)`
6. Success response (200):
   ```json
   {
     "success": true,
     "data": {
       "success": true,
       "creditsAdded": 50
     }
   }
   ```
7. Payment processing mocked initially
8. Error responses:
   - 401 if unauthenticated
   - 403 if userId doesn't match authenticated user
   - 404 if subscription not found
   - 402 if FREE tier user attempts purchase

**Technical Notes:**
- File: `backend/src/routes/subscription.routes.ts`
- €299 purchase adds 50 credits
- Stripe webhook will confirm payment in production
- For now, immediately add credits (mock successful payment)

---

### Story 3.6: Create Get Subscription Billing Info Endpoint

**As a** user
**I want** to retrieve my subscription and billing information
**So that** the frontend can display my current plan, credits, and renewal date

**Acceptance Criteria:**
1. New endpoint: `GET /v1/subscriptions/:userId/billing-info`
2. Route protected by: `authMiddleware`
3. Request schema validation:
   ```typescript
   params: z.object({ userId: z.string() })
   ```
4. Endpoint queries Subscription with select:
   ```typescript
   {
     plan: true,
     billingCycle: true,
     currentPeriodStart: true,
     currentPeriodEnd: true,
     creditsBalance: true,
     stripeSubscriptionId: true
   }
   ```
5. Success response (200):
   ```json
   {
     "success": true,
     "data": {
       "plan": "PREMIUM",
       "billingCycle": "MONTHLY",
       "currentPeriodStart": "2025-10-01T...",
       "currentPeriodEnd": "2025-11-01T...",
       "creditsBalance": 75,
       "stripeSubscriptionId": "sub_..."
     }
   }
   ```
6. Error responses:
   - 401 if unauthenticated
   - 403 if userId doesn't match authenticated user
   - 404 if subscription not found

**Technical Notes:**
- File: `backend/src/routes/subscription.routes.ts`
- Do NOT return sensitive Stripe fields (payment method, customer ID)
- Frontend uses this for displaying tier info and credit balance
- Include billing cycle for showing renewal messaging

---

### Story 3.7: Create Get User Assessment Quota Endpoint

**As a** frontend application
**I want** to retrieve user's assessment quota information
**So that** I can display "X of Y assessments used" warnings

**Acceptance Criteria:**
1. New endpoint: `GET /v1/user/assessment-quota`
2. Route protected by: `authMiddleware`
3. No request parameters (uses authenticated user ID)
4. Endpoint queries `UserAssessmentQuota` for authenticated user
5. Success response (200):
   ```json
   {
     "success": true,
     "data": {
       "userId": "...",
       "totalAssessmentsCreated": 2,
       "assessmentsThisMonth": 1,
       "assessmentsUsedThisMonth": 1,
       "plan": "FREE",
       "quotaLimit": 2,
       "quotaRemaining": 0
     }
   }
   ```
6. Response includes calculated fields:
   - `quotaLimit`: 2 for FREE, 2 for PREMIUM per cycle, -1 for ENTERPRISE (unlimited)
   - `quotaRemaining`: limit - used (or -1 if unlimited)
7. Error responses:
   - 401 if unauthenticated
   - 404 if quota record not found

**Technical Notes:**
- File: `backend/src/routes/user.routes.ts` (or create if doesn't exist)
- Join with Subscription to include plan information
- Calculate quota limits based on subscription tier
- Frontend uses this to show progress bars and warnings

---

## Definition of Done

- [ ] All 7 API endpoints implemented
- [ ] OpenAPI/Swagger documentation updated for new endpoints
- [ ] Request/response schemas validated with Zod
- [ ] All endpoints have proper error handling
- [ ] RBAC enforcement tested for admin endpoints
- [ ] Integration tests for all endpoints
- [ ] Code reviewed and merged

---

## Technical Dependencies

- Epic 1: AssessmentService, AdminCreditService, FreemiumContentService
- Epic 2: SubscriptionService, BillingService
- Existing: authMiddleware, rbacMiddleware
- Fastify framework with Zod validation

---

## API Documentation Requirements

Update Swagger documentation to include:
- New admin endpoints in "Admin" tag
- New subscription endpoints in "Subscription" tag
- Error response codes and messages
- Request/response examples

---

## Security Considerations

- All endpoints require authentication
- Admin endpoints require ADMIN role
- User-specific endpoints validate userId matches authenticated user
- No sensitive Stripe data exposed in responses
- Rate limiting on purchase endpoints (future enhancement)

---

## Testing Strategy

- Unit tests for request validation schemas
- Integration tests for successful requests
- Integration tests for error scenarios (403, 404, 402)
- Test admin vs non-admin access control
- Test quota exceeded scenarios
- Mock Stripe responses for payment-related endpoints
