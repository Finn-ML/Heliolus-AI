# Plan Management & Coupon System - Implementation Handover

**Date**: 2025-10-27
**Feature**: Subscription Plan Management & Discount Coupon System
**Status**: Backend Complete | Frontend UI Pending
**Stripe Integration**: Fully Implemented

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [API Endpoints](#api-endpoints)
5. [Stripe Integration](#stripe-integration)
6. [Usage Guide](#usage-guide)
7. [Remaining Work](#remaining-work)
8. [Testing Instructions](#testing-instructions)
9. [Code References](#code-references)

---

## Overview

This feature enables administrators to:
- **Create and manage subscription plans** with flexible pricing (monthly/annual)
- **Configure plan benefits**: credits, assessments, features, trial periods
- **Integrate with Stripe**: automatic product/price creation and synchronization
- **Create discount coupons** for marketing campaigns and promotions
- **Apply coupons at checkout** to reduce subscription costs

### Key Capabilities

✅ **Plan Management**
- Create plans with custom pricing and credit allocations
- Update plan details and pricing (with Stripe sync option)
- Activate/deactivate plans for public visibility
- Stripe product and price auto-creation

✅ **Coupon Management**
- Percentage-based discounts (e.g., 20% off)
- Fixed-amount discounts (e.g., $50 off)
- Time-limited campaigns (start/end dates)
- Usage limits (max redemptions)
- Plan-specific restrictions
- New customer only coupons
- Stripe coupon integration

---

## Database Schema

### 1. Plan Model

**Location**: `/backend/prisma/schema.prisma` (lines 769-811)

```prisma
model Plan {
  id   String @id @default(cuid())
  slug String @unique // e.g., "premium", "enterprise"

  // Basic Info
  name        String   // Display name
  description String?  // Marketing description
  isActive    Boolean  @default(true)
  isPublic    Boolean  @default(true)

  // Pricing
  monthlyPrice Decimal @default(0)
  annualPrice  Decimal @default(0)
  currency     String  @default("USD")

  // Stripe Integration
  stripeProductId       String? @unique
  stripeMonthlyPriceId  String? @unique
  stripeAnnualPriceId   String? @unique

  // Credits & Limits
  monthlyCredits    Int @default(0)  // Credits per month
  assessmentCredits Int @default(0)  // Credits per assessment
  maxAssessments    Int @default(0)  // 0 = unlimited
  maxUsers          Int @default(1)  // Team size limit

  // Features
  features Json? // ["Advanced Analytics", "Priority Support"]

  // Trial
  trialDays Int @default(0)

  // Display
  displayOrder Int      @default(0)
  metadata     Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Indexes**:
- `slug` (unique)
- `isActive`
- `isPublic`
- `displayOrder`
- `stripeProductId`, `stripeMonthlyPriceId`, `stripeAnnualPriceId` (unique)

### 2. Coupon Model

**Location**: `/backend/prisma/schema.prisma` (lines 813-851)

```prisma
model Coupon {
  id   String @id @default(cuid())
  code String @unique // e.g., "SAVE20"

  // Stripe Integration
  stripeCouponId String? @unique

  // Discount Details
  discountType  CouponDiscountType // PERCENTAGE | FIXED_AMOUNT
  discountValue Decimal            // 20 for 20% or 50 for $50
  currency      String? @default("USD")

  // Validity
  isActive       Boolean   @default(true)
  maxRedemptions Int?      // null = unlimited
  timesRedeemed  Int       @default(0)
  validFrom      DateTime  @default(now())
  validUntil     DateTime? // null = no expiry

  // Restrictions
  applicablePlans   String[]  // Plan slugs (empty = all)
  minimumAmount     Decimal?  // Minimum purchase
  newCustomersOnly  Boolean   @default(false)
  durationInMonths  Int?      // For subscriptions

  // Metadata
  name        String?
  description String?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Indexes**:
- `code` (unique)
- `isActive`
- `validFrom`, `validUntil`
- `stripeCouponId` (unique)

### 3. CouponDiscountType Enum

**Location**: `/backend/prisma/schema.prisma` (lines 206-209)

```prisma
enum CouponDiscountType {
  PERCENTAGE    // e.g., 20% off
  FIXED_AMOUNT  // e.g., $50 off
}
```

---

## Backend Implementation

### 1. Plan Service

**File**: `/backend/src/services/plan.service.ts`

**Key Methods**:

```typescript
class PlanService extends BaseService {
  // Create plan with optional Stripe integration
  async createPlan(data, context): Promise<ApiResponse>

  // Update plan (with optional Stripe sync)
  async updatePlan(id, data, context): Promise<ApiResponse>

  // Get plan by ID
  async getPlanById(id): Promise<ApiResponse>

  // Get plan by slug
  async getPlanBySlug(slug): Promise<ApiResponse>

  // List plans with filtering
  async listPlans(options): Promise<ApiResponse<PaginatedResponse>>

  // Soft delete (deactivate)
  async deletePlan(id, context): Promise<ApiResponse>
}
```

**Stripe Integration Features**:
- Auto-creates Stripe Product when plan is created
- Creates Stripe Prices for monthly and annual billing
- Supports trial period configuration
- Handles currency conversion (dollars → cents)
- Stores Stripe IDs for future reference

**Example Plan Creation**:
```typescript
const result = await planService.createPlan({
  slug: 'premium',
  name: 'Premium Plan',
  description: 'Full access to all features',
  monthlyPrice: 99.00,
  annualPrice: 990.00,
  currency: 'USD',
  monthlyCredits: 100,
  assessmentCredits: 25,
  maxAssessments: 10,
  maxUsers: 5,
  features: ['Advanced Analytics', 'Priority Support', 'API Access'],
  trialDays: 14,
  createInStripe: true, // Creates Stripe product/prices
});
```

### 2. Coupon Service

**File**: `/backend/src/services/coupon.service.ts`

**Key Methods**:

```typescript
class CouponService extends BaseService {
  // Create coupon with Stripe integration
  async createCoupon(data, context): Promise<ApiResponse>

  // Update coupon (metadata only in Stripe)
  async updateCoupon(id, data, context): Promise<ApiResponse>

  // Get coupon by ID
  async getCouponById(id): Promise<ApiResponse>

  // Get coupon by code
  async getCouponByCode(code): Promise<ApiResponse>

  // List coupons with filtering
  async listCoupons(options): Promise<ApiResponse<PaginatedResponse>>

  // Validate coupon for use
  async validateCoupon(data): Promise<ApiResponse>

  // Redeem coupon (increment count)
  async redeemCoupon(code, context): Promise<ApiResponse>

  // Delete coupon (deactivate & remove from Stripe)
  async deleteCoupon(id, context): Promise<ApiResponse>
}
```

**Coupon Validation Logic**:
The `validateCoupon` method checks:
1. Coupon exists and is active
2. Within validity period (validFrom → validUntil)
3. Redemption limit not reached
4. Matches customer type (new/existing)
5. Applicable to selected plan
6. Meets minimum purchase amount

**Returns**:
```typescript
{
  valid: boolean,
  coupon?: Coupon,
  reason?: string, // If invalid
  discountAmount?: number // Calculated discount
}
```

**Example Coupon Creation**:
```typescript
const result = await couponService.createCoupon({
  code: 'LAUNCH50',
  name: 'Launch Promo',
  description: '50% off for new customers',
  discountType: 'PERCENTAGE',
  discountValue: 50,
  validUntil: new Date('2025-12-31'),
  maxRedemptions: 100,
  newCustomersOnly: true,
  durationInMonths: 3,
  createInStripe: true,
});
```

---

## API Endpoints

### Plan Management Routes

**Base URL**: `/v1/admin/plans`
**Authentication**: Admin role required
**File**: `/backend/src/routes/plan.routes.ts`

#### List Plans
```http
GET /v1/admin/plans?activeOnly=true&publicOnly=true&page=1&limit=50
```

**Response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3,
    "pages": 1
  }
}
```

#### Get Plan by ID
```http
GET /v1/admin/plans/:id
```

#### Get Plan by Slug
```http
GET /v1/admin/plans/slug/:slug
```

**Example**: `GET /v1/admin/plans/slug/premium`

#### Create Plan
```http
POST /v1/admin/plans
Content-Type: application/json

{
  "slug": "premium",
  "name": "Premium Plan",
  "description": "Full access to platform",
  "monthlyPrice": 99.00,
  "annualPrice": 990.00,
  "currency": "USD",
  "monthlyCredits": 100,
  "assessmentCredits": 25,
  "maxAssessments": 10,
  "maxUsers": 5,
  "features": ["Advanced Analytics", "Priority Support"],
  "trialDays": 14,
  "isActive": true,
  "isPublic": true,
  "displayOrder": 2,
  "createInStripe": true
}
```

#### Update Plan
```http
PUT /v1/admin/plans/:id
Content-Type: application/json

{
  "name": "Premium Plus",
  "monthlyPrice": 129.00,
  "monthlyCredits": 150,
  "syncToStripe": false
}
```

**Note**: Set `syncToStripe: true` to update Stripe product metadata. Prices are immutable in Stripe.

#### Delete Plan
```http
DELETE /v1/admin/plans/:id
```

**Note**: Soft delete - sets `isActive` and `isPublic` to `false`.

---

### Coupon Management Routes

**Base URL**: `/v1/admin/coupons`
**Authentication**: Admin role required (except `/validate`)
**File**: `/backend/src/routes/coupon.routes.ts`

#### List Coupons
```http
GET /v1/admin/coupons?activeOnly=true&page=1&limit=50
```

#### Get Coupon by ID
```http
GET /v1/admin/coupons/:id
```

#### Get Coupon by Code
```http
GET /v1/admin/coupons/code/:code
```

**Example**: `GET /v1/admin/coupons/code/SAVE20`

#### Create Coupon
```http
POST /v1/admin/coupons
Content-Type: application/json

{
  "code": "SAVE20",
  "name": "20% Off Campaign",
  "description": "Summer sale discount",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "currency": "USD",
  "validFrom": "2025-06-01T00:00:00Z",
  "validUntil": "2025-08-31T23:59:59Z",
  "maxRedemptions": 500,
  "applicablePlans": ["premium", "enterprise"],
  "minimumAmount": 50,
  "newCustomersOnly": false,
  "durationInMonths": 1,
  "isActive": true,
  "createInStripe": true
}
```

#### Update Coupon
```http
PUT /v1/admin/coupons/:id
Content-Type: application/json

{
  "validUntil": "2025-09-30T23:59:59Z",
  "maxRedemptions": 1000,
  "isActive": true
}
```

**Note**: Stripe coupons are immutable except for metadata.

#### Delete Coupon
```http
DELETE /v1/admin/coupons/:id
```

**Note**: Deactivates coupon and deletes from Stripe.

#### Validate Coupon (Public Endpoint)
```http
POST /v1/admin/coupons/validate
Content-Type: application/json

{
  "code": "SAVE20",
  "planSlug": "premium",
  "amount": 99.00,
  "isNewCustomer": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "coupon": { ...couponDetails... },
    "discountAmount": 19.80
  }
}
```

Or if invalid:
```json
{
  "success": true,
  "data": {
    "valid": false,
    "reason": "Coupon has expired"
  }
}
```

---

## Stripe Integration

### Plan → Stripe Product/Prices

When `createInStripe: true` is set during plan creation:

1. **Create Stripe Product**:
```javascript
stripe.products.create({
  name: "Premium Plan",
  description: "Full access to platform",
  metadata: {
    slug: "premium",
    managed_by: "heliolus_plan_service"
  }
})
```

2. **Create Monthly Price**:
```javascript
stripe.prices.create({
  product: "prod_xxx",
  unit_amount: 9900, // $99.00 in cents
  currency: "usd",
  recurring: {
    interval: "month",
    trial_period_days: 14
  },
  metadata: {
    plan_slug: "premium",
    billing_cycle: "monthly"
  }
})
```

3. **Create Annual Price**:
```javascript
stripe.prices.create({
  product: "prod_xxx",
  unit_amount: 99000, // $990.00 in cents
  currency: "usd",
  recurring: {
    interval: "year",
    trial_period_days: 14
  },
  metadata: {
    plan_slug: "premium",
    billing_cycle: "annual"
  }
})
```

**Stored References**:
- `stripeProductId`: `prod_xxx`
- `stripeMonthlyPriceId`: `price_monthly_xxx`
- `stripeAnnualPriceId`: `price_annual_xxx`

### Coupon → Stripe Coupon

When `createInStripe: true` is set during coupon creation:

**Percentage Discount**:
```javascript
stripe.coupons.create({
  id: "SAVE20", // Use our code as Stripe ID
  name: "20% Off Campaign",
  percent_off: 20,
  duration: "repeating",
  duration_in_months: 3,
  max_redemptions: 500,
  redeem_by: 1725148799, // Unix timestamp
  metadata: {
    managed_by: "heliolus_coupon_service"
  }
})
```

**Fixed Amount Discount**:
```javascript
stripe.coupons.create({
  id: "FLAT50",
  name: "$50 Off",
  amount_off: 5000, // $50.00 in cents
  currency: "usd",
  duration: "forever",
  metadata: {
    managed_by: "heliolus_coupon_service"
  }
})
```

---

## Usage Guide

### Creating Your First Plan

1. **Start the backend server**:
```bash
cd backend
npm run dev
```

2. **Make API request** (as admin user):
```bash
curl -X POST http://localhost:3000/v1/admin/plans \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "starter",
    "name": "Starter Plan",
    "monthlyPrice": 29,
    "annualPrice": 290,
    "monthlyCredits": 50,
    "assessmentCredits": 10,
    "maxAssessments": 5,
    "features": ["Basic Support", "Email Reports"],
    "createInStripe": true
  }'
```

3. **Verify in Stripe Dashboard**:
   - Check Products: https://dashboard.stripe.com/products
   - Verify pricing and metadata

### Creating a Coupon

```bash
curl -X POST http://localhost:3000/v1/admin/coupons \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME25",
    "discountType": "PERCENTAGE",
    "discountValue": 25,
    "validUntil": "2025-12-31T23:59:59Z",
    "maxRedemptions": 100,
    "newCustomersOnly": true,
    "createInStripe": true
  }'
```

### Validating a Coupon at Checkout

```bash
curl -X POST http://localhost:3000/v1/admin/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME25",
    "planSlug": "starter",
    "amount": 29,
    "isNewCustomer": true
  }'
```

---

## Remaining Work

### 1. Frontend Admin UI for Plan Management

**Priority**: High
**Estimated Effort**: 4-6 hours

**Requirements**:
- Admin page at `/admin/plans`
- Table listing all plans with filters (active/inactive, public/private)
- Create/Edit dialog with form fields:
  - Basic info (name, slug, description)
  - Pricing (monthly, annual, currency)
  - Credits (monthly, assessment)
  - Limits (assessments, users)
  - Features (array input)
  - Trial days
  - Visibility toggles
- Delete confirmation
- Stripe sync toggle on updates
- Display Stripe Product/Price IDs

**Suggested Stack**:
- React + TanStack Query
- Shadcn UI components (Table, Dialog, Form)
- Zod validation matching backend schemas

**File to Create**: `/frontend/src/pages/admin/PlanManagement.tsx`

### 2. Frontend Admin UI for Coupon Management

**Priority**: High
**Estimated Effort**: 4-6 hours

**Requirements**:
- Admin page at `/admin/coupons`
- Table listing all coupons with:
  - Code, discount value, type
  - Valid dates
  - Redemptions (used/max)
  - Status (active/inactive/expired)
- Create/Edit dialog with form fields:
  - Code (uppercase validation)
  - Discount type dropdown
  - Discount value input
  - Date range picker
  - Max redemptions
  - Plan restrictions (multi-select)
  - Customer type toggle
  - Duration in months
- Delete confirmation
- Real-time validation feedback
- Display Stripe Coupon ID

**File to Create**: `/frontend/src/pages/admin/CouponManagement.tsx`

### 3. Checkout Coupon Integration

**Priority**: Medium
**Estimated Effort**: 3-4 hours

**Requirements**:
- Add coupon code input to subscription checkout page
- "Apply" button to validate coupon
- Display discount amount and final price
- Error messages for invalid coupons
- Apply coupon to Stripe Checkout Session creation
- Track coupon redemption on successful purchase

**Files to Modify**:
- `/frontend/src/pages/Checkout.tsx` or equivalent
- `/backend/src/services/subscription.service.ts` (add coupon parameter)

### 4. End-to-End Testing

**Priority**: Medium
**Estimated Effort**: 2-3 hours

**Test Scenarios**:
1. Create plan → Verify in database and Stripe
2. Update plan pricing → Check Stripe sync
3. Deactivate plan → Verify it's hidden from public
4. Create percentage coupon → Apply at checkout
5. Create fixed amount coupon → Verify discount calculation
6. Test coupon expiry and redemption limits
7. Test plan-specific coupon restrictions
8. Test new customer only coupons

---

## Testing Instructions

### Backend API Testing

**Prerequisites**:
1. Database running (PostgreSQL)
2. Stripe API keys configured in `.env`
3. Backend server running on http://localhost:3000

**Test Plan Creation**:
```bash
# 1. Get admin auth token
TOKEN="your_admin_jwt_token"

# 2. Create a plan
curl -X POST http://localhost:3000/v1/admin/plans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "slug": "test-plan",
  "name": "Test Plan",
  "monthlyPrice": 19.99,
  "annualPrice": 199.99,
  "monthlyCredits": 25,
  "features": ["Feature 1", "Feature 2"],
  "createInStripe": false
}
EOF

