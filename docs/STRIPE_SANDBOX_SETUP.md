# Stripe Sandbox Setup Guide

## Overview

The Heliolus platform now has **full Stripe integration enabled** for sandbox/test mode. This allows you to test subscription management, payment processing, and credit purchases using Stripe's test environment.

## Current Status

✅ **COMPLETE** - Stripe integration is fully configured and operational

### What's Been Implemented

1. ✅ Real Stripe SDK integration (v18.5.0)
2. ✅ Test API keys configured in environment
3. ✅ Payment library enabled (replaced mock implementation)
4. ✅ Compatibility layer for existing subscription service
5. ✅ Webhook endpoint ready for configuration
6. ✅ Server starts successfully with Stripe integration

## Configuration

### Environment Variables

The following test keys are configured in `backend/.env`:

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_51SGKylGialFATytvJkqAn5WJMm79bgrLt1hk155osSHUIuf8T5U2cQg09jSNP0aBKBhFVIZLm3XLnF9bJ96MeRBE00KbXanoH4
STRIPE_SECRET_KEY=sk_test_51SGKylGialFATytvAFeT9CNwxjSyjzi52aWt7WTnrlSdKQlBXcFLHdSoJmOmupWKF0o3r8s6Lfj7YPYYQ6Evu8fA001lNhubl6
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
```

**Note:** The webhook secret needs to be configured when you set up webhook endpoints in the Stripe dashboard.

### API Version

Using Stripe API version: `2025-08-27.basil` (latest compatible with Stripe SDK v18.5.0)

## Available Features

### 1. Customer Management
- Create Stripe customers linked to user accounts
- Update customer information
- Manage payment methods

### 2. Subscription Management
- Create subscriptions (FREE, PREMIUM, ENTERPRISE)
- Update subscription plans
- Cancel subscriptions (immediately or at period end)
- Trial period support

### 3. Payment Processing
- One-time payments for credit purchases
- Recurring subscription billing
- Payment method management

### 4. Credit System
- Purchase additional assessment credits
- Track credit balance and transactions
- Automatic credit allocation on subscription renewal

### 5. Invoicing
- Automatic invoice generation
- Invoice retrieval and management
- PDF invoice generation

### 6. Webhooks
- Webhook signature verification
- Event processing for:
  - Subscription updates
  - Payment successes/failures
  - Customer updates
  - Invoice events

## Testing Stripe Integration

### 1. Test Card Numbers

Use these test cards in sandbox mode:

- **Successful Payment:**
  - Card: `4242 4242 4242 4242`
  - Any future expiry date
  - Any 3-digit CVC

- **Declined Payment:**
  - Card: `4000 0000 0000 0002`

- **Requires Authentication (3D Secure):**
  - Card: `4000 0025 0000 3155`

[Full list of test cards](https://stripe.com/docs/testing#cards)

### 2. Testing Subscription Creation

```typescript
// Example API call to create a subscription
POST /v1/subscription
{
  "plan": "PREMIUM",
  "billingCycle": "MONTHLY",
  "paymentMethodId": "pm_test_xxx"  // From Stripe.js
}
```

### 3. Testing Credit Purchase

```typescript
// Example API call to purchase credits
POST /v1/subscription/purchase-additional-assessment
{
  "stripePriceId": "price_xxx",
  "stripePaymentMethodId": "pm_test_xxx"
}
```

## Webhook Configuration

### Setting Up Webhooks

1. **Go to Stripe Dashboard**
   - Navigate to: Developers → Webhooks
   - Click "Add endpoint"

2. **Configure Endpoint URL**
   ```
   https://your-domain.com/v1/webhooks/stripe
   ```

3. **Select Events to Listen For:**
   - `customer.created`
   - `customer.updated`
   - `customer.deleted`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

4. **Copy Webhook Secret**
   - After creating the endpoint, copy the webhook signing secret (starts with `whsec_`)
   - Update `backend/.env`:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
     ```

5. **Test Webhook**
   - Use Stripe CLI or dashboard to send test events
   - Verify events are received and processed correctly

### Using Stripe CLI for Local Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe
# or
scoop install stripe

