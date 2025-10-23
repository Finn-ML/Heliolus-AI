# Environment Setup Guide

This guide covers how to set up the Heliolus Platform backend in different environments: Replit, local development, and production.

## Table of Contents

- [Replit Environment (Default)](#replit-environment-default)
- [Local Development with Docker](#local-development-with-docker)
- [Production Environment](#production-environment)
- [AWS S3 Configuration](#aws-s3-configuration)
- [Environment Variables Reference](#environment-variables-reference)
- [Troubleshooting](#troubleshooting)

## Replit Environment (Default)

The project is configured to work out-of-the-box on Replit with their managed PostgreSQL service.

### Setup Steps:

1. The project uses Replit's PostgreSQL database by default
2. Environment variables are already configured in `.env`
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the development server

### Replit-specific Configuration:

- Database: Uses Replit PostgreSQL (`helium` database)
- No Docker required
- Built-in environment variable management

## Local Development with Docker

For full local development with PostgreSQL, Redis, and S3 mocking.

### Prerequisites:

- Docker and Docker Compose installed
- Node.js 18+ installed

### Quick Start:

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Copy environment file and adjust if needed
cp .env.example .env.local

# Start all services
docker-compose up -d

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start the development server
npm run dev
```

### Available Services:

- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **pgAdmin**: `localhost:5050` (admin@heliolus.com / admin)
- **LocalStack (S3)**: `localhost:4566`
- **Redis Commander**: `localhost:8081`

### Docker Commands:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Reset all data
docker-compose down -v

# Start specific service
docker-compose up -d postgres

# Run tests with test database
docker-compose -f docker-compose.test.yml up -d
npm run test
docker-compose -f docker-compose.test.yml down
```

### Local Environment Configuration:

Update your `.env.local` file:

```env
# Database (Docker)
DATABASE_URL="postgresql://postgres:password@localhost:5432/heliumdb"

# Redis (Docker)
REDIS_URL="redis://localhost:6379"

# AWS S3 (LocalStack)
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="test"
AWS_REGION="us-east-1"
AWS_ENDPOINT_URL="http://localhost:4566"
S3_BUCKET="heliolus-documents"
```

## Production Environment

### Prerequisites:

- AWS Account with S3 and IAM configured
- Production PostgreSQL database (AWS RDS recommended)
- Production Redis instance (AWS ElastiCache recommended)

### AWS S3 Setup:

#### 1. Create S3 Bucket:

```bash
aws s3 mb s3://heliolus-documents --region us-east-1
```

#### 2. Configure Bucket Policy:

```bash
aws s3api put-bucket-policy --bucket heliolus-documents --policy file://aws/s3/bucket-policy.json
```

#### 3. Configure CORS:

```bash
aws s3api put-bucket-cors --bucket heliolus-documents --cors-configuration file://aws/s3/cors-configuration.json
```

#### 4. Configure Lifecycle Rules:

```bash
aws s3api put-bucket-lifecycle-configuration --bucket heliolus-documents --lifecycle-configuration file://aws/s3/lifecycle-configuration.json
```

#### 5. Create IAM User:

```bash
# Create user
aws iam create-user --user-name heliolus-app-user

# Attach policy
aws iam put-user-policy --user-name heliolus-app-user --policy-name HeliolusS3Access --policy-document file://aws/iam-policy.json

# Create access keys
aws iam create-access-key --user-name heliolus-app-user
```

### Production Docker Deployment:

```bash
# Use production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production Environment Variables:

```env
NODE_ENV=production
PORT=3001

# Production Database (use managed RDS)
DATABASE_URL="postgresql://username:password@your-rds-endpoint:5432/heliumdb"

# Production Redis (use managed ElastiCache)
REDIS_URL="redis://:password@your-elasticache-endpoint:6379"

# Production S3
AWS_ACCESS_KEY_ID="your-production-access-key"
AWS_SECRET_ACCESS_KEY="your-production-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET="heliolus-documents"

# Security
JWT_SECRET="your-secure-production-jwt-secret"

# External APIs
OPENAI_API_KEY="your-openai-api-key"
STRIPE_SECRET_KEY="sk_live_your-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

## AWS S3 Configuration

### Bucket Structure:

```
heliolus-documents/
├── documents/          # User documents
├── uploads/           # Temporary uploads
├── temp/              # Temporary files (7-day expiration)
├── logs/              # Application logs (90-day expiration)
└── backups/           # Database backups
```

### Security Features:

- **Versioning**: Enabled for document recovery
- **Encryption**: Server-side encryption with AWS-KMS
- **Access Control**: IAM-based access with least privilege
- **CORS**: Configured for web application access
- **Lifecycle**: Automatic cleanup of temporary files

### S3 Integration in Application:

The application includes utilities for S3 operations:

- File upload with progress tracking
- Automatic file type detection
- Secure URL generation with expiration
- Batch operations for multiple files

## Environment Variables Reference

### Core Configuration:

| Variable   | Description      | Default       | Required |
| ---------- | ---------------- | ------------- | -------- |
| `NODE_ENV` | Environment mode | `development` | Yes      |
| `PORT`     | Server port      | `3001`        | No       |

### Database:

| Variable            | Description                  | Example                                    | Required |
| ------------------- | ---------------------------- | ------------------------------------------ | -------- |
| `DATABASE_URL`      | PostgreSQL connection string | `postgresql://user:pass@host:5432/db`      | Yes      |
| `DATABASE_URL_TEST` | Test database connection     | `postgresql://user:pass@host:5433/test_db` | No       |

### Redis:

| Variable    | Description             | Example                  | Required |
| ----------- | ----------------------- | ------------------------ | -------- |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | No       |

### Authentication:

| Variable         | Description         | Example           | Required |
| ---------------- | ------------------- | ----------------- | -------- |
| `JWT_SECRET`     | JWT signing secret  | `your-secret-key` | Yes      |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d`              | No       |

### AWS S3:

| Variable                | Description                      | Example                 | Required |
| ----------------------- | -------------------------------- | ----------------------- | -------- |
| `AWS_ACCESS_KEY_ID`     | AWS access key                   | `AKIA...`               | Yes\*    |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key                   | `secret...`             | Yes\*    |
| `AWS_REGION`            | AWS region                       | `us-east-1`             | Yes\*    |
| `S3_BUCKET`             | S3 bucket name                   | `heliolus-documents`    | Yes\*    |
| `AWS_ENDPOINT_URL`      | Custom endpoint (for LocalStack) | `http://localhost:4566` | No       |

\*Required when S3 features are enabled

### External APIs:

| Variable                | Description           | Example       | Required |
| ----------------------- | --------------------- | ------------- | -------- |
| `OPENAI_API_KEY`        | OpenAI API key        | `sk-...`      | No       |
| `STRIPE_SECRET_KEY`     | Stripe secret key     | `sk_test_...` | No       |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...`   | No       |

## Troubleshooting

### Common Issues:

#### Docker Issues:

```bash
# Permission issues on Linux
sudo chmod +x docker/localstack/init-aws.sh

# Port conflicts
docker-compose down
sudo lsof -ti:5432 | xargs sudo kill -9

# Volume issues
docker-compose down -v
docker system prune -a
```

#### Database Connection:

```bash
# Test connection
npx prisma db pull

# Reset database
npx prisma migrate reset

# Generate client
npx prisma generate
```

#### S3 Connection:

```bash
# Test LocalStack S3
aws --endpoint-url=http://localhost:4566 s3 ls

# Test production S3
aws s3 ls s3://heliolus-documents
```

#### Environment Variables:

```bash
# Verify environment variables
printenv | grep -E "(DATABASE|AWS|REDIS)"

# Test with different env file
NODE_ENV=development npm run dev
```

### Performance Optimization:

- Use connection pooling for database
- Implement Redis caching for frequent queries
- Use S3 Transfer Acceleration for global users
- Configure CDN (CloudFront) for static assets

### Monitoring and Logging:

- Set up CloudWatch for AWS resources
- Implement application-level logging
- Monitor database performance
- Set up alerts for critical metrics

For additional help, check the logs or contact the development team.
