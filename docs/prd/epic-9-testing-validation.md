# Epic 9: Testing & Validation (Pay-Gating)

**Epic ID:** 9
**Status:** Draft
**Priority:** P1 - High
**Estimated Effort:** 4-6 hours
**Dependencies:** Epic 5, 6, 7, 8 (Full implementation complete)

---

## Epic Description

Comprehensive testing and validation of the complete freemium pay-gating system including integration tests, manual QA scenarios, and smoke tests to ensure all user journeys work correctly across all three tiers.

---

## Business Value

- Prevent revenue-impacting bugs in billing logic
- Ensure seamless user experience across tier transitions
- Verify quota enforcement prevents abuse
- Validate admin tools work reliably for Enterprise management

---

## Stories

### Story 5.1: Create Freemium Gating Integration Tests

**As a** developer
**I want** comprehensive integration tests for freemium functionality
**So that** we catch bugs before they reach production

**Acceptance Criteria:**
1. New test file created: `backend/tests/integration/freemium-gating.test.ts`
2. Test suite includes:

   **Test: Freemium 2-Assessment Limit**
   - Create user with FREE subscription
   - Create 1st assessment → succeeds
   - Verify `totalAssessmentsCreated` = 1
   - Create 2nd assessment → succeeds
   - Verify `totalAssessmentsCreated` = 2
   - Attempt 3rd assessment → fails with `FREEMIUM_QUOTA_EXCEEDED`
   - Verify HTTP 402 response code
   - Verify error message includes upgrade prompt

   **Test: Freemium Mocked Content**
   - Create completed assessment for FREE user
   - Fetch assessment results
   - Verify `isRestricted: true`
   - Verify gaps array contains mocked data
   - Verify gap descriptions contain "[UNLOCK PREMIUM TO SEE DETAILS]"
   - Verify `aiStrategyMatrix.isRestricted: true`
   - Verify compliance score (riskScore) is visible

   **Test: Premium Full Content**
   - Create completed assessment for PREMIUM user
   - Fetch assessment results
   - Verify `isRestricted: false`
   - Verify gaps contain real data with remediation
   - Verify strategy matrix has real recommendations
   - Verify vendor matching data included

   **Test: Admin Credit Grant**
   - Admin user grants 50 credits to Enterprise user
   - Verify CreditTransaction created with type `ADMIN_GRANT`
   - Verify subscription balance increased by 50
   - Verify audit log entry created
   - Verify metadata includes granter userId

   **Test: Additional Assessment Purchase**
   - Premium user purchases additional assessment
   - Verify 50 credits added to balance
   - Verify CreditTransaction created with type `PURCHASE`
   - Verify `creditsPurchased` incremented
   - Verify metadata includes price (29900 cents)

3. All tests use real database (test database)
4. Tests clean up data after execution
5. Tests use factory functions for creating test data
6. All assertions include clear failure messages