# Login to your Stripe account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/v1/webhooks/stripe

# Test webhook delivery
stripe trigger payment_intent.succeeded
```

## Pricing Configuration

Current pricing (configured in `backend/src/lib/payment/config.ts`):

### Subscription Plans

| Plan | Monthly Price | Annual Price | Credits | Features |
|------|--------------|--------------|---------|----------|
| FREE | €0 | €0 | 0 | 2 assessments total |
| PREMIUM | €599 | €5,990 | 100 | AI analysis, priority support |
| ENTERPRISE | Custom | Custom | 0 | All features, custom templates |

### Credit Packages

| Package | Credits | Price |
|---------|---------|-------|
| Small | 50 | €29 |
| Medium | 150 | €79 |
| Large | 400 | €199 |
| Enterprise | 1000 | €399 |

**Note:** Prices are in cents (e.g., 59900 = €599.00)

## Architecture

### Payment Library Structure

```
backend/src/lib/payment/
├── config.ts           # Configuration (plans, prices, settings)
├── index.ts            # Main export file
├── types.ts            # TypeScript interfaces
├── stripe.ts           # Stripe provider implementation
├── subscriptions.ts    # Subscription management
├── credits.ts          # Credit system
├── invoicing.ts        # Invoice generation
├── webhooks.ts         # Webhook handling
├── compat.ts           # Compatibility layer for existing code
└── mock.ts             # Mock implementation (for testing)
```

### Integration Points

1. **Subscription Service** (`backend/src/services/subscription.service.ts`)
   - Uses compatibility layer for Stripe operations
   - Manages database records alongside Stripe

2. **Webhook Routes** (`backend/src/routes/webhook.routes.ts`)
   - Receives Stripe webhook events
   - Processes events and updates database

3. **Subscription Routes** (`backend/src/routes/subscription.routes.ts`)
   - Handles subscription CRUD operations
   - Integrates with Stripe for payment processing

## Next Steps for Production

When ready to move to production:

1. **Switch to Live Keys**
   ```bash
   STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   STRIPE_SECRET_KEY=sk_live_xxxxx
   ```

2. **Update Webhook Endpoint**
   - Configure production webhook URL in Stripe dashboard
   - Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

3. **Enable Live Mode in Frontend**
   - Update Stripe.js initialization to use live publishable key

4. **Review Pricing**
   - Verify all prices in `config.ts` match intended production pricing
   - Create corresponding products/prices in Stripe dashboard

5. **Test Payment Flow End-to-End**
   - Complete subscription purchase
   - Verify webhook processing
   - Confirm database updates
   - Test subscription upgrades/downgrades

## Monitoring

### Stripe Dashboard

Monitor the following in your Stripe dashboard:

- **Payments** - Track successful and failed payments
- **Subscriptions** - View active subscriptions and churn
- **Customers** - Customer lifecycle and payment methods
- **Billing** - Invoices and payment history
- **Logs** - API requests and webhook events

### Application Logs

The integration logs important events:

```typescript
// Webhook processing
console.log(`Received Stripe webhook: ${event.type}`);

// Subscription creation
console.log(`Creating subscription for customer ${customerId}`);

// Payment errors
console.error('Webhook processing error:', error);
```

## Troubleshooting

### Common Issues

1. **"STRIPE_SECRET_KEY is not defined"**
   - Verify `.env` file has the correct keys
   - Restart the server after updating `.env`

2. **"Webhook signature verification failed"**
   - Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
   - Ensure raw request body is passed to verification

3. **"Customer not found"**
   - Verify Stripe customer ID is stored in database
   - Check if customer exists in Stripe dashboard

4. **"Payment method not attached"**
   - Ensure payment method is attached to customer
   - Use Stripe dashboard to verify payment method status

### Debug Mode

Enable detailed logging by setting:

```bash
LOG_LEVEL=debug
```

This will show all Stripe API calls and responses.

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

## Summary

✅ **Stripe sandbox is fully operational**
- Real Stripe API integration enabled
- Test keys configured
- Payment processing ready
- Webhook support implemented
- Compatible with existing codebase

You can now test the complete payment flow in sandbox mode using Stripe's test card numbers and test environment.
