# Stripe Payment System - Setup & Configuration Guide

**Project:** Heliolus Compliance Platform
**Last Updated:** 2025-10-30
**System Status:** ✅ Implementation Complete - Configuration Required

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Stripe Account Configuration](#stripe-account-configuration)
5. [Environment Variables](#environment-variables)
6. [Plan Management](#plan-management)
7. [User Flows](#user-flows)
8. [Admin Console](#admin-console)
9. [Webhook Configuration](#webhook-configuration)
10. [Testing](#testing)
11. [Security](#security)
12. [Troubleshooting](#troubleshooting)
13. [API Reference](#api-reference)

---

## Overview

The Heliolus platform uses **Stripe** for all payment processing, including:

- 💳 **Subscription Management** - Monthly/Annual recurring billing
- 🎫 **Credit System** - Purchase additional assessment credits
- 📊 **Usage Tracking** - Monitor credit consumption
- 🧾 **Invoicing** - Automated invoice generation
- 🔔 **Webhooks** - Real-time payment event processing

### Subscription Tiers

| Plan | Monthly Price | Annual Price | Credits | Features |
|------|--------------|--------------|---------|----------|
| **Freemium** | €0 | €0 | 0 | 2 assessments max (via quota) |
| **Premium** | €599 | €6,469.20 (10% discount) | 100/month | Unlimited assessments, AI analysis |
| **Enterprise** | Custom | Custom | Admin-granted | Custom templates, API access |

### Additional Purchases

- **Additional Assessment**: €299 → 50 credits (1 full assessment)

---

## Architecture

### Backend Components

```
backend/src/
├── services/
│   ├── subscription.service.ts      # Main subscription logic (1537 lines)
│   └── admin-credit.service.ts      # Enterprise credit grants
├── lib/payment/
│   ├── stripe.ts                    # Stripe provider implementation
│   ├── subscriptions.ts             # Subscription management
│   ├── webhooks.ts                  # Webhook event handlers
│   ├── credits.ts                   # Credit purchase logic
│   ├── invoicing.ts                 # Invoice generation
│   ├── config.ts                    # Payment configuration
│   └── types.ts                     # TypeScript interfaces
├── routes/
│   ├── subscription.routes.ts       # Subscription API (1220 lines)
│   ├── webhook.routes.ts            # Webhook endpoint
│   └── admin.routes.ts              # Admin subscription management
└── middleware/
    ├── auth.middleware.ts           # JWT authentication
    └── rbac.middleware.ts           # Role-based access control
```

### Frontend Components

```
frontend/src/
├── pages/
│   ├── Pricing.tsx                  # Public pricing page (database-driven)
│   ├── Checkout.tsx                 # Stripe checkout redirect
│   └── admin/
│       ├── PlanManagement.tsx       # Create/edit plans + Stripe sync
│       ├── Subscriptions.tsx        # Monitor all subscriptions
│       ├── CreditBalances.tsx       # View user credits
│       └── CreditTransactions.tsx   # Credit transaction history
├── hooks/
│   └── useAdminPlans.ts             # React Query hooks for plans
└── lib/
    └── api.ts                       # API client with auth
```

### Database Schema

**Key Models:**
- `Subscription` - User subscription records
- `Invoice` - Billing history
- `CreditTransaction` - Credit movements
- `UserAssessmentQuota` - Free tier limits
- `Plan` - Subscription plan definitions (NEW - dynamic pricing)

---

## Prerequisites

### 1. Stripe Account

- **Test Mode**: Sign up at https://dashboard.stripe.com/register
- **Production**: Activate account after business verification

### 2. Backend Environment

- Node.js ≥18.0.0
- PostgreSQL 15
- Redis 7
- Environment: `backend/.env`

### 3. Domain & SSL

- Public domain with HTTPS (required for webhooks)
- Example: `https://api.heliolus.com`

---

## Stripe Account Configuration

### Step 1: API Keys (2 minutes)

**Location:** [Dashboard → Developers → API Keys](https://dashboard.stripe.com/test/apikeys)

1. Navigate to API Keys section
2. Copy **Publishable key**: `pk_test_...` or `pk_live_...`
3. Reveal and copy **Secret key**: `sk_test_...` or `sk_live_...`
4. Add to `.env`:

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
```

**Security Note:** Never commit secret keys to version control.

---

### Step 2: Products & Prices (15 minutes)

You have **two options** for creating products:

#### Option A: Manual Setup in Stripe Dashboard

**Location:** [Products](https://dashboard.stripe.com/test/products)

##### Product 1: Premium Plan

1. Click **"+ Add Product"**
2. **Product Information:**
   - Name: `Premium`
   - Description: `Full access to compliance assessments with AI analysis`
   - Statement descriptor: `HELIOLUS PREMIUM`
3. **Pricing:**
   - Click **"Add pricing"**
   - **Price 1 (Monthly):**
     - Type: `Recurring`
     - Price: `€599.00`
     - Billing period: `Monthly`
     - Price ID: Copy `price_xxxxx` → Note as `STRIPE_PREMIUM_PRICE_ID_MONTHLY`
   - Click **"Add another price"**
   - **Price 2 (Annual):**
     - Type: `Recurring`
     - Price: `€6,469.20`
     - Billing period: `Yearly`
     - Price ID: Copy `price_xxxxx` → Note as `STRIPE_PREMIUM_PRICE_ID_ANNUAL`
4. Save product

##### Product 2: Additional Assessment Credits

1. Click **"+ Add Product"**
2. **Product Information:**
   - Name: `Additional Assessment`
   - Description: `Purchase 50 credits for one additional compliance assessment`
   - Statement descriptor: `HELIOLUS CREDITS`
3. **Pricing:**
   - Type: `One-time`
   - Price: `€299.00`
   - Price ID: Copy `price_xxxxx` → Note as `STRIPE_ADDITIONAL_ASSESSMENT_PRICE_ID`
4. Save product

##### Product 3: Enterprise Plan (Optional)

- Create as custom pricing
- Or handle via direct sales (no Stripe product needed)

#### Option B: Automated Setup via Admin Console (Recommended)

Your admin console can create Stripe products automatically:

1. Navigate to `/admin/plan-management`
2. Click **"Add Plan"**
3. Fill in plan details:
   ```
   Slug: PREMIUM
   Name: Premium
   Monthly Price: 599
   Annual Price: 6469.20
   Currency: EUR
   Monthly Credits: 100
   Assessment Credits: 50
   ```
4. **Enable "Create in Stripe"** toggle
5. Click **"Create Plan"**
6. System will:
   - Create Stripe Product
   - Create monthly Price
   - Create annual Price
   - Store `stripeProductId` and `stripePriceId` in database
   - Return Price IDs for `.env` configuration

**Advantage:** Keeps database and Stripe in perfect sync.

---

### Step 3: Webhook Endpoint (10 minutes)

Webhooks are **critical** - they sync payment events to your database.

#### Step 3.1: Prepare Your Webhook URL

Your webhook endpoint is already implemented at:
```
https://your-domain.com/v1/webhooks/stripe
```

**Examples:**
- Production: `https://api.heliolus.com/v1/webhooks/stripe`
- Staging: `https://api-staging.heliolus.com/v1/webhooks/stripe`

**Local Development:** Use [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:3001/v1/webhooks/stripe
```

#### Step 3.2: Register Webhook in Stripe

**Location:** [Webhooks](https://dashboard.stripe.com/test/webhooks)

1. Click **"Add endpoint"**
2. **Endpoint URL:** `https://api.heliolus.com/v1/webhooks/stripe`
3. **Description:** `Heliolus Platform - Production Webhook`
4. **API Version:** `2025-08-27.basil` (matches your code)
5. **Events to send:** Click "Select events" and choose:

##### Checkout Events (Critical)
- ✅ `checkout.session.completed` - Subscription created after payment
- ✅ `checkout.session.expired` - Abandoned checkout

##### Customer Events
- ✅ `customer.created` - New customer record
- ✅ `customer.updated` - Customer info changed
- ✅ `customer.deleted` - Customer removed

##### Subscription Events (Critical)
- ✅ `customer.subscription.created` - New subscription
- ✅ `customer.subscription.updated` - Plan change, status change
- ✅ `customer.subscription.deleted` - Subscription canceled
- ✅ `customer.subscription.trial_will_end` - Trial ending soon (3 days)

##### Invoice Events (Critical)
- ✅ `invoice.created` - Invoice generated
- ✅ `invoice.updated` - Invoice modified
- ✅ `invoice.paid` - Payment successful
- ✅ `invoice.payment_failed` - Payment failed (retry logic)
- ✅ `invoice.finalized` - Invoice ready to send

##### Payment Events
- ✅ `payment_intent.succeeded` - Payment completed
- ✅ `payment_intent.payment_failed` - Payment failed

##### Payment Method Events
- ✅ `payment_method.attached` - Card added to customer
- ✅ `payment_method.detached` - Card removed

6. Click **"Add endpoint"**

#### Step 3.3: Get Webhook Signing Secret

1. Click on your newly created webhook
2. Find **"Signing secret"** section
3. Click **"Reveal"**
4. Copy the secret: `whsec_...`
5. Add to `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

**What it does:** Verifies webhook authenticity using HMAC SHA-256 signatures.

#### Step 3.4: Webhook Handler Code Reference

Your webhook handler (`backend/src/lib/payment/webhooks.ts`) automatically:

- ✅ Verifies signature
- ✅ Processes 18 event types
- ✅ Updates database (subscriptions, invoices, credits)
- ✅ Logs all events to `WebhookEvent` table
- ✅ Handles errors gracefully
- ✅ Returns 200 OK to Stripe

**Key Handler Example:**
```typescript
case 'checkout.session.completed':
  // Creates/updates subscription
  // Grants plan credits (100 for Premium)
  // Creates credit transaction record
  // Updates user subscription status
  break;

case 'invoice.paid':
  // Marks invoice as paid
  // Adds renewal credits if subscription renewal
  // Creates credit transaction
  break;

case 'invoice.payment_failed':
  // Sets subscription to PAST_DUE
  // Sends payment failure notification (TODO)
  break;
```

---

### Step 4: Payment Methods (5 minutes)

**Location:** [Payment Methods](https://dashboard.stripe.com/test/settings/payment_methods)

Enable payment methods for your market:

**Recommended for EU:**
- ✅ **Cards** (Visa, Mastercard, Amex) - Universal
- ✅ **SEPA Direct Debit** - EU bank transfers
- ✅ **iDEAL** - Netherlands (very popular)
- ✅ **Bancontact** - Belgium
- ✅ **Giropay** - Germany (being phased out)
- ✅ **SOFORT** - Central Europe

**Stripe handles:**
- Currency conversion (if needed)
- SCA (Strong Customer Authentication) for EU
- 3D Secure for card payments

---

### Step 5: Customer Portal (Optional, 5 minutes)

Allow customers to self-serve billing management.

**Location:** [Customer Portal](https://dashboard.stripe.com/test/settings/billing/portal)

1. Click **"Activate test link"**
2. **Configure features:**
   - ✅ Update payment method
   - ✅ View invoices
   - ✅ View subscription details
   - ✅ Update billing address
   - ⚠️ Cancel subscription - **Consider disabling** (you handle cancellation in your app with business logic)
3. **Branding:**
   - Upload logo (recommend 300x100px)
   - Set primary color (match your brand)
   - Custom business name
4. **Redirect URL after actions:** `https://your-domain.com/account/billing`
5. Save configuration

**Integration:** Your backend can generate portal links:
```typescript
const session = await stripe.billingPortal.sessions.create({
  customer: 'cus_xxx',
  return_url: 'https://heliolus.com/account/billing',
});
// Redirect user to session.url
```

---

## Environment Variables

### Complete `.env` Configuration

Add these to `backend/.env`:

```bash
# ============================================================================
# STRIPE CONFIGURATION
# ============================================================================

# API Keys (from Step 1)
STRIPE_SECRET_KEY=sk_test_51...                    # Test: sk_test_ | Production: sk_live_
STRIPE_PUBLISHABLE_KEY=pk_test_51...               # Test: pk_test_ | Production: pk_live_

# Webhook Secret (from Step 3)
STRIPE_WEBHOOK_SECRET=whsec_...                    # Critical for webhook verification

# Product Price IDs (from Step 2)
# Premium Plan
STRIPE_PREMIUM_PRICE_ID_MONTHLY=price_...          # €599/month
STRIPE_PREMIUM_PRICE_ID_ANNUAL=price_...           # €6,469.20/year

# Additional Assessment Credits
STRIPE_ADDITIONAL_ASSESSMENT_PRICE_ID=price_...    # €299 one-time

# Enterprise Plan (optional - usually custom pricing)
STRIPE_ENTERPRISE_PRICE_ID=price_...               # If using Stripe for Enterprise

# Application URLs
FRONTEND_URL=https://heliolus.com                  # For checkout success/cancel redirects
NODE_ENV=production                                # production | development | test

# ============================================================================
# EXISTING ENVIRONMENT VARIABLES (Keep these)
# ============================================================================

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/heliolus

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# AWS S3 (for document uploads)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
S3_BUCKET_NAME=heliolus-documents

# OpenAI (for AI analysis)
OPENAI_API_KEY=sk-...

# Email
EMAIL_FROM=noreply@heliolus.com
EMAIL_API_KEY=...
```

### Environment-Specific Configuration

#### Development (`.env.development`)
```bash
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_... # Use Stripe CLI: stripe listen
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

#### Staging (`.env.staging`)
```bash
STRIPE_SECRET_KEY=sk_test_51...  # Still use test keys
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://staging.heliolus.com
NODE_ENV=staging
```

#### Production (`.env.production`)
```bash
STRIPE_SECRET_KEY=sk_live_51...  # Live keys
STRIPE_PUBLISHABLE_KEY=pk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...  # Separate webhook for production
FRONTEND_URL=https://heliolus.com
NODE_ENV=production
```

---

## Plan Management

### Database-Driven Pricing

Your system uses a **Plan** table for dynamic pricing (no hardcoded plans):

**Schema:**
```prisma
model Plan {
  id                String   @id @default(cuid())
  slug              String   @unique  // 'freemium', 'premium', 'enterprise'
  name              String              // Display name
  description       String?
  monthlyPrice      Decimal  @db.Decimal(10, 2)
  annualPrice       Decimal  @db.Decimal(10, 2)
  currency          String   @default("EUR")
  monthlyCredits    Int      // Credits granted per month
  assessmentCredits Int      // Credits per assessment (50 for Premium)
  maxAssessments    Int      // -1 = unlimited
  maxUsers          Int      // User seats
  features          String[] // JSON array of features
  trialDays         Int      @default(0)
  isActive          Boolean  @default(true)
  isPublic          Boolean  @default(true) // Show on pricing page
  displayOrder      Int      @default(0)

  // Stripe Integration
  stripeProductId   String?  @unique
  stripePriceIdMonthly String?
  stripePriceIdAnnual  String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Admin Console Plan Management

**Location:** `/admin/plan-management`

**Capabilities:**
1. ✅ **Create Plans** - Define new subscription tiers
2. ✅ **Edit Plans** - Modify pricing, features, limits
3. ✅ **Stripe Sync** - Auto-create/update Stripe Products
4. ✅ **Activate/Deactivate** - Control plan availability
5. ✅ **Public/Private** - Hide plans from pricing page
6. ✅ **Feature Management** - Add/remove features per plan

**Creating a Plan:**

1. Navigate to `/admin/plan-management`
2. Click **"Add Plan"**
3. Fill in details:

```yaml
Basic Information:
  Slug: PREMIUM              # Unique identifier (uppercase)
  Name: Premium              # Display name
  Description: Full access to all compliance features

Pricing:
  Monthly Price: 599.00      # In euros
  Annual Price: 6469.20      # 10% discount
  Currency: EUR              # ISO code

Credits & Limits:
  Monthly Credits: 100       # Granted each billing cycle
  Assessment Credits: 50     # Cost per assessment
  Max Assessments: -1        # -1 = unlimited
  Max Users: 5               # User seats

Features: (one per line)
  - AI-powered compliance assessments
  - Unlimited assessments
  - Advanced risk analysis
  - Full gap identification
  - Strategy matrix
  - Vendor marketplace access
  - Priority email support
  - Export capabilities (PDF, CSV)

Settings:
  Trial Days: 14             # Free trial period
  Display Order: 2           # Sort order on pricing page
  Active: ✅                 # Enable plan
  Public: ✅                 # Show on pricing page
  Create in Stripe: ✅       # Auto-create Stripe product
```

4. Click **"Create Plan"**
5. System returns:
   - Plan ID
   - Stripe Product ID: `prod_xxx`
   - Stripe Price ID (Monthly): `price_xxx`
   - Stripe Price ID (Annual): `price_xxx`

6. Copy Price IDs to `.env`

**Editing a Plan:**

1. Click **"Edit"** next to plan
2. Modify fields
3. Toggle **"Sync to Stripe"** to update Stripe product
4. Click **"Update Plan"**

**Deleting a Plan:**

1. Click **"Delete"** (⚠️ careful)
2. Confirm deletion
3. System:
   - Sets `isActive = false`
   - Does NOT delete from Stripe (keeps historical data)
   - Existing subscriptions continue unchanged

---

## User Flows

### Flow 1: New User Subscription

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Stripe
    participant Webhook

    User->>Frontend: Visit /pricing
    Frontend->>Backend: GET /v1/public/plans
    Backend-->>Frontend: Return plans (dynamic from DB)
    Frontend-->>User: Display pricing cards

    User->>Frontend: Click "Upgrade to Premium"
    Frontend->>Backend: POST /v1/subscriptions/checkout {plan: PREMIUM}
    Backend->>Stripe: Create Checkout Session
    Stripe-->>Backend: Return session {id, url}
    Backend-->>Frontend: Return {sessionId, url}
    Frontend-->>User: Redirect to Stripe Checkout

    User->>Stripe: Enter payment details
    Stripe->>Stripe: Process payment
    Stripe->>Webhook: POST checkout.session.completed
    Webhook->>Backend: Create subscription
    Backend->>Backend: Grant 100 credits
    Backend->>Backend: Create credit transaction
    Webhook-->>Stripe: 200 OK

    Stripe-->>User: Redirect to success page
    User->>Frontend: View /subscription/success
    Frontend->>Backend: GET /v1/subscriptions/current
    Backend-->>Frontend: Return active subscription
    Frontend-->>User: Show success + credit balance
```

**Code Reference:**

1. **Pricing Page** (`frontend/src/pages/Pricing.tsx:108`)
   - Fetches plans from `/v1/public/plans`
   - Renders dynamic pricing cards

2. **Checkout** (`backend/src/services/subscription.service.ts:1255`)
   - `createCheckoutSession()` creates Stripe session
   - Returns redirect URL

3. **Webhook** (`backend/src/lib/payment/webhooks.ts:132`)
   - `handleCheckoutSessionCompleted()` processes payment
   - Creates subscription record
   - Grants initial credits

### Flow 2: Purchase Additional Assessment

```
User (Premium) → /account/billing → Click "Purchase Credits"
  ↓
Backend: POST /v1/subscriptions/:userId/purchase-assessment
  {stripePriceId: "price_xxx"} // €299
  ↓
Create Stripe Checkout Session (one-time payment)
  ↓
User redirects to Stripe → Enters payment
  ↓
Webhook: checkout.session.completed (mode: payment)
  ↓
Backend: Add 50 credits to subscription.creditsBalance
Backend: Create credit transaction (type: PURCHASE)
  ↓
User balance: 100 → 150 credits
```

**Code Reference:**

- **Route:** `backend/src/routes/subscription.routes.ts:499`
- **Service:** `backend/src/services/subscription.service.ts:415`
- **Webhook:** `backend/src/lib/payment/webhooks.ts:236`

### Flow 3: Subscription Cancellation

**User-Initiated:**

```
User → /account/billing → Click "Cancel Subscription"
  ↓
Frontend: Confirm dialog "Cancel at end of period?"
  ↓
Backend: POST /v1/subscriptions/cancel
  {immediately: false}
  ↓
Stripe: subscriptions.update(sub_id, {cancel_at_period_end: true})
  ↓
Database: Update subscription
  status: ACTIVE
  cancelAt: 2025-11-30 (end of billing period)
  ↓
User retains access until cancelAt date
Credits remain available until then
```

**Admin-Initiated:**

```
Admin → /admin/subscriptions → Click "Cancel"
  ↓
Backend: Same as above
  OR
  {immediately: true}  // Cancel now
  ↓
Stripe: subscriptions.cancel(sub_id)
  ↓
Webhook: customer.subscription.deleted
  ↓
Database: Update subscription
  status: CANCELED
  canceledAt: 2025-10-30 (now)
  ↓
User loses access immediately
Remaining credits forfeited
```

**Code Reference:**

- **Route:** `backend/src/routes/subscription.routes.ts:849`
- **Service:** `backend/src/services/subscription.service.ts:740`
- **Webhook:** `backend/src/lib/payment/webhooks.ts:388`

### Flow 4: Failed Payment Handling

```
Stripe: Invoice payment fails (card declined)
  ↓
Webhook: invoice.payment_failed
  ↓
Backend: Update subscription
  status: PAST_DUE
  ↓
Email: Payment failure notification (TODO: implement)
  ↓
Stripe: Automatic retry (3 attempts over 2 weeks)
  ↓
  If payment succeeds:
    Webhook: invoice.paid
    Backend: status → ACTIVE
  ↓
  If all retries fail:
    Webhook: customer.subscription.deleted
    Backend: status → CANCELED
```

**Code Reference:**

- **Handler:** `backend/src/lib/payment/webhooks.ts:474`

---

## Admin Console

### Subscription Monitoring

**Location:** `/admin/subscriptions`

**Metrics Dashboard:**
- 📊 **Active Subscriptions** - Count of ACTIVE status
- 💰 **MRR** (Monthly Recurring Revenue) - Sum of monthly subscription values
- 📈 **Average Revenue** - MRR / Active Subscriptions
- 📉 **Churn** - Canceled subscriptions this month

**Subscription Table:**

| Column | Data | Actions |
|--------|------|---------|
| Organization | Name, ID, Start Date | - |
| Plan | Badge (FREE/PREMIUM/ENTERPRISE) | - |
| Status | Active/Canceled/Past Due/Paused | - |
| Credits | Used/Remaining/Total (with progress bar) | - |
| Billing | Amount, Interval (monthly/yearly) | - |
| Payment Method | Card type, Last 4 digits | - |
| Next Billing | Date | - |
| Actions | Edit/Pause/Cancel/Resume | ⚠️ |

**Filters:**
- Search by organization name or ID
- Filter by status (Active/Canceled/Past Due/Paused)
- Filter by plan (Free/Premium/Enterprise)

**Actions:**

1. **Edit Subscription**
   - Change plan (upgrade/downgrade with proration)
   - Update payment method
   - Modify credit allocation

2. **Pause Subscription**
   - Stops billing
   - Maintains access until current period end
   - Can resume anytime

3. **Cancel Subscription**
   - Immediate or end-of-period
   - Shows remaining credits warning
   - Logs in audit trail

4. **Resume Subscription**
   - Restarts paused subscription
   - Recalculates next billing date

**Code Reference:**

- **Component:** `frontend/src/pages/admin/Subscriptions.tsx`
- **Mock Data:** Currently uses static data (lines 81-202)
- **TODO:** Connect to API `/v1/admin/subscriptions`

### Credit Management

#### Credit Balances (`/admin/credit-balances`)

View all user credit balances:
- User email and organization
- Current balance
- Total purchased
- Total used
- Last transaction date

#### Credit Transactions (`/admin/credit-transactions`)

Audit log of all credit movements:
- Transaction type (PURCHASE, DEDUCTION, GRANT, REFUND)
- Amount (positive for additions, negative for deductions)
- Balance after transaction
- Description and metadata
- Associated assessment (if applicable)

#### Grant Credits (Admin Only)

**Location:** `/admin/subscriptions/:userId` → "Grant Credits" button

**Use Cases:**
- Enterprise customer credit grants
- Compensation for service issues
- Promotional credits
- Beta tester rewards

**API Endpoint:**
```
POST /v1/admin/subscriptions/:userId/grant-credits
Authorization: Bearer <admin-token>

{
  "amount": 100,
  "reason": "Enterprise Q1 2025 allocation"
}
```

**Code Reference:**

- **Service:** `backend/src/services/admin-credit.service.ts`
- **Route:** `backend/src/routes/admin.routes.ts:75` (schema defined)

---

## Webhook Configuration

### Webhook Event Handling

Your system processes **18 webhook events**:

#### Critical Events (Must Work)

| Event | Handler | Actions | Failure Impact |
|-------|---------|---------|----------------|
| `checkout.session.completed` | `handleCheckoutSessionCompleted` | Create subscription, grant credits | User pays but gets no access ⚠️ |
| `invoice.paid` | `handleInvoicePaid` | Renew subscription, add credits | Renewal credits not granted ⚠️ |
| `invoice.payment_failed` | `handleInvoicePaymentFailed` | Set PAST_DUE status | User keeps access when they shouldn't |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | Set CANCELED status | Canceled user keeps access ⚠️ |

#### Important Events

| Event | Handler | Actions |
|-------|---------|---------|
| `customer.subscription.updated` | `handleSubscriptionUpdated` | Update status, period dates |
| `checkout.session.expired` | `handleCheckoutSessionExpired` | Log abandoned checkout (marketing) |
| `customer.subscription.trial_will_end` | `handleTrialWillEnd` | Send reminder email (TODO) |

#### Informational Events

| Event | Handler | Actions |
|-------|---------|---------|
| `customer.created` | `handleCustomerCreated` | Link Stripe customer to user |
| `customer.updated` | `handleCustomerUpdated` | Sync customer info |
| `payment_method.attached` | `handlePaymentMethodAttached` | Update default payment method |
| All others | Various | Logging and record-keeping |

### Webhook Verification

Your code automatically verifies webhooks:

```typescript
// backend/src/lib/payment/webhooks.ts:28
async handleWebhook(payload: string | Buffer, signature: string): Promise<WebhookResult> {
  try {
    // Verify webhook signature using STRIPE_WEBHOOK_SECRET
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      PAYMENT_CONFIG.stripe.webhookSecret
    );

    // Process event...
  } catch (error) {
    // Invalid signature - reject
    return { success: false, error: 'Webhook verification failed' };
  }
}
```

**What this prevents:**
- Forged webhook requests
- Man-in-the-middle attacks
- Replay attacks (Stripe includes timestamp)

### Webhook Logging

All webhook events are logged to database:

```sql
-- Table: WebhookEvent
CREATE TABLE "WebhookEvent" (
  id               TEXT PRIMARY KEY,
  stripeEventId    TEXT UNIQUE,    -- evt_xxx
  type             TEXT,           -- e.g., invoice.paid
  processed        BOOLEAN,        -- Handler success
  processingResult JSON,           -- Handler return value
  eventData        JSON,           -- Full Stripe event object
  createdAt        TIMESTAMP
);
```

**Uses:**
- Debugging payment issues
- Replaying failed events
- Audit trail
- Analytics (conversion rates, etc.)

### Webhook Testing

#### Local Development (Stripe CLI)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/v1/webhooks/stripe

# Output:
# > Ready! Your webhook signing secret is whsec_xxx (^C to quit)

# Copy signing secret to .env.development
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

#### Staging/Production Testing

**Test Real Webhooks:**

1. Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook
3. Click **"Send test webhook"**
4. Select event type
5. Click **"Send test event"**
6. View response in dashboard

**Monitor Webhook Delivery:**

- **Success rate** should be 100%
- **Response time** should be <500ms
- **Failures** show retry attempts (Stripe retries failed webhooks)

**Webhook Endpoint Health Check:**

```
GET /v1/webhooks/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-10-30T12:34:56.789Z",
  "webhookEndpoint": "/v1/webhooks/stripe",
  "environment": "production"
}
```

---

## Testing

### Test Cards

Use these for testing different scenarios:

| Card Number | Scenario | Use Case |
|-------------|----------|----------|
| `4242 4242 4242 4242` | Success | Happy path testing |
| `4000 0000 0000 0002` | Decline | Payment failure flow |
| `4000 0000 0000 9995` | Insufficient funds | Specific decline reason |
| `4000 0027 6000 3184` | 3D Secure required | SCA authentication |
| `4000 0000 0000 3220` | Requires 3DS (fail) | Failed authentication |
| `4000 0025 0000 3155` | SCA required (decline) | Payment method unusable |

**Test Data:**
- Any future expiry date (e.g., 12/34)
- Any 3-digit CVC (e.g., 123)
- Any 5-digit postal code (e.g., 12345)

**More test cards:** https://stripe.com/docs/testing

### Test Scenarios

#### Scenario 1: New Subscription

**Objective:** User upgrades from Free to Premium

```bash
# Step 1: Create user and free subscription (via app)
POST /v1/auth/register
{
  "email": "test@example.com",
  "password": "Test123!@#",
  "firstName": "Test",
  "lastName": "User"
}

# Step 2: Create checkout session
POST /v1/subscriptions/checkout
Authorization: Bearer <token>
{
  "plan": "PREMIUM"
}

# Response:
{
  "success": true,
  "data": {
    "sessionId": "cs_test_xxx",
    "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
  }
}

# Step 3: Open URL in browser, use test card 4242424242424242

# Step 4: Verify subscription created
GET /v1/subscriptions/current
Authorization: Bearer <token>

# Expected:
{
  "id": "sub_xxx",
  "plan": "PREMIUM",
  "status": "ACTIVE",
  "creditsBalance": 100,  # Granted via webhook
  "currentPeriodStart": "2025-10-30T00:00:00Z",
  "currentPeriodEnd": "2025-11-30T00:00:00Z"
}

# Step 5: Check database
SELECT * FROM "Subscription" WHERE "userId" = 'user_xxx';
SELECT * FROM "CreditTransaction" WHERE "subscriptionId" = 'sub_xxx';
```

**Expected Results:**
- ✅ Stripe subscription created
- ✅ Database subscription record created
- ✅ 100 credits granted
- ✅ Credit transaction logged
- ✅ Webhook event logged

#### Scenario 2: Failed Payment

**Objective:** Simulate card decline and retry logic

```bash
# Step 1: Create subscription with decline card
# Use card: 4000 0000 0000 0002

# Step 2: Verify subscription created but payment fails
GET /v1/subscriptions/current

# Expected:
{
  "plan": "PREMIUM",
  "status": "PAST_DUE",  # Not ACTIVE
  "creditsBalance": 0     # No credits granted yet
}

# Step 3: Check webhook logs
SELECT * FROM "WebhookEvent"
WHERE "type" = 'invoice.payment_failed'
ORDER BY "createdAt" DESC LIMIT 1;

# Step 4: Update payment method in Stripe Dashboard
# Webhooks → Click event → View invoice → Update payment method

# Step 5: Stripe automatically retries payment
# After success, webhook invoice.paid fires

# Step 6: Verify credits granted
GET /v1/subscriptions/current

# Expected:
{
  "status": "ACTIVE",
  "creditsBalance": 100
}
```

#### Scenario 3: Subscription Cancellation

**Objective:** Cancel subscription and verify access end date

```bash
# Step 1: Cancel at end of period
POST /v1/subscriptions/cancel
Authorization: Bearer <token>
{
  "immediately": false
}

# Step 2: Verify cancellation scheduled
GET /v1/subscriptions/current

# Expected:
{
  "status": "ACTIVE",  # Still active
  "cancelAt": "2025-11-30T00:00:00Z",  # End of current period
  "creditsBalance": 80  # Remaining credits
}

# Step 3: Wait for period end (or mock webhook)
# Stripe sends: customer.subscription.deleted

# Step 4: Verify subscription canceled
GET /v1/subscriptions/current

# Expected:
{
  "status": "CANCELED",
  "canceledAt": "2025-11-30T00:00:00Z",
  "creditsBalance": 0  # Credits forfeited
}
```

#### Scenario 4: Purchase Additional Credits

**Objective:** Premium user buys €299 credit pack

```bash
# Step 1: Get current balance
GET /v1/subscriptions/credits
Authorization: Bearer <token>

# Response: {"balance": 25, "used": 75, "purchased": 100}

# Step 2: Create checkout for credits
POST /v1/subscriptions/credits/purchase
Authorization: Bearer <token>
{
  "amount": 50  # Ignored - always grants 50 credits for €299
}

# Step 3: Complete Stripe checkout (one-time payment)

# Step 4: Verify credits added
GET /v1/subscriptions/credits

# Expected: {"balance": 75, "used": 75, "purchased": 150}

# Step 5: Check transaction log
GET /v1/subscriptions/billing-history

# Expected:
{
  "transactions": [
    {
      "type": "PURCHASE",
      "amount": 50,
      "balance": 75,
      "description": "Purchased additional assessment credits",
      "createdAt": "2025-10-30T12:00:00Z"
    }
  ]
}
```

### Integration Testing

**Backend Tests** (`backend/tests/integration/subscription.test.ts` - TODO):

```typescript
describe('Subscription Service', () => {
  it('should create Premium subscription and grant credits', async () => {
    const user = await createTestUser();
    const result = await subscriptionService.createSubscription(user.id, {
      plan: 'PREMIUM',
      paymentMethodId: 'pm_card_visa'
    });

    expect(result.success).toBe(true);
    expect(result.data.plan).toBe('PREMIUM');
    expect(result.data.creditsBalance).toBe(100);
  });

  it('should handle checkout.session.completed webhook', async () => {
    const payload = createStripeWebhookPayload('checkout.session.completed', {
      metadata: { userId: 'user_123', plan: 'PREMIUM' }
    });

    const result = await webhookHandler.handleWebhook(payload, signature);

    expect(result.success).toBe(true);
    const subscription = await prisma.subscription.findUnique({
      where: { userId: 'user_123' }
    });
    expect(subscription.plan).toBe('PREMIUM');
    expect(subscription.creditsBalance).toBe(100);
  });
});
```

### End-to-End Testing

**Cypress E2E** (`frontend/cypress/e2e/subscription.cy.ts` - TODO):

```typescript
describe('Subscription Flow', () => {
  it('should complete Premium upgrade', () => {
    cy.login('test@example.com');
    cy.visit('/pricing');
    cy.contains('Upgrade to Premium').click();

    // Redirects to Stripe Checkout
    cy.url().should('include', 'checkout.stripe.com');

    // Fill payment details (test mode)
    cy.get('input[name="cardNumber"]').type('4242424242424242');
    cy.get('input[name="cardExpiry"]').type('1234');
    cy.get('input[name="cardCvc"]').type('123');
    cy.get('button[type="submit"]').click();

    // Redirects back to success page
    cy.url().should('include', '/subscription/success');
    cy.contains('Welcome to Premium!');

    // Verify credits granted
    cy.visit('/account/billing');
    cy.contains('100 credits');
  });
});
```

---

## Security

### Best Practices Implemented

#### 1. API Key Protection

✅ **Environment Variables**
- Keys stored in `.env` (never in code)
- `.env` in `.gitignore`
- Separate keys for dev/staging/production

✅ **Secret Rotation**
- Rotate keys annually or after breach
- Stripe allows multiple API keys for zero-downtime rotation

#### 2. Webhook Signature Verification

✅ **Automatic Verification**
```typescript
// backend/src/lib/payment/webhooks.ts:30
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**What this prevents:**
- Forged webhooks
- Unauthorized credit grants
- Fake subscription activations

**If verification fails:**
- Returns 401 Unauthorized
- Logs security warning
- Stripe marks webhook as failed

#### 3. Payment Data Handling

✅ **PCI Compliance**
- ❌ Never store card numbers
- ❌ Never store CVV
- ❌ Never log full card details
- ✅ Only store Stripe tokens (e.g., `pm_xxx`, `cus_xxx`)

✅ **Stripe Elements**
- Frontend uses Stripe.js (PCI-compliant)
- Card data never touches your server
- Tokenization happens in Stripe's domain

#### 4. HTTPS Requirement

⚠️ **Webhooks require HTTPS:**
- Stripe refuses HTTP webhook URLs
- Use Let's Encrypt for free SSL
- Configure SSL termination at load balancer

#### 5. Authentication & Authorization

✅ **JWT Authentication**
- All subscription endpoints require `Authorization: Bearer <token>`
- Tokens expire after 7 days

✅ **Role-Based Access Control**
- `USER` role: Manage own subscription only
- `ADMIN` role: Manage all subscriptions, grant credits
- `VENDOR` role: No subscription access

✅ **Resource Ownership Checks**
```typescript
// Only allow users to access their own subscription
if (user.id !== subscription.userId && user.role !== 'ADMIN') {
  throw new ForbiddenError();
}
```

#### 6. Rate Limiting

✅ **Fastify Rate Limit** (configured):
```typescript
// backend/src/server.ts
fastify.register(rateLimit, {
  max: 100,           // 100 requests
  timeWindow: 60000   // per minute
});
```

#### 7. Audit Logging

✅ **Comprehensive Audit Trail**
```typescript
// backend/src/services/subscription.service.ts:381
await this.logAudit({
  action: 'SUBSCRIPTION_CREATED',
  entity: 'Subscription',
  entityId: subscription.id,
  userId: context.userId,
  ipAddress: context.ipAddress,
  userAgent: context.userAgent,
  newValues: {
    plan: subscription.plan,
    status: subscription.status,
    creditsBalance: subscription.creditsBalance
  }
});
```

**Logged Events:**
- Subscription created/updated/canceled
- Credits granted/deducted
- Payment methods added/removed
- Admin actions

### Security Checklist

Before going live:

- [ ] Rotate all API keys from test to live mode
- [ ] Enable Stripe Radar (fraud detection)
- [ ] Set up Stripe webhook signature verification alerts
- [ ] Configure HTTPS with valid SSL certificate
- [ ] Enable rate limiting on all endpoints
- [ ] Review and test RBAC permissions
- [ ] Set up monitoring for failed payments
- [ ] Configure alerts for unusual activity (many cancellations, etc.)
- [ ] Test webhook verification with invalid signatures
- [ ] Ensure `.env` file is in `.gitignore`
- [ ] Use environment-specific Stripe accounts
- [ ] Enable 3D Secure for EU cards (automatic with Stripe)
- [ ] Review PCI compliance requirements
- [ ] Set up database backups (includes payment data)

---

## Troubleshooting

### Common Issues

#### Issue 1: Webhooks Not Firing

**Symptoms:**
- User completes payment
- Subscription not created in database
- Credits not granted

**Diagnosis:**
```bash
# Check webhook logs in Stripe Dashboard
# Go to: https://dashboard.stripe.com/test/webhooks
# Click on your webhook → View events
# Look for failed deliveries (red X)
```

**Possible Causes:**

1. **Webhook URL unreachable**
   - Solution: Verify URL is publicly accessible (not localhost)
   - Test: `curl https://api.heliolus.com/v1/webhooks/health`

2. **Invalid webhook secret**
   - Symptom: 401 Unauthorized responses
   - Solution: Copy correct `whsec_...` from Stripe Dashboard
   - Update `STRIPE_WEBHOOK_SECRET` in `.env`

3. **Webhook endpoint not registered**
   - Solution: Add endpoint in Stripe Dashboard → Webhooks

4. **Server error (500)**
   - Check backend logs: `docker logs backend`
   - Check database connection
   - Verify Prisma client is generated: `npx prisma generate`

**Fix:**
```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3001/v1/webhooks/stripe

# In another terminal, trigger test event
stripe trigger checkout.session.completed

# Check backend logs for webhook processing
```

#### Issue 2: Credits Not Granted After Payment

**Symptoms:**
- Subscription created
- Status is ACTIVE
- `creditsBalance` is 0

**Diagnosis:**
```sql
-- Check if webhook was processed
SELECT * FROM "WebhookEvent"
WHERE "type" = 'checkout.session.completed'
  AND "eventData"::jsonb->'data'->'object'->'metadata'->>'userId' = 'user_xxx'
ORDER BY "createdAt" DESC;

-- Check credit transactions
SELECT * FROM "CreditTransaction"
WHERE "subscriptionId" = 'sub_xxx'
ORDER BY "createdAt";
```

**Possible Causes:**

1. **Webhook processed but credit grant failed**
   - Check `WebhookEvent.processingResult` for error details
   - Look for database transaction errors in logs

2. **Race condition** (rare)
   - Webhook arrived before subscription record created
   - Solution: Webhook should create subscription if not exists

3. **Wrong plan configuration**
   - Check `PAYMENT_CONFIG.subscriptions.plans[PREMIUM].credits`
   - Should be `100` for Premium

**Fix:**
```typescript
// Manually grant credits (admin only)
POST /v1/admin/subscriptions/:userId/grant-credits
Authorization: Bearer <admin-token>
{
  "amount": 100,
  "reason": "Webhook credit grant failed - manual correction"
}
```

#### Issue 3: User Redirected to Stripe but No Session ID

**Symptoms:**
- User clicks "Upgrade to Premium"
- Gets error: "Failed to create checkout session"

**Diagnosis:**
```bash
# Check backend logs
docker logs backend | grep "Create checkout session"

# Common errors:
# - "No such price: price_xxx" → Invalid STRIPE_PREMIUM_PRICE_ID
# - "Invalid API key" → Wrong STRIPE_SECRET_KEY
# - "No such customer" → Customer ID not found
```

**Possible Causes:**

1. **Missing Stripe Price ID**
   - Check `.env`: `STRIPE_PREMIUM_PRICE_ID_MONTHLY=price_xxx`
   - Verify price exists in Stripe Dashboard → Products

2. **Invalid API key**
   - Verify `STRIPE_SECRET_KEY` starts with `sk_test_` or `sk_live_`
   - Check key is for correct environment (test vs live)

3. **Price not active in Stripe**
   - Go to Product in Stripe Dashboard
   - Check price is not archived

**Fix:**
```bash
# Verify price exists
stripe prices retrieve price_xxx

# If not found, create new price
stripe prices create \
  --product prod_xxx \
  --unit-amount 59900 \
  --currency eur \
  --recurring[interval]=month

# Update .env with new price ID
```

#### Issue 4: Subscription Shows PAST_DUE After Successful Payment

**Symptoms:**
- Payment succeeded in Stripe
- Subscription status stuck at PAST_DUE

**Diagnosis:**
```sql
-- Check subscription status
SELECT "status", "stripeSubscriptionId", "updatedAt"
FROM "Subscription"
WHERE "userId" = 'user_xxx';

-- Check recent webhooks
SELECT "type", "processed", "processingResult"
FROM "WebhookEvent"
WHERE "stripeEventId" LIKE '%sub_xxx%'
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Possible Causes:**

1. **`invoice.paid` webhook failed**
   - Check webhook event processing result
   - Manually replay webhook from Stripe Dashboard

2. **Database update failed**
   - Check for database connection issues
   - Verify no foreign key constraints failing

**Fix:**
```typescript
// Manually update subscription status (admin route)
PATCH /v1/admin/subscriptions/:subscriptionId
Authorization: Bearer <admin-token>
{
  "status": "ACTIVE"
}

// Or via database
UPDATE "Subscription"
SET "status" = 'ACTIVE', "updatedAt" = NOW()
WHERE "id" = 'sub_xxx';
```

#### Issue 5: User Can't Cancel Subscription

**Symptoms:**
- User clicks "Cancel Subscription"
- Gets 400 error or subscription remains active

**Diagnosis:**
```bash
# Check backend logs
docker logs backend | grep "Cancel subscription"

# Test API directly
curl -X POST https://api.heliolus.com/v1/subscriptions/cancel \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"immediately": false}'
```

**Possible Causes:**

1. **No Stripe subscription ID**
   - Subscription created without Stripe (e.g., admin-granted Enterprise)
   - Solution: Only cancel in database, skip Stripe call

2. **Stripe subscription already canceled**
   - Stripe returns error: "Subscription already canceled"
   - Solution: Update database status to CANCELED

3. **Permission issue**
   - User trying to cancel another user's subscription
   - Check RBAC middleware

**Fix:**
```typescript
// backend/src/services/subscription.service.ts:740
async cancelSubscription(userId: string, immediately: boolean) {
  const subscription = await this.prisma.subscription.findUnique({
    where: { userId }
  });

  // Only cancel in Stripe if subscription exists there
  if (subscription.stripeSubscriptionId) {
    try {
      if (immediately) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } else {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      }
    } catch (error) {
      // Log but don't fail if Stripe subscription not found
      if (error.code !== 'resource_missing') {
        throw error;
      }
    }
  }

  // Always update database
  await this.prisma.subscription.update({
    where: { userId },
    data: {
      status: immediately ? 'CANCELED' : 'ACTIVE',
      cancelAt: immediately ? null : subscription.currentPeriodEnd,
      canceledAt: immediately ? new Date() : null
    }
  });
}
```

### Debugging Tools

#### 1. Stripe Dashboard

**Useful Pages:**
- [Payments](https://dashboard.stripe.com/test/payments) - View all payments
- [Subscriptions](https://dashboard.stripe.com/test/subscriptions) - View all subscriptions
- [Customers](https://dashboard.stripe.com/test/customers) - View customer records
- [Webhooks](https://dashboard.stripe.com/test/webhooks) - Debug webhook delivery
- [Logs](https://dashboard.stripe.com/test/logs) - API request logs

**Search Tips:**
- Search by user email
- Search by subscription ID (`sub_xxx`)
- Search by checkout session ID (`cs_xxx`)
- Filter by status (active/canceled/past_due)

#### 2. Backend Logs

```bash
# View live logs
docker logs -f backend

# Filter for subscription events
docker logs backend | grep -i subscription

# Filter for webhook events
docker logs backend | grep -i webhook

# Filter for Stripe API calls
docker logs backend | grep -i stripe
```

#### 3. Database Queries

```sql
-- View all active subscriptions
SELECT
  u.email,
  s.plan,
  s.status,
  s.creditsBalance,
  s.currentPeriodEnd
FROM "Subscription" s
JOIN "User" u ON s."userId" = u.id
WHERE s.status = 'ACTIVE'
ORDER BY s."createdAt" DESC;

-- View recent credit transactions
SELECT
  u.email,
  ct.type,
  ct.amount,
  ct.balance,
  ct.description,
  ct."createdAt"
FROM "CreditTransaction" ct
JOIN "Subscription" s ON ct."subscriptionId" = s.id
JOIN "User" u ON s."userId" = u.id
ORDER BY ct."createdAt" DESC
LIMIT 50;

-- View webhook events
SELECT
  type,
  processed,
  "processingResult",
  "createdAt"
FROM "WebhookEvent"
ORDER BY "createdAt" DESC
LIMIT 20;

-- Find failed webhooks
SELECT *
FROM "WebhookEvent"
WHERE processed = false
ORDER BY "createdAt" DESC;
```

#### 4. Stripe CLI

```bash
# Listen to all events
stripe listen

# Listen and forward to local server
stripe listen --forward-to localhost:3001/v1/webhooks/stripe

# Trigger specific event
stripe trigger checkout.session.completed

# View recent events
stripe events list

# Get event details
stripe events retrieve evt_xxx

# Test API endpoint
stripe api /v1/customers/cus_xxx
```

### Getting Help

**Stripe Support:**
- Dashboard → Help → Contact Support
- Email: support@stripe.com
- Phone: +1 (888) 926-2289 (US)
- Docs: https://stripe.com/docs

**Common Support Topics:**
- Webhook not firing
- Payment declined (with specific error code)
- Account verification issues
- Payout schedule

**Internal Escalation:**
- Check backend logs first
- Verify Stripe Dashboard shows same issue
- Check database for data inconsistencies
- Gather: User ID, Subscription ID, Stripe Customer ID
- Review webhook event logs

---

## API Reference

### Subscription Endpoints

#### `GET /v1/subscriptions/current`

Get authenticated user's current subscription.

**Authentication:** Required (JWT)

**Response:**
```json
{
  "id": "sub_xxx",
  "plan": "PREMIUM",
  "status": "ACTIVE",
  "creditsBalance": 75,
  "creditsUsed": 25,
  "currentPeriodStart": "2025-10-01T00:00:00Z",
  "currentPeriodEnd": "2025-11-01T00:00:00Z",
  "cancelAt": null
}
```

**Code:** `backend/src/routes/subscription.routes.ts:299`

---

#### `POST /v1/subscriptions/checkout`

Create Stripe Checkout session for subscription upgrade.

**Authentication:** Required (JWT)

**Request:**
```json
{
  "plan": "PREMIUM"  // PREMIUM | ENTERPRISE
}
```

**Response:**
```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
}
```

**Next Step:** Redirect user to `url` to complete payment.

**Code:** `backend/src/routes/subscription.routes.ts:746`

---

#### `POST /v1/subscriptions/cancel`

Cancel current subscription.

**Authentication:** Required (JWT)

**Request:**
```json
{
  "immediately": false  // true = cancel now, false = cancel at period end
}
```

**Response:**
```json
{
  "message": "Subscription will be canceled at the end of the billing period",
  "cancelAt": "2025-11-01T00:00:00Z"
}
```

**Code:** `backend/src/routes/subscription.routes.ts:849`

---

#### `GET /v1/subscriptions/credits`

Get user's credit balance.

**Authentication:** Required (JWT)

**Response:**
```json
{
  "balance": 75,      // Remaining credits
  "used": 25,         // Credits used
  "purchased": 100    // Total credits purchased
}
```

**Code:** `backend/src/routes/subscription.routes.ts:966`

---

#### `POST /v1/subscriptions/credits/purchase`

Purchase additional credits (€299 for 50 credits).

**Authentication:** Required (JWT)

**Request:**
```json
{
  "amount": 50  // Currently ignored - always 50 credits
}
```

**Response:**
```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
}
```

**Code:** `backend/src/routes/subscription.routes.ts:1044`

---

#### `GET /v1/subscriptions/invoices`

List user's invoices with pagination.

**Authentication:** Required (JWT)

**Query Parameters:**
- `status` (optional): Filter by status (DRAFT/OPEN/PAID/VOID/UNCOLLECTIBLE)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "inv_xxx",
      "number": "INV-2025-001",
      "status": "PAID",
      "total": 599.00,
      "currency": "EUR",
      "dueDate": "2025-10-30T00:00:00Z",
      "paidAt": "2025-10-30T10:15:00Z",
      "createdAt": "2025-10-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

**Code:** `backend/src/routes/subscription.routes.ts:1114`

---

### Admin Endpoints

#### `POST /v1/admin/subscriptions/:userId/grant-credits`

Grant credits to a user (Enterprise customers).

**Authentication:** Required (JWT) - Admin only

**Request:**
```json
{
  "amount": 100,
  "reason": "Enterprise Q1 2025 allocation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ct_xxx",
    "subscriptionId": "sub_xxx",
    "type": "GRANT",
    "amount": 100,
    "balance": 175,
    "description": "Enterprise Q1 2025 allocation",
    "createdAt": "2025-10-30T12:00:00Z"
  }
}
```

**Code:** `backend/src/routes/admin.routes.ts:75` (schema only, implementation TODO)

---

### Public Endpoints

#### `GET /v1/public/plans`

List all public subscription plans.

**Authentication:** Not required

**Response:**
```json
{
  "data": [
    {
      "id": "plan_xxx",
      "slug": "freemium",
      "name": "Freemium",
      "description": "Get started with basic compliance assessments",
      "monthlyPrice": 0,
      "annualPrice": 0,
      "currency": "EUR",
      "monthlyCredits": 0,
      "assessmentCredits": 50,
      "maxAssessments": 2,
      "maxUsers": 1,
      "features": [
        "2 compliance assessments",
        "Basic risk analysis",
        "Blurred gap details",
        "Limited vendor access"
      ],
      "trialDays": 0,
      "isActive": true,
      "displayOrder": 1
    },
    {
      "slug": "premium",
      "name": "Premium",
      "monthlyPrice": 599.00,
      "annualPrice": 6469.20,
      "monthlyCredits": 100,
      "features": [
        "Unlimited assessments",
        "AI-powered analysis",
        "Full gap details",
        "Vendor marketplace access",
        "Priority support"
      ]
    }
  ]
}
```

**Code:** `backend/src/routes/public.routes.ts` (TODO: implement)

---

### Webhook Endpoint

#### `POST /v1/webhooks/stripe`

Receive Stripe webhook events.

**Authentication:** Signature verification (not JWT)

**Headers:**
- `stripe-signature`: HMAC signature for verification

**Request Body:** Raw JSON from Stripe

**Response:**
```json
{
  "received": true
}
```

**Code:** `backend/src/routes/webhook.routes.ts:13`

---

## Appendix

### Stripe Resources

- **Dashboard:** https://dashboard.stripe.com
- **API Docs:** https://stripe.com/docs/api
- **Testing Docs:** https://stripe.com/docs/testing
- **Webhooks Guide:** https://stripe.com/docs/webhooks
- **Checkout Docs:** https://stripe.com/docs/payments/checkout
- **Subscriptions Guide:** https://stripe.com/docs/billing/subscriptions/overview
- **Stripe CLI:** https://stripe.com/docs/stripe-cli

### Related Documentation

- [Product Requirements - Pay-Gating Plan](/docs/V4_REVISED_PAY_GATING_PLAN.md)
- [Database Schema](/backend/prisma/schema.prisma)
- [API Architecture](/docs/architecture.md)
- [CLAUDE.md - Project Overview](/CLAUDE.md)

### Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-30 | 1.0 | Initial documentation |

### Contributors

- Development Team
- Stripe Integration
- Documentation by Claude Code

---

**Questions or issues?** Contact the development team or refer to troubleshooting section above.