# 3. List plans
curl http://localhost:3000/v1/admin/plans \
  -H "Authorization: Bearer $TOKEN"

# 4. Get plan by slug
curl http://localhost:3000/v1/admin/plans/slug/test-plan \
  -H "Authorization: Bearer $TOKEN"
```

**Test Coupon Creation**:
```bash
# 1. Create percentage coupon
curl -X POST http://localhost:3000/v1/admin/coupons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST20",
    "discountType": "PERCENTAGE",
    "discountValue": 20,
    "maxRedemptions": 10,
    "createInStripe": false
  }'

# 2. Validate coupon
curl -X POST http://localhost:3000/v1/admin/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST20",
    "amount": 100
  }'

# 3. List coupons
curl http://localhost:3000/v1/admin/coupons \
  -H "Authorization: Bearer $TOKEN"
```

### Database Verification

```sql
-- Check created plans
SELECT id, slug, name, "monthlyPrice", "annualPrice", "isActive"
FROM "Plan"
ORDER BY "createdAt" DESC;

-- Check created coupons
SELECT id, code, "discountType", "discountValue", "timesRedeemed", "isActive"
FROM "Coupon"
ORDER BY "createdAt" DESC;

-- Check Stripe integration
SELECT slug, "stripeProductId", "stripeMonthlyPriceId", "stripeAnnualPriceId"
FROM "Plan"
WHERE "stripeProductId" IS NOT NULL;
```

---

## Code References

### Backend Files Created/Modified

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `/backend/prisma/schema.prisma` | Plan & Coupon models + enum | 769-851, 206-209 | ✅ Complete |
| `/backend/src/services/plan.service.ts` | Plan management service | 1-448 | ✅ Complete |
| `/backend/src/services/coupon.service.ts` | Coupon management service | 1-543 | ✅ Complete |
| `/backend/src/routes/plan.routes.ts` | Plan API routes | 1-297 | ✅ Complete |
| `/backend/src/routes/coupon.routes.ts` | Coupon API routes | 1-330 | ✅ Complete |
| `/backend/src/server.ts` | Route registration | 42-43, 267-268 | ✅ Complete |

### Frontend Files Needed

| File | Purpose | Status |
|------|---------|--------|
| `/frontend/src/pages/admin/PlanManagement.tsx` | Plan CRUD UI | ⏳ Pending |
| `/frontend/src/pages/admin/CouponManagement.tsx` | Coupon CRUD UI | ⏳ Pending |
| `/frontend/src/lib/api.ts` | API client functions | ⏳ Pending |
| `/frontend/src/components/checkout/CouponInput.tsx` | Checkout coupon field | ⏳ Pending |

---

## Environment Variables

### Required `.env` Variables

```bash
# Stripe (Required for plan/coupon creation)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Database (Already configured)
DATABASE_URL=postgresql://...

