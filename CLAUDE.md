# Claude Code Context - Heliolus Platform

## Project Overview

SaaS platform for compliance assessment and vendor marketplace integration. Enables organizations to evaluate their compliance posture through AI-powered assessments, identify gaps, and connect with relevant compliance solution vendors.

## Tech Stack

### Frontend
- **Framework**: Vite + React 18 + TypeScript 5.5
- **Routing**: React Router DOM 6
- **State Management**: Zustand 5, TanStack Query 5 (React Query)
- **UI Components**: Radix UI (comprehensive component library)
- **Styling**: TailwindCSS 3.4 + Tailwind Animate, CVA (class-variance-authority)
- **Forms**: React Hook Form 7 + Zod validation
- **Payments**: Stripe React Elements
- **Charts**: Recharts 2
- **Animations**: Framer Motion 12
- **Icons**: Lucide React

### Backend
- **Framework**: Fastify 4 (modern Node.js framework)
- **Language**: TypeScript 5.2
- **Database ORM**: Prisma 6 (PostgreSQL)
- **Authentication**: @fastify/jwt, bcryptjs
- **Caching**: ioredis 5 (Redis client)
- **API Documentation**: @fastify/swagger + swagger-ui
- **Security**: @fastify/helmet, @fastify/cors, @fastify/rate-limit
- **File Upload**: @fastify/multipart
- **AI Integration**: OpenAI 5
- **Payments**: Stripe 18
- **Cloud Storage**: AWS SDK S3
- **Testing**: Vitest 3

### Infrastructure
- **Database**: PostgreSQL 15 (Alpine)
- **Cache**: Redis 7 (Alpine)
- **Object Storage**: AWS S3 / LocalStack (dev)
- **Containerization**: Docker Compose
- **Database Tools**: pgAdmin, Redis Commander
- **CI/CD**: GitHub Actions
- **Node Version**: >=18.0.0

## Project Structure

```
heliolus-platform/                 # Monorepo workspace root
├── backend/
│   ├── src/
│   │   ├── config/               # Configuration files
│   │   ├── generated/            # Prisma generated client
│   │   ├── lib/                  # Shared utilities
│   │   ├── middleware/           # Fastify middleware
│   │   │   ├── anonymous-session.middleware.ts
│   │   │   ├── auth.state.ts     # Auth state management
│   │   │   ├── error.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   └── *.mock.ts         # Mock middleware for dev
│   │   ├── routes/               # API route handlers
│   │   │   ├── admin.routes.ts
│   │   │   ├── anonymous.routes.ts
│   │   │   ├── assessment.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── claim.routes.ts
│   │   │   ├── document.routes.ts
│   │   │   ├── organization.routes.ts
│   │   │   ├── subscription.routes.ts
│   │   │   ├── template.routes.ts
│   │   │   ├── vendor.routes.ts
│   │   │   └── webhook.routes.ts
│   │   ├── services/             # Business logic services
│   │   │   ├── ai-analysis.service.ts
│   │   │   ├── answer.service.ts
│   │   │   ├── assessment.service.ts
│   │   │   ├── base.service.ts
│   │   │   ├── document-parser.service.ts
│   │   │   ├── document.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── freemium.service.ts
│   │   │   ├── organization.service.ts
│   │   │   ├── report-generator.service.ts
│   │   │   ├── report.service.ts
│   │   │   ├── subscription.service.ts
│   │   │   ├── template.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── vendor.service.ts
│   │   ├── templates/            # Email/report templates
│   │   ├── types/                # TypeScript type definitions
│   │   ├── index.ts              # Application entry point
│   │   ├── server.ts             # Fastify server setup
│   │   ├── objectStorage.ts      # S3 object storage wrapper
│   │   └── objectAcl.ts          # S3 access control
│   ├── prisma/
│   │   ├── schema.prisma         # Complete database schema
│   │   └── seed.ts               # Database seeding
│   ├── tests/
│   │   ├── contract/             # Contract/API tests
│   │   └── integration/          # Integration tests
│   ├── docker/                   # Docker init scripts
│   ├── aws/                      # AWS IAM policies
│   └── scripts/                  # Dev/deployment scripts
│
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── ui/              # Radix UI components (35+ components)
│   │   │   ├── assessment/      # Assessment-specific components
│   │   │   ├── consultant/      # Consultant features
│   │   │   ├── BusinessProfile.tsx
│   │   │   ├── ComparisonView.tsx
│   │   │   ├── DocumentStorage.tsx
│   │   │   ├── VendorMarketplace.tsx
│   │   │   ├── VendorComparison.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   └── [30+ other components]
│   │   ├── pages/                # Page components (routing)
│   │   │   ├── admin/           # Admin dashboard pages
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── AssessmentJourney.tsx
│   │   │   ├── AssessmentTemplates.tsx
│   │   │   ├── AssessmentResults.tsx
│   │   │   ├── Marketplace.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── [10+ other pages]
│   │   ├── lib/
│   │   │   └── api.ts            # Centralized API client
│   │   ├── contexts/             # React contexts
│   │   ├── hooks/                # Custom React hooks
│   │   ├── types/                # TypeScript types
│   │   ├── utils/                # Utility functions
│   │   ├── data/                 # Static data/constants
│   │   ├── config/               # App configuration
│   │   ├── App.tsx               # Root component
│   │   └── main.tsx              # Application entry
│   ├── public/                   # Static assets
│   └── dist/                     # Production build output
│
├── scripts/                      # Project-wide scripts
├── specs/                        # API specifications
├── templates/                    # Project templates
├── tools/                        # Development tools
├── memory/                       # AI context memory files
└── docker-compose.yml            # Development environment
```

