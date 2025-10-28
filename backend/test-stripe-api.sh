#!/bin/bash
# Quick test script for Stripe integration

API_URL="http://localhost:8543/v1"
USER_ID="cmh0oe6890000o03xb8rza882"
USER_EMAIL="test-1761057880863-pxseqx@example.com"

echo "🧪 Testing Stripe Integration"
echo "=============================="
echo ""

# Note: You'll need to set these after logging in
# JWT_TOKEN="your-jwt-token-here"

echo "📝 Step 1: Login to get JWT token"
echo "curl -X POST $API_URL/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\": \"$USER_EMAIL\", \"password\": \"your-password\"}'"
echo ""
echo "Then set your token:"
echo "export JWT_TOKEN=\"your-jwt-token-from-login-response\""
echo ""

if [ -z "$JWT_TOKEN" ]; then
  echo "⚠️  JWT_TOKEN not set. Please login first and run:"
  echo "   export JWT_TOKEN=\"your-token-here\""
  echo "   then run this script again"
  exit 1
fi

echo "=============================="
echo "💰 Step 2: Get Current Billing Info"
echo "=============================="
curl -X GET "$API_URL/subscriptions/$USER_ID/billing-info" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -w "\nStatus: %{http_code}\n\n" \
  | jq '.' 2>/dev/null || cat

echo ""
echo "=============================="
echo "📊 Step 3: Get User Assessment Quota"
echo "=============================="
curl -X GET "$API_URL/subscriptions/$USER_ID/assessment-quota" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -w "\nStatus: %{http_code}\n\n" \
  | jq '.' 2>/dev/null || cat

echo ""
echo "=============================="
echo "🎫 Step 4: Create Premium Subscription"
echo "=============================="
echo "Note: This will use Stripe test mode"
curl -X POST "$API_URL/subscriptions" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "PREMIUM",
    "billingCycle": "MONTHLY"
  }' \
  -w "\nStatus: %{http_code}\n\n" \
  | jq '.' 2>/dev/null || cat

echo ""
echo "=============================="
echo "✅ Test Complete!"
echo "=============================="
echo ""
echo "Check Stripe Dashboard: https://dashboard.stripe.com/test/payments"
