#!/bin/bash
# Get ready-to-use test commands with correct user ID

echo "🔍 Getting user ID from database..."
USER_ID=$(node -e "
import('./src/generated/prisma/index.js').then(({PrismaClient}) => {
  const prisma = new PrismaClient();
  prisma.user.findFirst().then(user => {
    console.log(user.id);
    prisma.\$disconnect();
  });
});
")

echo ""
echo "✅ Correct User ID: $USER_ID"
echo ""
echo "📋 Copy and use these commands:"
echo ""
echo "# 1. Get billing info"
echo "curl http://localhost:8543/v1/subscriptions/$USER_ID/billing-info \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\""
echo ""
echo "# 2. Upgrade subscription"
echo "curl -X POST http://localhost:8543/v1/subscriptions/$USER_ID/upgrade \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"plan\": \"PREMIUM\", \"billingCycle\": \"MONTHLY\"}'"
echo ""
