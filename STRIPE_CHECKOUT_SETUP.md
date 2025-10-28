# Stripe Checkout Integration Setup Guide

This guide will walk you through setting up Stripe Checkout for the Heliolus platform.

## ✅ What's Been Done

- ✅ Backend: Stripe Checkout Session creation endpoint (`POST /v1/subscriptions/checkout`)
- ✅ Backend: Webhook handler for `checkout.session.completed` and other Stripe events
- ✅ Backend: Dynamic price creation (fallback if Price IDs not configured)
- ✅ Frontend: Updated checkout page to redirect to Stripe hosted checkout
- ✅ Environment: Added placeholders for Stripe Price IDs

## 🔧 What You Need to Do

### Step 1: Create Products and Prices in Stripe Dashboard

1. **Go to Stripe Test Dashboard**
   https://dashboard.stripe.com/test/products

2. **Create PREMIUM Product**
   - Click "+ Add product"
   - Product name: `Premium Plan`
   - Description: `Heliolus Premium subscription - Full compliance analysis with AI-powered insights`
   - Click "Add pricing"

   **Monthly Price:**
   - Pricing model: `Recurring`
   - Price: `599` EUR
   - Billing period: `Monthly`
   - Click "Add price"

   **Annual Price (optional for future):**
   - Click "Add another price"
   - Price: `6490` EUR
   - Billing period: `Yearly`
   - Click "Add price"

3. **Copy the Price ID**
   - After creating the monthly price, you'll see a Price ID like `price_1ABC123xyz`
   - Copy this ID

4. **Create ENTERPRISE Product (optional)**
   - Repeat the above for Enterprise if needed
   - Or leave for "Contact Sales" flow

### Step 2: Update Environment Variables

Add the Price IDs to `backend/.env`:

```bash
# Uncomment and add your actual Price IDs
STRIPE_PREMIUM_PRICE_ID=price_1ABC123xyz  # Replace with your price ID
# STRIPE_ENTERPRISE_PRICE_ID=price_xxxxxxxxxxxxx  # If you created Enterprise
```

### Step 3: Configure Webhook Endpoint

1. **Go to Stripe Webhooks**
   https://dashboard.stripe.com/test/webhooks

2. **Create a Webhook Endpoint**
   - Click "+ Add endpoint"
   - Endpoint URL: `https://your-backend-url.replit.app/v1/webhooks/stripe`
   - Description: `Heliolus subscription and payment webhooks`

3. **Select Events to Listen To**
   Select these events:
   - ✅ `checkout.session.completed` **(CRITICAL - this creates the subscription)**
   - ✅ `checkout.session.expired`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

4. **Get Webhook Signing Secret**
   - After creating the endpoint, click to reveal the "Signing secret"
   - It will look like: `whsec_ABC123xyz...`
   - Copy this value

5. **Update Environment Variable**
   Add to `backend/.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
   ```

### Step 4: Configure Stripe Checkout URLs

The success and cancel URLs are already configured in the code:
- Success: `https://your-frontend-url/subscription/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel: `https://your-frontend-url/subscription/cancel`

Make sure your `FRONTEND_URL` environment variable is correct in `backend/.env`.

### Step 5: Create Success/Cancel Pages (Frontend)

You'll need to create these two pages:

**`frontend/src/pages/SubscriptionSuccess.tsx`** - Shows after successful payment
**`frontend/src/pages/SubscriptionCancel.tsx`** - Shows if user cancels checkout

Example success page:
```tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Welcome to Premium!</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was successful. You now have access to all Premium features.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
}
```

**Add routes to `App.tsx`:**
```tsx
<Route path="/subscription/success" element={<SubscriptionSuccess />} />
<Route path="/subscription/cancel" element={<SubscriptionCancel />} />
```

## 🧪 Testing the Integration

### Test Cards
Use these Stripe test cards:

- **Success**: `4242 4242 4242 4242`
- **Requires authentication**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 9995`

All test cards:
- Any future expiry date (e.g., `12/34`)
- Any 3-digit CVC (e.g., `123`)
- Any billing ZIP code

### Testing Flow

1. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Checkout Flow**
   - Log in to the frontend
   - Go to `/pricing`
   - Click "Upgrade to Premium"
   - Click "Continue to Payment"
   - You should be redirected to Stripe Checkout page
   - Enter test card: `4242 4242 4242 4242`
   - Complete payment
   - You should be redirected back to your success page

4. **Verify in Database**
   ```bash
   cd backend
   node -e "
   const { PrismaClient } = require('./src/generated/prisma/index.js');
   const prisma = new PrismaClient();
   prisma.subscription.findUnique({
     where: { userId: 'your-user-id' }
   }).then(sub => {
     console.log(JSON.stringify(sub, null, 2));
     prisma.\$disconnect();
   });
   "
   ```

   You should see:
   - `plan: "PREMIUM"`
   - `status: "ACTIVE"`
   - `stripeCustomerId: "cus_..."`
   - `stripeSubscriptionId: "sub_..."`
   - `creditsBalance: 100` (or your configured amount)

5. **Check Webhook Events**
   - Go to Stripe Dashboard → Webhooks
   - Click on your endpoint
   - You should see `checkout.session.completed` event with status "Succeeded"

## 🔍 Troubleshooting

### Issue: "No checkout URL received"
- **Cause**: Checkout session creation failed
- **Fix**: Check backend logs for errors. Verify Stripe keys are correct.

### Issue: Webhook not receiving events
- **Cause**: Incorrect webhook URL or secret
- **Fix**:
  - Verify webhook URL is publicly accessible
  - Check webhook secret matches `.env`
  - Test webhook: Stripe Dashboard → Webhooks → Send test webhook

### Issue: User upgraded but no Stripe IDs
- **Cause**: Webhook didn't process correctly
- **Fix**: Check webhook logs in Stripe Dashboard. Ensure `checkout.session.completed` is being received.

### Issue: Dynamic prices being created
- **Cause**: Price IDs not set in environment
- **Fix**: Add `STRIPE_PREMIUM_PRICE_ID` to `.env`

## 📝 What Happens Behind the Scenes

### Checkout Flow
1. User clicks "Continue to Payment" → Frontend calls `POST /v1/subscriptions/checkout`
2. Backend creates Stripe Checkout Session → Returns session URL
3. Frontend redirects user to Stripe's hosted checkout page
4. User enters payment details on Stripe's page
5. Stripe processes payment → Fires `checkout.session.completed` webhook
6. Backend webhook handler receives event → Creates/updates subscription in database
7. Stripe redirects user back to success page
8. User sees "Welcome to Premium!" message

### Webhook Handler Does
- Creates Stripe customer if doesn't exist
- Creates/updates subscription record with Stripe IDs
- Adds initial credits for the plan
- Records credit transaction
- Updates subscription status to ACTIVE

## 🚀 Next Steps

- [ ] Create success/cancel pages in frontend
- [ ] Test with real Stripe test cards
- [ ] Verify webhook events in Stripe Dashboard
- [ ] Test subscription cancellation flow
- [ ] Add email notifications (optional)
- [ ] Implement customer portal for managing subscriptions (optional)

## 📚 Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe API Reference](https://stripe.com/docs/api)
