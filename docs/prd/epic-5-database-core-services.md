# Epic 5: Database Schema & Core Services (Pay-Gating)

**Epic ID:** 5
**Status:** Draft
**Priority:** P0 - Critical
**Estimated Effort:** 8-10 hours
**Dependencies:** None

---

## Epic Description

Implement the foundational database schema changes and core services required to support the new freemium tier structure with assessment quotas, mocked content for free users, and admin credit management for Enterprise customers.

---

## Business Value

- Enable freemium tier with 2 lifetime assessment limit
- Reduce OpenAI API costs by serving mocked content to free users
- Support Enterprise tier with manual credit allocation
- Track billing cycles (monthly/annual) for Premium subscriptions

---

## Stories

### Story 5.1: Add Subscription Billing Cycle Fields

**As a** system administrator
**I want** subscription records to track billing cycles (monthly/annual)
**So that** we can properly manage Premium subscription renewals and pricing

**Acceptance Criteria:**
1. Subscription model has `billingCycle` enum field (MONTHLY, ANNUAL)
2. Subscription model has `billingEmail` string field
3. Subscription model has `renewalDate` datetime field
4. Subscription model has `stripePriceId` string field for linking to Stripe price objects
5. Migration is created and can be applied without data loss
6. Existing FREE subscriptions default to NULL billing cycle (no auto-renew)

**Technical Notes:**
- Add new enum: `BillingCycle` with values MONTHLY, ANNUAL
- Update Prisma schema in `backend/prisma/schema.prisma`
- Fields should be optional (nullable) to support FREE tier

---

### Story 5.2: Create UserAssessmentQuota Model

**As a** system
**I want** to track assessment usage per user across all tiers
**So that** we can enforce Freemium limits (2 total), Premium limits (2 per cycle), and Enterprise unlimited access

**Acceptance Criteria:**
1. New `UserAssessmentQuota` model created with following fields:
   - `id` (cuid, primary key)
   - `userId` (string, unique, foreign key to User)
   - `totalAssessmentsCreated` (int, default 0) - for Freemium tracking
   - `assessmentsThisMonth` (int, default 0) - for Premium billing cycle
   - `assessmentsUsedThisMonth` (int, default 0) - for Premium tracking
   - `createdAt`, `updatedAt` timestamps
2. Index on `userId` for fast lookups
3. Cascade delete when user is deleted
4. Migration created and tested
5. Initial quota records created for all existing users (default values)

**Technical Notes:**
- This table tracks quota across all subscription tiers
- Freemium: uses `totalAssessmentsCreated` (max 2 lifetime)
- Premium: uses `assessmentsUsedThisMonth` (max 2 per billing cycle)
- Enterprise: no limits checked

---

### Story 5.3: Add ADMIN_GRANT to TransactionType Enum

**As a** system administrator
**I want** to record when credits are manually granted to users
**So that** we have an audit trail of Enterprise credit allocations

**Acceptance Criteria:**
1. `TransactionType` enum includes new value `ADMIN_GRANT`
2. Existing transaction types remain unchanged
3. Migration created successfully
4. Enum can be used in CreditTransaction records

**Technical Notes:**
- Update enum in `backend/prisma/schema.prisma`
- Existing values: PURCHASE, DEBIT, CREDIT, REFUND, ADJUSTMENT
- Add: ADMIN_GRANT (for manual credit grants by admins)

---

### Story 5.4: Create FreemiumContentService

**As a** Freemium user
**I want** to see blurred/mocked gap analysis and strategy matrix
**So that** I understand the value proposition without incurring OpenAI API costs for the platform

**Acceptance Criteria:**
1. Service class `FreemiumContentService` created extending `BaseService`
2. Method `generateMockedGapAnalysis()` returns 3-5 generic gaps with:
   - Generic titles (e.g., "Risk Area 1", "Compliance Gap 2")
   - Description: "[UNLOCK PREMIUM TO SEE DETAILS]"
   - Generic severity levels
   - No evidence or remediation content
   - `isRestricted: true` flag
3. Method `generateMockedStrategyMatrix()` returns blurred matrix with:
   - Generic coordinates
   - Hidden item details
   - Summary: "Upgrade to Premium to see personalized strategy recommendations"
   - `isRestricted: true` flag
4. Method `shouldGenerateRealAnalysis(userId)` checks user's subscription plan and returns boolean
5. Service does NOT call OpenAI API
6. Service uses consistent mock data structure matching real Gap/StrategyMatrix models

