# Epic 6: Billing Services (Pay-Gating)

**Epic ID:** 6
**Status:** Draft
**Priority:** P0 - Critical
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 5 (Database Schema)

---

## Epic Description

Implement subscription billing logic to support monthly (€599) and annual (€6,490) Premium plans, additional assessment purchases (€299), and subscription renewal workflows.

---

## Business Value

- Enable Premium subscription revenue (monthly/annual)
- Support additional assessment purchases at €299
- Automate billing cycle management
- Track credit allocations per billing cycle

---

## Stories

### Story 2.1: Define Pricing Constants in SubscriptionService

**As a** developer
**I want** centralized pricing configuration
**So that** all billing operations use consistent pricing across the system

**Acceptance Criteria:**
1. Pricing constants object created in `SubscriptionService`:
   ```typescript
   const PRICING = {
     PREMIUM_MONTHLY: { price: 59900, currency: 'eur', billingCycle: 'month' },
     PREMIUM_ANNUAL: { price: 649080, currency: 'eur', billingCycle: 'year' },
     ADDITIONAL_ASSESSMENT: { price: 29900, currency: 'eur' }
   }
   ```
2. Prices stored in cents (Stripe convention)
3. Annual price correctly calculated: €599 × 12 × 0.9 = €6,490.80
4. Constants are exported for use in other services
5. Prices match V4 Pay-Gating Plan specification

**Technical Notes:**
- Location: `backend/src/services/subscription.service.ts`
- All monetary values in cents (multiply euros by 100)
- 10% annual discount baked into PREMIUM_ANNUAL price

---

### Story 2.2: Update createSubscription Method with Billing Cycle

**As a** system
**I want** to create subscriptions with billing cycle information
**So that** we can track renewal dates and billing frequency

**Acceptance Criteria:**
1. `createSubscription()` method accepts new parameter: `billingCycle?: BillingCycle`
2. Method calculates `currentPeriodStart` as now
3. Method calculates `currentPeriodEnd` based on billing cycle:
   - MONTHLY: now + 1 month
   - ANNUAL: now + 1 year
   - NULL (FREE): no period end
4. Method sets `renewalDate` equal to `currentPeriodEnd`
5. Method sets `creditsBalance` based on plan:
   - FREE: 0 credits
   - PREMIUM: 100 credits (enough for ~2 assessments)
   - ENTERPRISE: 0 credits (admin grants manually)
6. Method creates subscription record with all billing fields populated
7. Method creates initial `UserAssessmentQuota` record for new user

**Technical Notes:**
- Modify: `backend/src/services/subscription.service.ts`
- Use Date arithmetic for period calculations
- Ensure timezone-safe date handling
- Return created subscription with all fields

---

### Story 2.3: Implement Purchase Additional Assessment

**As a** Premium user
**I want** to purchase additional assessments for €299
**So that** I can complete more assessments beyond my monthly allocation

**Acceptance Criteria:**
1. Method `purchaseAdditionalAssessment(userId, stripePriceId)` created
2. Method validates user has PREMIUM or ENTERPRISE subscription
3. For successful payment (mocked for now):
   - Add 50 credits to `creditsBalance`
   - Increment `creditsPurchased` by 50
   - Create `CreditTransaction` record:
     - Type: PURCHASE
     - Amount: 50
     - Description: "Purchased additional assessment credits"
     - Metadata: `{ amount: 29900, stripePriceId }`
   - Return: `{ success: true, creditsAdded: 50 }`
4. If subscription not found, throw 404 error
5. All operations in single database transaction

**Technical Notes:**
- €299 = 50 credits (adjust if needed for template costs)
- In real implementation, this would integrate with Stripe webhook
- For now, assume payment succeeded (mock)
- Record both credit balance update AND transaction log

---

### Story 2.4: Create BillingService with Renewal Logic

**As a** system
**I want** automated subscription renewal processing
**So that** monthly and annual subscriptions are renewed correctly

