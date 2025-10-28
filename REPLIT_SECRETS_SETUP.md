# Replit Secrets Setup Guide 🔐

This guide helps you securely configure all required secrets for the Heliolus Platform using Replit's built-in Secrets management.

## Why Use Replit Secrets?

✅ **Secure** - Secrets are encrypted and never exposed in code  
✅ **Automatic** - Available as environment variables across all processes  
✅ **Git-Safe** - Never accidentally committed to version control  
✅ **Team-Friendly** - Easy to share with team members without exposing values  

## Required Secrets

### 1. Database & Infrastructure

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | ✅ Yes |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | No |

**Note:** `DATABASE_URL` is automatically set by Replit if you use Replit's PostgreSQL database.

### 2. Authentication & Security

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `JWT_SECRET` | Secret for signing JWT tokens | Random 32+ char string | ✅ Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret (if using) | Random 32+ char string | No |
| `SESSION_SECRET` | Session encryption secret | Random 32+ char string | ✅ Yes |

**How to generate secure secrets:**
```bash
# On your local machine
openssl rand -base64 32
# Or use: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Stripe Payment Integration

| Secret Name | Description | Where to Find | Required |
|-------------|-------------|---------------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret API key | [Stripe Dashboard > API Keys](https://dashboard.stripe.com/test/apikeys) | ✅ Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | [Stripe Dashboard > API Keys](https://dashboard.stripe.com/test/apikeys) | ✅ Yes |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks) | No |

**Test vs Live Keys:**
- **Test Mode:** Keys start with `sk_test_` and `pk_test_`
- **Live Mode:** Keys start with `sk_live_` and `pk_live_`
- Always use **test keys** in development!

### 4. OpenAI API

| Secret Name | Description | Where to Find | Required |
|-------------|-------------|---------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI analysis | [OpenAI API Keys](https://platform.openai.com/api-keys) | ✅ Yes |
| `OPENAI_MODEL` | Model to use | `gpt-4o-mini` (recommended) | No |
| `AI_PREPROCESSING_MODEL` | Model for document preprocessing | `gpt-4o-mini` (recommended) | No |

**Cost Optimization:**
Set both model variables to `gpt-4o-mini` to save ~97% on API costs compared to `gpt-4`.

### 5. Email Service (Postmark)

| Secret Name | Description | Where to Find | Required |
|-------------|-------------|---------------|----------|
| `POSTMARK_API_KEY` | Postmark server token | [Postmark Dashboard](https://account.postmarkapp.com/servers) | ✅ Yes |
| `FROM_EMAIL` | Sender email address | Your verified email | ✅ Yes |
| `FROM_NAME` | Sender name | `Heliolus Platform` | No |

### 6. AWS S3 (Object Storage)

| Secret Name | Description | Where to Find | Required |
|-------------|-------------|---------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS access key | [AWS IAM Console](https://console.aws.amazon.com/iam/) | No* |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | AWS IAM Console | No* |
| `AWS_REGION` | AWS region | `eu-west-1` | No* |
| `S3_BUCKET` | S3 bucket name | Your bucket name | No* |

**Note:** *Optional if using Replit's built-in object storage instead of AWS S3.

### 7. Cloudflare (Optional)

| Secret Name | Description | Where to Find | Required |
|-------------|-------------|---------------|----------|
| `CF_ACCOUNT_ID` | Cloudflare account ID | [Cloudflare Dashboard](https://dash.cloudflare.com/) | No |
| `CF_API_TOKEN` | Cloudflare API token | Cloudflare Dashboard > API Tokens | No |

## How to Add Secrets in Replit

### Method 1: Using Replit UI (Recommended)

1. **Open Secrets Manager**
   - Click the 🔒 **Secrets** icon in the left sidebar
   - Or go to Tools → Secrets

2. **Add Each Secret**
   - Click **"+ New Secret"**
   - Enter the **Key** (e.g., `STRIPE_SECRET_KEY`)
   - Enter the **Value** (e.g., `sk_test_abc123...`)
   - Click **Add secret**

3. **Verify Secrets**
   - Secrets appear as `•••••` (hidden)
   - Click the eye icon to reveal/hide values
   - Use **Edit** to update or **Delete** to remove

### Method 2: Using Replit CLI

```bash
# Install Replit CLI (if not already installed)
npm install -g replit-cli

# Login
replit login

# Add a secret
replit secrets set STRIPE_SECRET_KEY sk_test_abc123...