## Core Services Architecture

### Backend Services (16 services)
1. **ai-analysis.service.ts**: OpenAI GPT-4 integration for document analysis and assessment scoring
2. **answer.service.ts**: Assessment question/answer management and scoring
3. **assessment.service.ts**: Core assessment orchestration (60KB - largest service)
4. **base.service.ts**: Base service class with common functionality
5. **document-parser.service.ts**: Multi-format document parsing (PDF, DOCX, XLSX, CSV)
6. **document.service.ts**: Document upload, storage, and management
7. **email.service.ts**: Email notifications and templates
8. **freemium.service.ts**: Freemium tier restrictions and credit management
9. **organization.service.ts**: Organization/company profile management
10. **report-generator.service.ts**: Assessment report generation
11. **report.service.ts**: Report storage and access control
12. **subscription.service.ts**: Stripe subscription and billing management
13. **template.service.ts**: Assessment template management
14. **user.service.ts**: User authentication, registration, password reset
15. **vendor.service.ts**: Vendor marketplace and matching logic
16. **index.ts**: Service initialization and cleanup orchestration

### API Routes (11 route files)
- **admin.routes.ts**: Admin dashboard, user management, vendor approval (48KB)
- **anonymous.routes.ts**: Anonymous session handling for logged-out users
- **assessment.routes.ts**: Assessment CRUD, execution, results (72KB - largest)
- **auth.routes.ts**: Registration, login, password reset, email verification (41KB)
- **claim.routes.ts**: Session claiming after registration
- **document.routes.ts**: Document upload, analysis, download (23KB)
- **organization.routes.ts**: Organization CRUD, website parsing (29KB)
- **subscription.routes.ts**: Stripe integration, billing, credits (22KB)
- **template.routes.ts**: Assessment templates
- **vendor.routes.ts**: Vendor marketplace, matching, contact (29KB)
- **webhook.routes.ts**: Stripe webhook handling

## Database Schema (Prisma)

### Core Models (1034 lines total)
- **User**: Authentication, profile, roles (ADMIN/USER/VENDOR)
- **Organization**: Company profile, compliance team, risk profile
- **Document**: S3-backed file storage with encryption support
- **AssessmentTemplate**: Configurable compliance assessment frameworks
- **Section**: Template sections with weighted scoring
- **Question**: Assessment questions with AI prompts and scoring rules
- **Assessment**: User assessments with AI analysis and risk scores
- **Answer**: Question responses with AI-generated scores/explanations
- **Gap**: Identified compliance gaps with severity/priority
- **Risk**: Risk analysis with likelihood/impact/mitigation
- **Vendor**: Compliance solution vendors with 15+ profile fields
- **Solution**: Vendor solutions with pricing and compatibility
- **VendorMatch**: AI-powered gap-to-vendor matching
- **VendorContact**: Lead tracking and RFP management
- **Subscription**: Stripe integration with credit system
- **Invoice**: Billing records and PDF storage
- **CreditTransaction**: Credit usage/purchase ledger
- **Report**: Generated assessment reports with access control
- **AuditLog**: Compliance audit trail
- **AnonymousSession**: Temporary session for logged-out users
- **OrganizationDraft**: Pre-registration company data
- **AssessmentDraft**: Pre-registration assessment data
- **DocumentDraft**: Pre-registration document uploads