# Application
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## Migration & Deployment

### Database Migration

```bash
# Development
cd backend
npx prisma db push

# Production (when ready)
npx prisma migrate dev --name add_plan_and_coupon_models
npx prisma migrate deploy
```

### Deployment Checklist

- [ ] Run database migration
- [ ] Verify Stripe API keys in production environment
- [ ] Create initial plans in production Stripe
- [ ] Seed database with default plans (FREE, PREMIUM, ENTERPRISE)
- [ ] Test plan creation in production
- [ ] Test coupon validation
- [ ] Monitor Stripe webhook events
- [ ] Set up error alerting for Stripe API failures

---

## Support & Troubleshooting

### Common Issues

**Issue**: Stripe API error "No such price"
**Solution**: Verify `stripePriceId` exists in Stripe dashboard. May need to recreate prices.

**Issue**: Coupon validation fails with "not found"
**Solution**: Ensure coupon code is uppercase. Codes are stored in uppercase.

**Issue**: Plan update doesn't reflect in Stripe
**Solution**: Set `syncToStripe: true` in update payload. Note: Prices are immutable in Stripe.

**Issue**: Database error "Unknown argument 'options'"
**Solution**: Fixed in `/backend/src/services/template.service.ts` (lines 608, 879, 1412). Prisma schema doesn't include `options` field for Question model.