# List all secrets (values hidden)
replit secrets list

# Get a specific secret value
replit secrets get STRIPE_SECRET_KEY
```

## Quick Setup Checklist

Copy this checklist and mark off as you add each secret:

```
Core Infrastructure:
[ ] DATABASE_URL (auto-set by Replit PostgreSQL)
[ ] JWT_SECRET
[ ] SESSION_SECRET

Stripe Payments:
[ ] STRIPE_SECRET_KEY
[ ] STRIPE_PUBLISHABLE_KEY
[ ] STRIPE_WEBHOOK_SECRET (optional until webhooks configured)

OpenAI:
[ ] OPENAI_API_KEY
[ ] OPENAI_MODEL = gpt-4o-mini
[ ] AI_PREPROCESSING_MODEL = gpt-4o-mini

Email:
[ ] POSTMARK_API_KEY
[ ] FROM_EMAIL

Optional (if using AWS S3):
[ ] AWS_ACCESS_KEY_ID
[ ] AWS_SECRET_ACCESS_KEY
[ ] AWS_REGION
[ ] S3_BUCKET
```

## Verifying Secrets Are Working

### 1. Check Backend Startup

After adding secrets, restart your Replit:
```bash
# Backend should start without errors
npm run dev
```

Look for these success messages:
```
✅ subscription service: healthy  # Stripe connected
✅ email service: healthy         # Postmark connected
🚀 Services initialized successfully!
```

### 2. Test Individual Services

**Test Stripe Connection:**
```bash
curl http://localhost:8543/health
# Should show stripe: healthy
```

**Test OpenAI:**
Check logs for: `Document Preprocessing Service initialized with OpenAI`

**Test Email:**
Check logs for: `Email service initialized with Postmark`

## Troubleshooting

### Error: "STRIPE_SECRET_KEY is not defined"

**Solution:**
1. Go to Secrets panel
2. Add `STRIPE_SECRET_KEY` with your Stripe test key (starts with `sk_test_`)
3. Restart the Replit

### Error: "Invalid API key"

**Solutions:**
- **Stripe:** Make sure you're using the correct key (test vs live)
- **OpenAI:** Verify key is active at [OpenAI Dashboard](https://platform.openai.com/api-keys)
- **Postmark:** Check key at [Postmark Servers](https://account.postmarkapp.com/servers)

### Error: "Cannot connect to database"

**Solution:**
1. Verify PostgreSQL database is created in Replit
2. Check `DATABASE_URL` is automatically set
3. Try: `npm run db:push` to sync schema

### Secrets not loading

**Solution:**
1. **Stop** the Replit completely
2. **Add/update** the secret
3. **Restart** the Replit
4. Secrets are loaded at startup, not on-the-fly

## Security Best Practices

### ✅ DO:
- ✅ Use Replit Secrets for all sensitive values
- ✅ Use test keys in development (sk_test_, pk_test_)
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/staging/production
- ✅ Keep `.env` files in `.gitignore`

### ❌ DON'T:
- ❌ Commit secrets to Git (even in `.env` files)
- ❌ Share secrets via chat/email/Slack
- ❌ Use production keys in development
- ❌ Hardcode secrets in source code
- ❌ Reuse the same JWT_SECRET across environments

## Migrating from .env Files

If you have existing `.env` files:

1. **Copy values to Replit Secrets**
   ```bash
   # Open your .env file
   cat backend/.env
   
   # For each SECRET_NAME=value pair:
   # Add to Replit Secrets panel
   ```

2. **Verify all secrets are added**
   ```bash
   # Check Replit Secrets panel
   # All required secrets should be listed
   ```

3. **Test the application**
   ```bash
   npm run dev
   # Verify all services start correctly
   ```

4. **Remove .env files** (they're already in .gitignore)
   ```bash
   # Optional: Remove local .env files
   rm backend/.env frontend/.env
   ```

## Need Help?

- **Replit Secrets Documentation:** [https://docs.replit.com/programming-ide/workspace-features/secrets](https://docs.replit.com/programming-ide/workspace-features/secrets)
- **Stripe API Keys:** [https://stripe.com/docs/keys](https://stripe.com/docs/keys)
- **OpenAI API Keys:** [https://platform.openai.com/docs/api-reference/authentication](https://platform.openai.com/docs/api-reference/authentication)

---

✨ **You're all set!** Your secrets are now securely managed and your application is ready for development.