### Enums (25 enums)
UserRole, UserStatus, CompanySize, AnnualRevenue, ComplianceTeamSize, Geography, RiskProfile, DocumentType, AssessmentStatus, Severity, Priority, CostRange, EffortRange, RiskCategory, Likelihood, Impact, RiskLevel, TemplateCategory, QuestionType, VendorCategory, VendorStatus, PricingModel, SubscriptionPlan, SubscriptionStatus, ReportType, ReportFormat, ContactType, ContactStatus, TransactionType, InvoiceStatus, AnswerStatus, AnonymousSessionStatus

## Development Commands

```bash
# Root workspace commands
npm run dev                      # Run both frontend and backend concurrently
npm run build                    # Build both frontend and backend
npm run start                    # Start both in production mode
npm run lint                     # Lint all code
npm run format                   # Format with Prettier
npm run setup                    # Install all dependencies

# Backend (from backend/)
npm run dev                      # Start dev server with tsx watch
npm run build                    # Compile TypeScript
npm run start                    # Start production server
npm run test                     # Run Vitest tests
npm run test:contract            # Run contract tests
npm run db:migrate               # Run Prisma migrations
npm run db:generate              # Generate Prisma client
npm run db:studio                # Launch Prisma Studio
npm run docker:dev               # Start Docker services
npm run docker:up                # Start Docker containers
npm run docker:stop              # Stop Docker containers

# Frontend (from frontend/)
npm run dev                      # Start Vite dev server
npm run build                    # Build for production
npm run preview                  # Preview production build
npm run start                    # Serve production build (port 5000)
npm run lint                     # Lint frontend code
```

## API Architecture

### Authentication Pattern
- JWT tokens via @fastify/jwt
- Token stored in localStorage on frontend
- Bearer token authentication on protected routes
- Anonymous session support for pre-registration flow
- Role-based access control (RBAC) middleware
- Email verification with token expiry
- Password reset with secure tokens

