# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SaaS platform for compliance assessment and vendor marketplace integration. Organizations evaluate their compliance posture through AI-powered assessments, identify gaps, and connect with compliance solution vendors.

**Key Capability**: Anonymous assessment flow → registration → vendor matching → premium reports

## Tech Stack

**Frontend**: Vite + React 18 + TypeScript 5.5 | TanStack Query 5 | Zustand | Radix UI | TailwindCSS | React Hook Form + Zod | Stripe Elements

**Backend**: Fastify 4 + TypeScript 5.2 | Prisma 6 (PostgreSQL) | @fastify/jwt | Redis (ioredis) | OpenAI 5 | Stripe 18 | AWS S3

**Infrastructure**: PostgreSQL 15 | Redis 7 | Docker Compose | LocalStack (dev S3) | Node >=18.0.0

## Development Commands

```bash
# Root workspace (runs both frontend + backend)
npm run dev                      # Start dev servers
npm run build                    # Build both
npm run lint                     # Lint all code
npm run setup                    # Install dependencies

# Backend (from backend/)
npm run dev                      # tsx watch mode
npm run test                     # Vitest tests
npm run test:contract            # Contract tests
npm run db:migrate               # Prisma migrations
npm run db:generate              # Generate Prisma client
npm run db:studio                # Launch Prisma Studio
npm run docker:up                # Start Docker services
npm run docker:stop              # Stop Docker services

# Frontend (from frontend/)
npm run dev                      # Vite dev server
npm run build                    # Production build
npm run start                    # Preview build (port 5000)
```

## Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── services/           # 20+ business logic services
│   │   ├── routes/             # 11 API route files
│   │   ├── middleware/         # Auth, RBAC, error handling
│   │   ├── lib/                # Shared utilities
│   │   ├── config/             # Configuration
│   │   ├── server.ts           # Fastify server setup
│   │   └── index.ts            # Entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (1125 lines)
│   │   └── seed.ts             # Seeding scripts
│   ├── tests/
│   │   ├── contract/           # API contract tests
│   │   └── integration/        # Integration tests
│   └── docker-compose.yml      # Dev environment (PostgreSQL, Redis, pgAdmin, LocalStack)
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── ui/            # Radix UI components
│   │   │   └── assessment/    # Assessment-specific
│   │   ├── pages/             # Page components
│   │   ├── lib/api.ts         # Centralized API client
│   │   ├── hooks/             # Custom React hooks
│   │   └── contexts/          # React contexts
│   └── vite.config.ts
│
└── .claude/commands/           # BMad agents and task commands
```

## Core Architecture

### Services Layer (backend/src/services/)

**Critical Services:**
- `assessment.service.ts` (98KB) - Core assessment orchestration
- `ai-analysis.service.ts` - OpenAI GPT-4 document analysis
- `document.service.ts` - S3 upload, storage, management
- `user.service.ts` - Auth, registration, password reset
- `subscription.service.ts` - Stripe integration, credits
- `vendor-matching` - AI-powered gap-to-vendor matching

**Supporting Services:**
- `answer.service.ts`, `gap-prioritization.service.ts`, `priorities.service.ts`
- `risk-analysis-ai.service.ts`, `strategy-matrix.service.ts`
- `evidence-classification.service.ts`, `document-preprocessing.service.ts`
- `report-generator.service.ts`, `template.service.ts`, `organization.service.ts`
- `email.service.ts`, `freemium.service.ts`

### API Routes (backend/src/routes/)

- `assessment.routes.ts` (123KB) - Assessment CRUD, execution, results
- `admin.routes.ts` (48KB) - Admin dashboard, user/vendor management
- `auth.routes.ts` (45KB) - Register, login, email verification, password reset
- `organization.routes.ts`, `document.routes.ts`, `vendor.routes.ts`
- `subscription.routes.ts`, `template.routes.ts`, `webhook.routes.ts`
- `anonymous.routes.ts`, `claim.routes.ts` - Pre-registration flow

### Database (Prisma)

**Key Models**: User, Organization, Document, AssessmentTemplate, Section, Question, Assessment, Answer, Gap, Risk, Vendor, Solution, VendorMatch, VendorContact, Subscription, Invoice, CreditTransaction, Report

**Enums (25+)**: UserRole, AssessmentStatus, Severity, Priority, SubscriptionPlan, SubscriptionStatus, etc.

Schema: `backend/prisma/schema.prisma` (1125 lines)

## API Architecture

### Authentication
- JWT via @fastify/jwt (Bearer token)
- Token stored in localStorage (frontend)
- Anonymous session support for pre-registration
- RBAC middleware (USER/ADMIN/VENDOR roles)
- Email verification required

### API Response Pattern
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

### Frontend API Client (`frontend/src/lib/api.ts`)
- Automatic auth token injection
- 401 auto-logout handling
- TanStack Query integration
- Typed interfaces for all endpoints
- FormData support for file uploads

## Development Workflows

### Adding New Feature

1. **Backend**:
   - Update Prisma schema if needed → `npm run db:migrate`
   - Implement service logic in `services/`
   - Add route handler with Zod validation in `routes/`
   - Add Swagger/OpenAPI annotations
   - Write contract test

2. **Frontend**:
   - Update `lib/api.ts` with new endpoints
   - Create React Query hooks/mutations
   - Build UI components
   - Connect with TanStack Query

### Database Changes

```bash
cd backend
# Edit prisma/schema.prisma
npm run db:migrate              # Creates and applies migration
npm run db:generate             # Regenerates Prisma client
# Update affected services
```

### Testing

```bash
cd backend
npm run test                    # All Vitest tests
npm run test:contract           # API contract tests
npm run docker:up               # Start test infrastructure
```

## Key Data Flows

### Assessment Execution
1. User selects template → creates draft assessment
2. User uploads documents → S3 storage → AI parsing
3. AI generates answers using document content
4. User reviews/edits answers → completes assessment
5. System calculates risk score, identifies gaps/risks
6. Vendor matching algorithm runs
7. Report generation (Premium tier)
8. Credits deducted

### Anonymous Flow → Claim
1. Anonymous session created (token-based)
2. User builds organization profile (OrganizationDraft)
3. Documents uploaded (DocumentDraft)
4. Assessment executed (AssessmentDraft)
5. User registers → claims session
6. Data migrated to production tables

## Environment Variables

### Backend Required
```bash
DATABASE_URL                 # PostgreSQL connection
REDIS_URL                    # Redis connection
JWT_SECRET                   # JWT signing
AWS_ACCESS_KEY_ID            # S3 credentials
AWS_SECRET_ACCESS_KEY
AWS_REGION
S3_BUCKET_NAME
OPENAI_API_KEY              # GPT-4 access
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
EMAIL_FROM
EMAIL_API_KEY
FRONTEND_URL                # CORS config
NODE_ENV
```

### Frontend Optional
```bash
VITE_API_URL                # Backend URL (defaults to proxy)
```

## Docker Development

Docker Compose services (backend/docker-compose.yml):
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)
- pgAdmin (port 5050)
- Redis Commander (port 8081)
- LocalStack S3 (ports 4566, 4571)

```bash
cd backend
npm run docker:up               # Start all services
npm run docker:stop             # Stop all services
npm run docker:logs             # View logs
```

## Important Patterns

### Service-Oriented Architecture
- 20+ specialized services with single responsibilities
- `base.service.ts` provides common functionality
- Services injected via Fastify decorators

### Type Safety
- TypeScript throughout (frontend + backend)
- Zod runtime validation on all routes
- Prisma generates types from schema
- Shared types in `backend/src/types/`

### Error Handling
- Centralized error middleware (`middleware/error.middleware.ts`)
- Structured error responses
- HTTP status codes mapped to business errors

### Caching Strategy
- Redis for session data
- TanStack Query for aggressive client-side caching
- Query key management for cache invalidation

### Security
- bcryptjs password hashing
- Rate limiting (@fastify/rate-limit)
- CORS whitelist
- Helmet security headers
- S3 document encryption (optional)
- Audit logging for sensitive operations

## Monorepo Configuration

- npm workspaces (frontend, backend)
- Shared dev dependencies at root
- Concurrent dev execution via `concurrently`
- Unified linting (ESLint + Prettier)
- Husky pre-commit hooks
- lint-staged for incremental checks

## Key Files to Know

- `backend/src/server.ts` - Fastify app configuration, middleware, route registration
- `backend/prisma/schema.prisma` - Complete data model
- `frontend/src/lib/api.ts` - All API endpoints centralized
- `frontend/src/App.tsx` - Route configuration
- `backend/src/middleware/auth.state.ts` - Auth state management
- `backend/src/middleware/rbac.middleware.ts` - Role-based access control

## BMad Commands

Custom slash commands available in `.claude/commands/BMad/`:
- **Agents**: orchestrator, architect, dev, qa, pm, po, analyst, sm, ux-expert
- **Tasks**: brownfield story/epic creation, test design, QA gates, documentation

Use `/` in Claude Code to access these specialized workflows.

---

**Architecture**: Service-oriented, API-first, type-safe throughout
**Authentication**: Stateless JWT + anonymous sessions
**Testing**: Vitest (backend), planned React Testing Library (frontend)
**Deployment**: GitHub Actions CI/CD (planned: AWS ECS)