**Acceptance Criteria:**
1. New service `BillingService` created extending `BaseService`
2. Method `processSubscriptionRenewal(subscriptionId)`:
   - Validates subscription exists and has `billingCycle` set
   - Generates invoice record (mocked Stripe ID for now)
   - Updates subscription period:
     - `currentPeriodStart` = now
     - `currentPeriodEnd` = now + billing cycle duration
     - `renewalDate` = new currentPeriodEnd
   - For MONTHLY renewals: Resets `UserAssessmentQuota.assessmentsUsedThisMonth` to 0
   - For ANNUAL renewals: No quota reset needed
   - Returns void on success
3. Method handles subscriptions without `billingCycle` gracefully (FREE tier)
4. All updates in single transaction
5. Error handling for failed renewals (log and notify)

**Technical Notes:**
- File: `backend/src/services/billing.service.ts`
- In production: called by Stripe webhook or scheduled cron job
- Generate invoice with proper period dates
- Invoice amount based on billingCycle (MONTHLY: €599, ANNUAL: €6,490.80)

---

### Story 2.5: Implement Invoice Generation Helper

**As a** billing system
**I want** to generate invoice records for subscriptions
**So that** we have a financial audit trail

**Acceptance Criteria:**
1. Private method `generateInvoice(subscription)` created in `BillingService`
2. Method creates `Invoice` record with:
   - `subscriptionId`: from parameter
   - `stripeInvoiceId`: `draft-{timestamp}` (real Stripe ID in production)
   - `amount`: Based on billingCycle (ANNUAL: 6490.80, MONTHLY: 599.00)
   - `currency`: 'EUR'
   - `status`: InvoiceStatus.DRAFT
   - `periodStart`: subscription.currentPeriodStart
   - `periodEnd`: subscription.currentPeriodEnd
   - `dueDate`: currentPeriodEnd + 14 days
3. Method returns created Invoice record
4. Amount stored in euros (not cents) for Invoice model
5. Method does NOT process payment (that's Stripe's job)

**Technical Notes:**
- Helper method for `processSubscriptionRenewal`
- Convert cents to euros when storing: `amount / 100`
- Due date gives 14-day grace period after period end
- Status starts as DRAFT until Stripe confirms payment

---

### Story 2.6: Add Get Initial Credits Helper

**As a** subscription service
**I want** standardized credit allocation on subscription creation
**So that** new subscriptions get correct starting balance

**Acceptance Criteria:**
1. Private method `getInitialCredits(plan: SubscriptionPlan)` created in `SubscriptionService`
2. Method returns credits based on plan:
   - FREE: 0 credits
   - PREMIUM: 100 credits
   - ENTERPRISE: 0 credits
3. Method used by `createSubscription` to set initial `creditsBalance`
4. Credits sufficient for Premium users to complete ~2 assessments
5. Enterprise gets 0 because admin grants credits manually

**Technical Notes:**
- Premium gets 100 credits initially (assumes ~50 credits per assessment)
- If template costs vary significantly, this may need adjustment
- Used only during subscription creation, not renewals

---

## Definition of Done

- [ ] All billing service methods implemented
- [ ] Pricing constants match business requirements
- [ ] Invoice generation working correctly
- [ ] Unit tests for all billing logic
- [ ] Renewal workflow tested with mocked Stripe data
- [ ] Code reviewed and merged

---

## Technical Dependencies

- Epic 1 complete (BillingCycle enum, updated Subscription model)
- Existing Invoice model
- Existing CreditTransaction model
- Stripe SDK (for future integration)

---

## Risks & Mitigations

**Risk:** Renewal timing might miss billing window
**Mitigation:** Use scheduled cron job + Stripe webhooks as backup

**Risk:** Credit amounts might be insufficient for complex assessments
**Mitigation:** Track actual credit usage and adjust PREMIUM initial credits

**Risk:** Invoice generation might fail silently
**Mitigation:** Add comprehensive error logging and alerting

---

## Future Enhancements (Post-MVP)

- Real Stripe payment processing integration
- Prorated billing for mid-cycle upgrades
- Credit rollover for unused assessments
- Dunning management for failed payments