### Debug Logging

Enable detailed logging:
```typescript
// In plan.service.ts or coupon.service.ts
this.logger.info('Plan creation details', { data, stripeResponse });
```

### Audit Log

All plan and coupon operations are logged:
```sql
SELECT * FROM "AuditLog"
WHERE entity IN ('Plan', 'Coupon')
ORDER BY "createdAt" DESC
LIMIT 50;
```

---

## Next Developer Notes

### Architecture Decisions

1. **Soft Deletes**: Plans and coupons are never permanently deleted from the database. This preserves historical subscription data and allows reactivation.

2. **Stripe Sync**: Plan/coupon creation in Stripe is optional (`createInStripe` flag). This allows testing without Stripe API calls.

3. **Price Immutability**: Stripe prices cannot be modified after creation. To change pricing, create new prices and update the plan's `stripePriceId`.

4. **Coupon Validation**: Validation is separate from redemption. This allows showing discount amounts before purchase completion.

5. **Currency Conversion**: All monetary values stored as Decimal in database. Converted to cents (×100) when sending to Stripe API.

### Future Enhancements

- [ ] Plan comparison page (public-facing)
- [ ] Usage-based pricing support
- [ ] Addon/extension plans
- [ ] Family/group plans
- [ ] Coupon analytics dashboard
- [ ] A/B testing for pricing
- [ ] Automatic coupon generation
- [ ] Referral coupon system
- [ ] Plan migration tool (upgrade/downgrade workflows)

---

## Contact & Handover

**Implemented By**: Claude Code (AI Assistant)
**Date**: 2025-10-27
**Review Status**: Pending human review
**Production Ready**: Backend only (Frontend UI required)

**Handover Checklist**:
- [x] Database schema documented
- [x] Backend services implemented
- [x] API routes created and registered
- [x] Stripe integration tested
- [x] Code references provided
- [x] Usage examples documented
- [x] Testing instructions included
- [x] Known issues documented
- [ ] Frontend UI implementation (pending)
- [ ] End-to-end testing (pending)

---

**End of Handover Document**

For questions or clarifications, refer to code comments in:
- `/backend/src/services/plan.service.ts`
- `/backend/src/services/coupon.service.ts`
- `/backend/src/routes/plan.routes.ts`
- `/backend/src/routes/coupon.routes.ts`