**Technical Notes:**
- Use Vitest as test runner
- Setup: Create test users with each subscription tier
- Teardown: Clean up all test data
- Mock Stripe API calls (don't hit real Stripe)
- Use `beforeAll`, `afterAll` for test setup/cleanup

---

### Story 5.2: Create Subscription Renewal Integration Tests

**As a** developer
**I want** tests for subscription renewal logic
**So that** billing cycles process correctly

**Acceptance Criteria:**
1. New test file: `backend/tests/integration/billing-renewal.test.ts`
2. Test suite includes:

   **Test: Monthly Renewal**
   - Create PREMIUM subscription with MONTHLY billing cycle
   - Set `currentPeriodEnd` to yesterday
   - Call `billingService.processSubscriptionRenewal()`
   - Verify new `currentPeriodStart` = now
   - Verify new `currentPeriodEnd` = now + 1 month
   - Verify `renewalDate` updated
   - Verify `assessmentsUsedThisMonth` reset to 0
   - Verify invoice generated with amount 599 EUR

   **Test: Annual Renewal**
   - Create PREMIUM subscription with ANNUAL billing cycle
   - Set `currentPeriodEnd` to yesterday
   - Call `billingService.processSubscriptionRenewal()`
   - Verify new `currentPeriodEnd` = now + 1 year
   - Verify invoice generated with amount 6490.80 EUR
   - Verify `assessmentsUsedThisMonth` NOT reset (annual)

   **Test: FREE Tier No Renewal**
   - Create FREE subscription (no billingCycle)
   - Call `billingService.processSubscriptionRenewal()`
   - Verify method returns early (no changes)
   - Verify no invoice generated

3. All date calculations verified accurately
4. Invoice generation tested with correct amounts
5. Quota resets tested for monthly cycles

**Technical Notes:**
- Mock current date for predictable testing
- Use `jest.useFakeTimers()` or equivalent
- Verify timezone handling (UTC)
- Test edge cases: month-end dates, leap years

---

### Story 5.3: Create API Endpoint Integration Tests

**As a** developer
**I want** tests for all new API endpoints
**So that** request/response contracts are validated

**Acceptance Criteria:**
1. New test file: `backend/tests/integration/pay-gating-api.test.ts`
2. Test suite includes:

   **Test: POST /v1/assessments - Quota Check**
   - FREE user with 2 assessments attempts creation
   - Verify HTTP 402 response
   - Verify error code: FREEMIUM_QUOTA_EXCEEDED
   - Verify response includes `upgradeUrl`

   **Test: POST /v1/admin/users/:userId/credits**
   - Admin grants 100 credits to user
   - Verify HTTP 200 response
   - Verify CreditTransaction returned in response
   - Non-admin attempts same → verify HTTP 403

   **Test: GET /v1/admin/users/:userId/credits**
   - Fetch credit history for user
   - Verify array of transactions returned
   - Verify sorted by date descending
   - Non-admin attempts → verify HTTP 403

   **Test: POST /v1/subscriptions/:userId/upgrade**
   - User upgrades to PREMIUM MONTHLY
   - Verify HTTP 200 response
   - Verify subscription updated with billingCycle
   - Verify creditsBalance = 100

   **Test: POST /v1/subscriptions/:userId/purchase-assessment**
   - Premium user purchases additional assessment
   - Verify HTTP 200 response
   - Verify creditsAdded = 50
   - FREE user attempts → verify HTTP 402 or 403

   **Test: GET /v1/subscriptions/:userId/billing-info**
   - Fetch billing info
   - Verify all required fields returned
   - Verify sensitive Stripe fields NOT returned

   **Test: GET /v1/user/assessment-quota**
   - Fetch quota for FREE user with 1 assessment
   - Verify quotaLimit = 2
   - Verify quotaRemaining = 1

3. All tests include authentication headers
4. Tests verify response schema structure
5. Error responses validated (status codes, error messages)

**Technical Notes:**
- Use Fastify test utilities: `app.inject()`
- Create JWT tokens for test users
- Validate response schemas match API spec
- Test with different user roles (USER, ADMIN)

---

### Story 5.4: Manual QA Test Plan - Freemium User Journey

**As a** QA engineer
**I want** a comprehensive manual test plan for Freemium users
**So that** we validate the complete user experience

**Acceptance Criteria:**
1. Test plan document created: `docs/qa/freemium-user-journey.md`
2. Test plan covers:

   **Pre-conditions:**
   - Fresh user account with FREE subscription
   - No prior assessments created

   **Test Steps:**
   1. Navigate to AssessmentTemplates page
   2. Verify quota warning shows "0 of 2 assessments used"
   3. Select template and create 1st assessment
   4. Complete assessment with answers
   5. View results - verify compliance score visible
   6. Verify gap analysis is blurred with "Upgrade" prompt
   7. Verify strategy matrix is blurred
   8. Verify vendor section shows browse list only (no matching)
   9. Create 2nd assessment
   10. Verify quota warning shows "2 of 2 assessments used"
   11. Attempt to create 3rd assessment
   12. Verify modal appears: "Assessment Limit Reached"
   13. Click "Upgrade to Premium" button
   14. Verify redirects to Pricing page
   15. Verify Freemium card shows "Current Plan"

   **Expected Results:**
   - All blurred content displays correctly
   - Upgrade prompts shown at appropriate times
   - No console errors or broken UI
   - Clear path to upgrade from every restriction

3. Test plan includes screenshots for expected results
4. Pass/fail criteria defined for each step
5. Test executed and results documented

**Technical Notes:**
- Use real browser testing (not automated)
- Test on Chrome, Firefox, Safari
- Test on desktop and mobile viewports
- Document any bugs found with steps to reproduce

---

### Story 5.5: Manual QA Test Plan - Premium User Journey

**As a** QA engineer
**I want** a comprehensive test plan for Premium users
**So that** we validate full feature access

**Acceptance Criteria:**
1. Test plan document: `docs/qa/premium-user-journey.md`
2. Test plan covers:

   **Pre-conditions:**
   - User with PREMIUM MONTHLY subscription
   - creditsBalance = 100

   **Test Steps:**
   1. Navigate to Dashboard
   2. Verify subscription status shows "Premium"
   3. Verify credit balance displays correctly
   4. Create 1st assessment
   5. Complete assessment
   6. View results - verify full gap analysis (not blurred)
   7. Verify strategy matrix shows detailed recommendations
   8. Verify vendor matching section with AI scores
   9. Download PDF report - verify generates successfully
   10. Create 2nd assessment
   11. Verify both assessments counted toward "2 included"
   12. Click "Purchase Additional Assessment" button
   13. Confirm purchase for €299
   14. Verify credit balance increased by 50
   15. Create 3rd assessment successfully
   16. Navigate to Pricing page
   17. Verify Premium card shows "Current Plan"
   18. View billing info - verify shows renewal date

   **Expected Results:**
   - All premium features accessible
   - No blurred content
   - Additional purchase flow works smoothly
   - Credit balance updates correctly

3. Test includes testing both MONTHLY and ANNUAL billing cycles
4. Test verifies renewal date calculations
5. Pass/fail documented

**Technical Notes:**
- Test with real backend API
- Verify PDF reports render correctly
- Test credit deductions on assessment completion
- Check for any UI glitches with large credit balances

---

### Story 5.6: Manual QA Test Plan - Admin Credit Management

**As a** QA engineer
**I want** a test plan for admin credit granting
**So that** Enterprise management tools work reliably

**Acceptance Criteria:**
1. Test plan document: `docs/qa/admin-credit-management.md`
2. Test plan covers:

   **Pre-conditions:**
   - Admin user logged in
   - Enterprise user exists with 0 credits

   **Test Steps:**
   1. Navigate to Admin → User Management
   2. Find Enterprise user in table
   3. Click "Manage Credits" button
   4. Verify side panel opens
   5. Verify current balance shown = 0
   6. Enter amount: 200
   7. Enter reason: "Q1 2025 allocation"
   8. Click "Grant Credits"
   9. Verify success toast appears
   10. Verify user table refreshes
   11. Verify user balance now shows 200
   12. Re-open credit panel for same user
   13. Verify transaction history shows grant
   14. Verify history includes: date, type (ADMIN_GRANT), amount, reason
   15. Attempt access as non-admin user
   16. Verify 403 error or hidden UI element

   **Expected Results:**
   - Credits granted successfully
   - Audit trail visible in history
   - Non-admin users cannot access feature
   - Form validation prevents negative amounts

3. Test includes granting large amounts (1000+ credits)
4. Test includes rapid multiple grants
5. Pass/fail documented

**Technical Notes:**
- Test with RBAC enforcement
- Verify audit log entries in database
- Test form validation (negative numbers, zero, strings)
- Check transaction history pagination if implemented

---

### Story 5.7: Smoke Tests for Upgrade Flow

**As a** QA engineer
**I want** quick smoke tests for critical upgrade paths
**So that** we can verify deployments quickly

**Acceptance Criteria:**
1. Smoke test checklist: `docs/qa/upgrade-flow-smoke.md`
2. Tests cover:

   **Smoke Test 1: FREE → PREMIUM Upgrade**
   - Time estimate: 3 minutes
   - Steps:
     1. Login as FREE user with 2 completed assessments
     2. Navigate to Pricing page
     3. Click "Upgrade Now" on Premium card
     4. Select MONTHLY billing cycle
     5. Confirm upgrade (mocked payment)
     6. Verify redirects to Dashboard
     7. Verify subscription status = "Premium"
     8. Navigate to existing assessment results
     9. Verify gaps now visible (not blurred)
   - Pass criteria: Assessment content unlocked

   **Smoke Test 2: Additional Assessment Purchase**
   - Time estimate: 2 minutes
   - Steps:
     1. Login as PREMIUM user
     2. Click "Purchase Additional Assessment"
     3. Confirm €299 purchase
     4. Verify credit balance increased
   - Pass criteria: Credits added successfully

   **Smoke Test 3: Admin Credit Grant**
   - Time estimate: 2 minutes
   - Steps:
     1. Login as ADMIN
     2. Grant 50 credits to test Enterprise user
     3. Verify success message
   - Pass criteria: Credits granted, visible in history

3. All smoke tests executable in < 10 minutes total
4. Clear pass/fail for each test
5. Can be run by non-technical stakeholders

**Technical Notes:**
- Use in pre-production and post-deployment
- Tests should use test accounts (not prod data)
- Automate these smoke tests in future (Playwright)

---

## Definition of Done

- [ ] All integration test suites passing
- [ ] All manual QA test plans executed and documented
- [ ] Smoke tests passing
- [ ] Critical bugs fixed before release
- [ ] Test coverage > 80% for new code
- [ ] All tests added to CI/CD pipeline

---

## Technical Dependencies

- Vitest test runner configured
- Test database setup
- Test user accounts with each tier
- Mocked Stripe API responses

---

## Test Data Requirements

Create test accounts:
- `test-free@heliolus.com` - FREE tier with 0 assessments
- `test-premium-monthly@heliolus.com` - PREMIUM MONTHLY with 100 credits
- `test-premium-annual@heliolus.com` - PREMIUM ANNUAL with 100 credits
- `test-enterprise@heliolus.com` - ENTERPRISE with 0 credits
- `test-admin@heliolus.com` - ADMIN role

---

## Bug Tracking

All bugs found during testing logged with:
- Severity (Critical, High, Medium, Low)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/video if UI bug
- Assigned to developer for fix

---

## Regression Testing

After all fixes:
- Re-run full integration test suite
- Re-execute failed manual tests
- Verify no new bugs introduced
- Final smoke test before production deployment

---

## Success Metrics

- Zero critical bugs at launch
- All P0 test scenarios passing
- < 5 known minor bugs (P2/P3)
- All upgrade flows tested and working
- Admin tools tested and documented
