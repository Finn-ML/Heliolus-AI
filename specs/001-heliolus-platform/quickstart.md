# Heliolus Platform - Quick Start Guide

## Prerequisites

- Node.js 20 LTS or higher
- PostgreSQL 15+
- Redis 7+
- AWS account with S3 access
- Stripe account for payments
- OpenAI API key

## Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/heliolus/platform.git
cd platform
```

2. Install dependencies:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

3. Create `.env` files:

Backend `.env`:

```env
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/heliolus"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRES_IN="7d"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@heliolus.com"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="eu-west-1"
S3_BUCKET="heliolus-documents"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Cloudflare (optional)
CF_ACCOUNT_ID="your-account-id"
CF_API_TOKEN="your-api-token"
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/v1"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

4. Setup database:

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. Start services:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Redis (if not running)
redis-server
```

## Verification Steps

### 1. User Registration & Authentication

```bash
# Register a new user
curl -X POST http://localhost:3001/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "organizationName": "ACME Corp"
  }'

# Login
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "SecurePass123!"
  }'
```

Expected: JWT token returned

### 2. Organization Setup

```bash
# Create organization
TOKEN="your-jwt-token"
curl -X POST http://localhost:3001/v1/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ACME Corp",
    "website": "https://acme.com",
    "industry": "Financial Services",
    "size": "MIDMARKET",
    "country": "United States"
  }'

# Parse website
ORG_ID="org-id-from-response"
curl -X POST http://localhost:3001/v1/organizations/$ORG_ID/parse-website \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Organization created with parsed website data

### 3. Document Upload

```bash
# Upload document
curl -X POST http://localhost:3001/v1/organizations/$ORG_ID/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/policy.pdf" \
  -F "documentType=POLICY"
```

Expected: Document uploaded and parsed

### 4. Run Assessment

```bash
# Get templates
curl http://localhost:3001/v1/templates \
  -H "Authorization: Bearer $TOKEN"

# Create assessment
TEMPLATE_ID="template-id-from-response"
curl -X POST http://localhost:3001/v1/assessments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "'$ORG_ID'",
    "templateId": "'$TEMPLATE_ID'"
  }'

# Complete assessment
ASSESSMENT_ID="assessment-id-from-response"
curl -X POST http://localhost:3001/v1/assessments/$ASSESSMENT_ID/complete \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Assessment completed with risk score

### 5. View Gaps & Risks

```bash
# Get gaps
curl http://localhost:3001/v1/assessments/$ASSESSMENT_ID/gaps \
  -H "Authorization: Bearer $TOKEN"

# Get risks
curl http://localhost:3001/v1/assessments/$ASSESSMENT_ID/risks \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Lists of identified gaps and risks

### 6. Generate Report

```bash
# Generate report
curl -X POST http://localhost:3001/v1/assessments/$ASSESSMENT_ID/report \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DETAILED",
    "format": "PDF"
  }'

# Download report (Premium only)
REPORT_ID="report-id-from-response"
curl http://localhost:3001/v1/reports/$REPORT_ID/download \
  -H "Authorization: Bearer $TOKEN" \
  -o report.pdf
```

Expected: Report generated (download requires Premium)

### 7. Browse Vendor Marketplace

```bash
# List vendors
curl http://localhost:3001/v1/vendors?category=KYC_AML \
  -H "Authorization: Bearer $TOKEN"

# Get vendor details
VENDOR_ID="vendor-id-from-response"
curl http://localhost:3001/v1/vendors/$VENDOR_ID \
  -H "Authorization: Bearer $TOKEN"

# Get vendor matches for gap
GAP_ID="gap-id-from-earlier"
curl http://localhost:3001/v1/gaps/$GAP_ID/vendor-matches \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Vendor listings and matches

### 8. Contact Vendor (Premium)

```bash
# Contact vendor
curl -X POST http://localhost:3001/v1/vendors/$VENDOR_ID/contact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DEMO_REQUEST",
    "message": "Interested in learning more about your KYC solution",
    "budget": "€50k-100k",
    "timeline": "Q2 2025"
  }'
```

Expected: Contact request sent (Premium required)

### 9. Subscription Management

```bash
# Get current subscription
curl http://localhost:3001/v1/subscriptions/current \
  -H "Authorization: Bearer $TOKEN"

# Create checkout session for Premium
curl -X POST http://localhost:3001/v1/subscriptions/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "PREMIUM"
  }'
```

Expected: Subscription details and Stripe checkout URL

### 10. Admin Functions

```bash
# Login as admin
curl -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@heliolus.com",
    "password": "AdminPass123!"
  }'

# Approve vendor (admin only)
ADMIN_TOKEN="admin-jwt-token"
curl -X PATCH http://localhost:3001/v1/admin/vendors/$VENDOR_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED"
  }'
```

Expected: Vendor approved

## Frontend Testing

1. Open http://localhost:3000
2. Register with business email
3. Complete email verification
4. Set up organization profile
5. Upload compliance documents
6. Run financial crime assessment
7. View gap analysis results
8. Browse vendor marketplace
9. Compare vendor solutions
10. Upgrade to Premium for full access

## Performance Tests

```bash
# Load test assessments
npm run test:load

# Stress test API
npm run test:stress

# E2E tests
npm run test:e2e
```

## Success Criteria

✅ User can register and verify email  
✅ Organization profile created with website parsing  
✅ Documents uploaded and processed  
✅ Assessment completes with AI analysis  
✅ Gaps and risks identified correctly  
✅ Report generated (view limited for free users)  
✅ Vendor marketplace accessible  
✅ Vendor matching works for gaps  
✅ Premium features blocked for free users  
✅ Stripe integration processes payments  
✅ Admin can manage users and vendors

## Troubleshooting

### Database connection issues

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Reset database
npx prisma migrate reset
```

### Redis connection issues

```bash
# Check Redis is running
redis-cli ping

# Clear Redis cache
redis-cli FLUSHALL
```

### Document upload fails

- Check AWS S3 credentials
- Verify bucket permissions
- Check file size limits (50MB)

### AI analysis not working

- Verify OpenAI API key
- Check API rate limits
- Review error logs

### Payment processing issues

- Verify Stripe keys
- Check webhook configuration
- Test with Stripe CLI

## Support

- Documentation: `/docs`
- API Reference: `/docs/api`
- Support Email: support@heliolus.com
- Issue Tracker: GitHub Issues