**Technical Notes:**
- File location: `backend/src/services/freemium-content.service.ts`
- Import from: `./base.service`
- Mock data should be generated, not hardcoded, to appear varied
- Must match database Gap/Risk models for seamless frontend rendering

---

### Story 5.5: Create AdminCreditService

**As a** system administrator
**I want** to manually grant credits to Enterprise users
**So that** I can manage custom Enterprise billing arrangements

**Acceptance Criteria:**
1. Service class `AdminCreditService` created extending `BaseService`
2. Method `addCreditsToUser(userId, amount, reason, context)`:
   - Requires admin role (uses `this.requireAdmin(context)`)
   - Creates `CreditTransaction` record with type `ADMIN_GRANT`
   - Updates `Subscription.creditsBalance`
   - Records granter's userId in transaction metadata
   - Creates audit log entry
3. Method `getUserCreditHistory(userId)` returns all credit transactions for user ordered by date descending
4. Service throws appropriate errors:
   - 404 if subscription not found
   - 403 if non-admin attempts to grant credits
5. All database operations wrapped in transaction for atomicity

**Technical Notes:**
- File location: `backend/src/services/admin-credit.service.ts`
- Uses existing `CreditTransaction` model
- Audit log action: 'CREDITS_GRANTED'
- Must increment `creditsBalance` atomically

---

### Story 5.6: Update AssessmentService with Quota Checks

**As a** system
**I want** assessment creation to check user quotas
**So that** Freemium users are limited to 2 assessments total

**Acceptance Criteria:**
1. `createAssessment()` method checks user subscription plan before creating assessment
2. For FREE tier users:
   - Query `UserAssessmentQuota` for `totalAssessmentsCreated`
   - If >= 2, throw error with code 'FREEMIUM_QUOTA_EXCEEDED'
   - Error message: "Free users can create maximum 2 assessments. Upgrade to Premium for unlimited access."
   - If < 2, increment `totalAssessmentsCreated` after successful assessment creation
3. For PREMIUM/ENTERPRISE users: no quota check, assessment created normally
4. Quota increment happens in same transaction as assessment creation
5. If assessment creation fails, quota is not incremented

**Technical Notes:**
- Modify: `backend/src/services/assessment.service.ts`
- Use existing `createAssessment()` method
- HTTP status code for quota exceeded: 402 Payment Required
- Must query user subscription to determine tier

---

### Story 5.7: Update AssessmentService to Serve Mocked Content

**As a** Freemium user
**I want** to receive mocked gap analysis and strategy matrix when viewing assessment results
**So that** I see the structure but am prompted to upgrade for full details

**Acceptance Criteria:**
1. `getAssessmentResults()` method checks user subscription plan
2. For FREE tier users:
   - Call `FreemiumContentService.generateMockedGapAnalysis()` to replace real gaps
   - Mark `aiStrategyMatrix.isRestricted = true`
   - Replace strategy matrix content with '[UNLOCK PREMIUM TO SEE]'
   - Return assessment with `isRestricted: true` flag
   - Include `restrictionReason: 'Upgrade to Premium to see full analysis'`
3. For PREMIUM/ENTERPRISE users:
   - Return real gaps, risks, and strategy matrix from database
   - `isRestricted: false`
4. Compliance score (riskScore) is ALWAYS visible regardless of tier
5. Vendor AI matching is hidden for FREE tier (handled separately)

**Technical Notes:**
- Modify: `backend/src/services/assessment.service.ts`
- Instantiate FreemiumContentService in method
- Do NOT run real AI analysis for FREE users during assessment completion
- Real analysis should only run after user upgrades (future story)

---

## Definition of Done

- [ ] All Prisma schema changes completed
- [ ] Migrations generated and tested
- [ ] All service classes created with full test coverage
- [ ] Database seeding updated for new models
- [ ] No breaking changes to existing API responses
- [ ] Code reviewed and merged

---

## Technical Dependencies

- Prisma ORM
- Existing BaseService class
- Existing User, Subscription, Assessment models
- Existing authentication middleware

---

## Risks & Mitigations

**Risk:** Existing assessments might not have quota records
**Mitigation:** Migration script creates default quota records for all existing users

**Risk:** Concurrent assessment creation could bypass quota
**Mitigation:** Use database transactions and optimistic locking

**Risk:** Mocked content might not render correctly in frontend
**Mitigation:** Match exact data structure of real Gap/Risk models
