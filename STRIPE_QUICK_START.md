# Stripe Sandbox Quick Start 🚀

## ✅ Setup Complete!

Your Stripe sandbox is **fully configured and operational**. Here's everything you need to know:

## 🔑 Your Test Keys (Already Configured)

```bash
# These are set as Replit Secrets or in backend/.env
STRIPE_PUBLISHABLE_KEY=pk_test_...your-publishable-key...
STRIPE_SECRET_KEY=sk_test_...your-secret-key...
```

**To set up Stripe keys:**
1. Get your test keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Add them to Replit Secrets (recommended) or backend/.env
3. Keys should start with `pk_test_` (publishable) and `sk_test_` (secret)

## 🧪 Quick Test

### 1. Start the Server

```bash
cd backend
npm run dev
```

You should see:
```
✅ subscription service: healthy
🚀 Services initialized successfully!
```

### 2. Test with Stripe's Test Cards

Use these cards in your payment forms:

**✅ Success:**
```
Card: 4242 4242 4242 4242
Exp: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**❌ Declined:**
```
Card: 4000 0000 0000 0002
```

**🔐 Requires 3D Secure:**
```
Card: 4000 0025 0000 3155
```

## 📍 What's Working

- [x] Real Stripe API integration (not mock)
- [x] Customer creation & management
- [x] Subscription management (create, update, cancel)
- [x] Payment processing
- [x] Credit purchases
- [x] Invoice generation
- [x] Webhook support (needs endpoint configuration)

## 🎯 Next Steps

### 1. Set Up Webhooks (Optional but Recommended)

Webhooks let Stripe notify your app about events (payments, subscription changes, etc.)

**Option A: Use Stripe CLI (for local development)**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3001/v1/webhooks/stripe

# This will output a webhook secret starting with whsec_
# Copy it to backend/.env as STRIPE_WEBHOOK_SECRET
```

**Option B: Use Stripe Dashboard (for deployed apps)**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your URL: `https://your-domain.com/v1/webhooks/stripe`
4. Select events to listen for (or select "Select all events")
5. Copy the webhook signing secret
6. Add to `backend/.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### 2. Test the Payment Flow

**Create a Premium Subscription:**
```bash
POST https://your-domain.com/v1/subscription
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "plan": "PREMIUM",
  "billingCycle": "MONTHLY",
  "paymentMethodId": "pm_card_visa"  // From Stripe.js
}
```

**Purchase Additional Credits:**
```bash
POST https://your-domain.com/v1/subscription/purchase-additional-assessment
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "stripePriceId": "price_1234567890",
  "stripePaymentMethodId": "pm_card_visa"
}
```

### 3. Monitor in Stripe Dashboard

Visit [https://dashboard.stripe.com/test](https://dashboard.stripe.com/test) to see:
- **Payments** - All test transactions
- **Customers** - Customer accounts created
- **Subscriptions** - Active subscriptions
- **Logs** - API requests and webhook events

## 💰 Pricing (Test Mode)

| Plan | Price | Credits | Notes |
|------|-------|---------|-------|
| FREE | €0 | 0 | 2 assessments total |
| PREMIUM Monthly | €599 | 100 | ~2 assessments worth |
| PREMIUM Annual | €5,990 | 100 | 10 months for free |
| ENTERPRISE | Custom | Custom | Contact sales |

**Additional Credits:**
- 50 credits: €29
- 150 credits: €79
- 400 credits: €199
- 1000 credits: €399

## 🔧 Troubleshooting

**Issue:** "Cannot connect to Stripe"
- **Fix:** Check that `STRIPE_SECRET_KEY` starts with `sk_test_`

**Issue:** "Payment failed"
- **Fix:** Use test card `4242 4242 4242 4242` (not a real card)

**Issue:** "Webhook signature invalid"
- **Fix:** Ensure `STRIPE_WEBHOOK_SECRET` is correctly set in `.env`

**Issue:** "Server won't start"
- **Fix:** Check for port conflicts, restart server

## 📚 Resources

- **Complete Documentation:** `docs/STRIPE_SANDBOX_SETUP.md`
- **Stripe Test Cards:** https://stripe.com/docs/testing#cards
- **Stripe API Docs:** https://stripe.com/docs/api
- **Stripe Dashboard:** https://dashboard.stripe.com/test

## 🚨 Important Notes

1. **These are TEST keys** - They only work with test cards and won't charge real money
2. **Test mode data is separate** - Test and live mode have separate customers, payments, etc.
3. **No real charges** - You can test as much as you want without any cost
4. **Dashboard access** - All test data visible at dashboard.stripe.com/test

## ✨ You're Ready!

Your Stripe sandbox is fully functional. Start testing your payment flows with confidence!

Need help? Check the full documentation in `docs/STRIPE_SANDBOX_SETUP.md`