### Request/Response Pattern
```typescript
// Standard API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

### API Client (frontend/src/lib/api.ts)
- Centralized API client with automatic auth token injection
- Comprehensive error handling (401 auto-logout, 404 handling)
- TanStack Query integration for caching and invalidation
- FormData support for multipart uploads
- Typed request/response interfaces
- Query key management for cache control

### Available API Modules
1. **templateApi**: Template listing and retrieval
2. **assessmentApi**: Full assessment lifecycle (create, update, complete, results, reports)
3. **freemiumApi**: Credit/restriction checking
4. **organizationApi**: Company profile management with website parsing
5. **documentApi**: S3 upload, analysis, retrieval

### API Features
- OpenAPI/Swagger documentation
- Zod schema validation
- Rate limiting (@fastify/rate-limit)
- CORS with origin validation
- Helmet security headers
- Request logging and error tracking
- Multipart file upload support
- Webhook handling (Stripe)

## Testing Infrastructure

### Backend Testing
- **Framework**: Vitest 3
- **Test Types**:
  - Contract tests (API specification compliance)
  - Integration tests (real database)
- **Test Setup**: tests/setup.ts with database initialization
- **Location**: backend/tests/contract/, backend/tests/integration/

### Frontend Testing
- **Framework**: None currently configured
- **Planned**: React Testing Library + Vitest

### Docker Test Environment
- docker-compose.test.yml for isolated test database
- Health checks for service readiness
- LocalStack for S3 testing

## Security Implementation

### Authentication & Authorization
- bcryptjs password hashing
- JWT with configurable expiration
- Email verification required
- Rate limiting on auth endpoints
- RBAC with USER/ADMIN/VENDOR roles
- 2FA support (user preference)

### Data Protection
- Document encryption (optional, per-document)
- S3 encryption at rest
- HTTPS enforcement (helmet + trustProxy)
- CORS whitelist configuration
- SQL injection prevention (Prisma parameterized queries)
- XSS protection (helmet CSP)

### Compliance Features
- Audit log for all sensitive operations
- GDPR data export capability
- User consent tracking (marketing emails)
- PCI compliance via Stripe (no card storage)
- Geographic restrictions support

## Infrastructure & Deployment

### Docker Compose Services
1. **PostgreSQL 15**: Main database (port 5432)
2. **Redis 7**: Session cache and rate limiting (port 6379)
3. **pgAdmin**: Database management UI (port 5050)
4. **Redis Commander**: Redis management UI (port 8081)
5. **LocalStack**: AWS S3 mock for development (ports 4566, 4571)

### Production Infrastructure (Planned)
- AWS ECS for container orchestration
- AWS S3 for production object storage
- CloudFlare for CDN and WAF
- PostgreSQL RDS or managed instance
- Redis ElastiCache

### CI/CD (GitHub Actions)
- **.github/workflows/ci.yml**: Continuous integration pipeline
- **.github/workflows/deploy.yml**: Deployment automation
- **.github/workflows/dependency-update.yml**: Automated dependency updates

### Monorepo Configuration
- npm workspaces for dependency management
- Shared dev dependencies at root
- Concurrent dev server execution
- Unified linting and formatting (ESLint + Prettier)
- Husky pre-commit hooks
- lint-staged for incremental checks

## Key Features Implemented

### Assessment System
- Multi-step assessment wizard with progress tracking
- AI-powered document analysis (GPT-4)
- Automatic answer generation from uploaded documents
- Risk scoring algorithm (0-100)
- Gap identification with severity/priority classification
- Risk analysis with likelihood/impact matrices
- Vendor recommendation matching
- PDF report generation
- Assessment draft autosave

### Anonymous/Pre-Registration Flow
- Anonymous session management (token-based)
- Organization profile draft collection
- Document upload before registration
- Assessment execution without account
- Session claiming after registration
- Data migration from draft to production tables

### Vendor Marketplace
- Vendor directory with 15+ profile fields
- Solution catalog with pricing models
- AI-powered vendor-to-gap matching (0-100 score)
- Vendor comparison view
- Contact/RFP tracking
- Vendor onboarding workflow
- Admin approval system

### Subscription & Billing
- Freemium tier with credit limits
- Premium plan (€599/month)
- Credit purchase system
- Stripe payment integration
- Invoice generation and storage
- Usage tracking per assessment
- Subscription lifecycle management

### Admin Dashboard
- User management and role assignment
- Vendor approval workflow
- Analytics and reporting
- System configuration
- Template management

## Data Flow Patterns

### Assessment Execution Flow
1. User selects template
2. System creates draft assessment
3. User uploads documents (optional)
4. Documents parsed and analyzed by AI
5. AI generates answers to template questions
6. User reviews/edits AI-generated answers
7. Assessment completed
8. System calculates risk score
9. Gaps and risks identified
10. Vendor matches generated
11. Report generated (Premium)
12. Credits deducted

### Document Processing Pipeline
1. Frontend requests presigned S3 upload URL
2. Frontend uploads directly to S3
3. Frontend confirms upload to backend
4. Backend triggers document analysis
5. Document parser extracts text/data
6. AI analyzes content and extracts structured data
7. Results stored in parsedContent/extractedData fields
8. Document available for assessment answer generation

### Vendor Matching Algorithm
1. Assessment completion triggers gap analysis
2. Each gap tagged with category/severity
3. System queries vendors by category match
4. Scoring algorithm evaluates:
   - Category alignment
   - Company size compatibility
   - Geographic coverage
   - Solution features vs gap requirements
5. Match score calculated (0-100)
6. Top matches stored in VendorMatch table
7. Matches surfaced in assessment results

## Performance Considerations

### Frontend Optimization
- Vite for fast dev builds and HMR
- TanStack Query for aggressive caching
- Code splitting via React Router lazy loading
- Zustand for lightweight state management
- Radix UI for accessible, performant components
- Tailwind JIT for minimal CSS bundle

### Backend Optimization
- Fastify (3x faster than Express)
- Redis caching for session data
- Prisma query optimization with indexes
- Multipart streaming for large file uploads
- Rate limiting to prevent abuse
- Lazy loading of large JSON fields

### Database Optimization
- 50+ indexes on frequently queried fields
- Composite indexes for complex queries
- JSON columns for flexible schema
- Cascade deletes for data consistency
- Connection pooling (Prisma default)

## Environment Configuration

### Required Environment Variables (Backend)
```bash
DATABASE_URL                 # PostgreSQL connection string
REDIS_URL                    # Redis connection string
JWT_SECRET                   # JWT signing secret
AWS_ACCESS_KEY_ID            # S3 credentials
AWS_SECRET_ACCESS_KEY        # S3 credentials
AWS_REGION                   # S3 region
S3_BUCKET_NAME              # S3 bucket for documents
OPENAI_API_KEY              # OpenAI API key
STRIPE_SECRET_KEY           # Stripe secret key
STRIPE_WEBHOOK_SECRET       # Stripe webhook signing secret
EMAIL_FROM                  # Email sender address
EMAIL_API_KEY               # Email service API key
FRONTEND_URL                # CORS configuration
NODE_ENV                    # production/development
```

### Required Environment Variables (Frontend)
```bash
VITE_API_URL                # Backend API URL (optional, uses proxy)
```

## Development Workflow

### Feature Development Process
1. Create feature branch from main
2. Update appropriate service(s)
3. Add/update Prisma schema if needed
4. Run migrations (`npm run db:migrate`)
5. Update API routes
6. Add contract tests
7. Update frontend API client
8. Build UI components
9. Manual testing in dev environment
10. Create pull request
11. Code review
12. Merge to main
13. Deploy via GitHub Actions

### Database Migration Process
1. Edit `backend/prisma/schema.prisma`
2. Run `npm run db:migrate` (creates migration)
3. Migration applied automatically
4. Prisma client regenerated
5. Update services using new schema
6. Test with seed data

### Adding New API Endpoint
1. Add route handler in appropriate `*.routes.ts`
2. Implement business logic in service
3. Add Zod validation schema
4. Update Swagger/OpenAPI annotations
5. Add contract test
6. Update frontend API client
7. Add React Query hook/mutation

## Current Development Status

### Completed Features
- Full authentication system (register, login, email verification, password reset)
- Anonymous session flow with claim support
- Organization profile management with website parsing
- Document upload, storage, and AI analysis
- Assessment template system with sections/questions
- Assessment execution engine with AI answer generation
- Gap and risk identification
- Vendor marketplace with advanced filtering
- Vendor matching algorithm
- Comparison and contact features
- Subscription/billing integration (Stripe)
- Credit system with freemium tier
- Admin dashboard with vendor approval
- PDF report generation
- Audit logging

### Known Technical Debt
- Frontend tests not yet implemented
- NextAuth.js listed in original spec but not used (using custom JWT)
- Playwright E2E tests not configured
- Some middleware disabled (.middleware.ts.disabled files)
- Mock middleware still in use for development

### Recent Bug Fixes (2025-10-13)
- **CRITICAL**: Fixed Reports page not displaying completed assessments
  - Root cause: Fastify response schema validation was stripping template/gaps/risks fields
  - Fixed by updating AssessmentResponseSchema to include all required fields
  - Also removed Prisma `take` limitation that was causing global limit instead of per-parent
  - See `/REPORTS_PAGE_FIX.md` for complete technical details

### Recent Features Added (2025-10-13)
- **Assessment Deletion**: Added DELETE endpoint and UI for removing assessments
  - Backend: `DELETE /v1/assessments/:id` with RBAC enforcement
  - Frontend: Delete button with confirmation dialog on Reports page
  - Automatic cache invalidation and list refresh

### Active Development Areas
- Vendor comparison refinements
- Assessment journey improvements
- Report customization options
- Analytics dashboard expansion

## Architecture Principles

### Applied Principles
1. **Service-Oriented Architecture**: 16 specialized services with single responsibilities
2. **Separation of Concerns**: Clear boundaries between routes, services, and data layers
3. **API-First Design**: OpenAPI spec, Swagger docs, typed contracts
4. **Type Safety**: TypeScript throughout, Zod runtime validation, Prisma type generation
5. **Stateless Authentication**: JWT tokens, no server-side sessions
6. **Fail-Fast Validation**: Request validation at route entry
7. **Optimistic UI Updates**: TanStack Query optimistic updates
8. **Error Boundary Pattern**: Centralized error middleware, structured error responses
9. **Repository Pattern**: Prisma as abstraction over SQL
10. **Configuration as Code**: Environment-based config, no hardcoded values

### Deviations from Original Spec
- **Frontend Framework**: Using Vite+React instead of Next.js 14
  - Reason: Faster dev experience, simpler deployment, no SSR requirements
- **Authentication**: Custom JWT implementation instead of NextAuth.js
  - Reason: More control over auth flow, anonymous sessions support
- **Testing**: Vitest instead of Jest
  - Reason: Better Vite integration, faster execution
- **State Management**: Zustand + TanStack Query instead of pure Zustand
  - Reason: Server state caching, automatic refetching, optimistic updates

---

_Last Updated: 2025-10-13 - Reports Page Fix & Delete Feature_
_Previous Update: 2025-09-30 - Full Technical Audit_
_Feature Branch: 001-heliolus-platform_
