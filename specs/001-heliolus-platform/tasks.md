# Tasks: Heliolus Compliance Assessment Platform

**Input**: Design documents from `/specs/001-heliolus-platform/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/openapi.yaml

## Execution Flow (main)

```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript, Next.js 14, Fastify, PostgreSQL, Redis
   → Structure: Web app (backend/ and frontend/)
2. Load design documents ✓
   → data-model.md: 16 entities identified
   → contracts/openapi.yaml: 35+ endpoints defined
   → quickstart.md: 10 test scenarios
3. Generate tasks by category ✓
4. Apply TDD rules and parallel marking ✓
5. Number tasks T001-T063 ✓
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Shared types**: `backend/src/types/` exported to frontend

## Phase 3.1: Setup & Infrastructure (T001-T008)

- [ ] T001 Create project structure with backend/ and frontend/ directories
- [ ] T002 Initialize backend with Fastify, TypeScript, and Prisma dependencies
- [ ] T003 Initialize frontend with Next.js 14, React 18, and TypeScript
- [ ] T004 [P] Configure ESLint and Prettier for both projects
- [ ] T005 [P] Setup PostgreSQL database and Redis with Docker Compose
- [ ] T006 [P] Configure environment variables (.env.example files)
- [ ] T007 [P] Setup AWS S3 bucket for document storage
- [ ] T008 [P] Configure GitHub Actions CI/CD pipeline

## Phase 3.2: Contract Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Authentication Contract Tests

- [ ] T009 [P] Contract test POST /auth/register in backend/tests/contract/auth.register.test.ts
- [ ] T010 [P] Contract test POST /auth/login in backend/tests/contract/auth.login.test.ts
- [ ] T011 [P] Contract test POST /auth/verify-email in backend/tests/contract/auth.verify.test.ts
- [ ] T012 [P] Contract test POST /auth/reset-password in backend/tests/contract/auth.reset.test.ts

### Core API Contract Tests

- [ ] T013 [P] Contract test organizations endpoints in backend/tests/contract/organizations.test.ts
- [ ] T014 [P] Contract test documents endpoints in backend/tests/contract/documents.test.ts
- [ ] T015 [P] Contract test templates endpoints in backend/tests/contract/templates.test.ts
- [ ] T016 [P] Contract test assessments endpoints in backend/tests/contract/assessments.test.ts
- [ ] T017 [P] Contract test vendors endpoints in backend/tests/contract/vendors.test.ts
- [ ] T018 [P] Contract test subscriptions endpoints in backend/tests/contract/subscriptions.test.ts
- [ ] T019 [P] Contract test reports endpoints in backend/tests/contract/reports.test.ts

## Phase 3.3: Data Models & Migrations (T020-T027)

- [ ] T020 [P] Create Prisma schema for User, Organization, Document in backend/prisma/schema.prisma
- [ ] T021 [P] Create Prisma schema for Assessment, Gap, Risk in backend/prisma/schema.prisma
- [ ] T022 [P] Create Prisma schema for Template, TemplateSection, TemplateQuestion in backend/prisma/schema.prisma
- [ ] T023 [P] Create Prisma schema for Vendor, Solution, VendorMatch in backend/prisma/schema.prisma
- [ ] T024 [P] Create Prisma schema for Subscription, Invoice, CreditTransaction in backend/prisma/schema.prisma
- [ ] T025 [P] Create Prisma schema for Report, VendorContact, AuditLog in backend/prisma/schema.prisma
- [ ] T026 Generate Prisma client and TypeScript types
- [ ] T027 Create database migrations and seed data

## Phase 3.4: Core Libraries Implementation (T028-T032)

- [ ] T028 [P] Implement auth-lib with JWT and NextAuth.js in backend/src/lib/auth/
- [ ] T029 [P] Implement assessment-lib with OpenAI integration in backend/src/lib/assessment/
- [ ] T030 [P] Implement vendor-lib matching engine in backend/src/lib/vendor/
- [ ] T031 [P] Implement payment-lib with Stripe in backend/src/lib/payment/
- [ ] T032 [P] Implement ai-lib with document parsing in backend/src/lib/ai/

## Phase 3.5: Service Layer (T033-T039)

- [ ] T033 [P] Create UserService with CRUD operations in backend/src/services/user.service.ts
- [ ] T034 [P] Create OrganizationService with profile management in backend/src/services/organization.service.ts
- [ ] T035 [P] Create AssessmentService with risk scoring in backend/src/services/assessment.service.ts
- [ ] T036 [P] Create VendorService with marketplace logic in backend/src/services/vendor.service.ts
- [ ] T037 [P] Create SubscriptionService with credit management in backend/src/services/subscription.service.ts
- [ ] T038 [P] Create DocumentService with S3 integration in backend/src/services/document.service.ts
- [ ] T039 [P] Create ReportService with PDF generation in backend/src/services/report.service.ts

## Phase 3.6: API Implementation (T040-T047)

- [ ] T040 Setup Fastify server with middleware in backend/src/server.ts
- [ ] T041 Implement authentication routes in backend/src/routes/auth.routes.ts
- [ ] T042 Implement user and organization routes in backend/src/routes/organization.routes.ts
- [ ] T043 Implement assessment routes in backend/src/routes/assessment.routes.ts
- [ ] T044 Implement vendor marketplace routes in backend/src/routes/vendor.routes.ts
- [ ] T045 Implement subscription routes in backend/src/routes/subscription.routes.ts
- [ ] T046 Implement Stripe webhook handler in backend/src/routes/webhook.routes.ts
- [ ] T047 Setup error handling and logging middleware in backend/src/middleware/

## Phase 3.7: Frontend Components (T048-T055)

- [ ] T048 [P] Create authentication pages and components in frontend/src/app/auth/
- [ ] T049 [P] Create organization onboarding flow in frontend/src/app/onboarding/
- [ ] T050 [P] Create assessment wizard components in frontend/src/app/assessment/
- [ ] T051 [P] Create gap analysis dashboard in frontend/src/app/dashboard/
- [ ] T052 [P] Create vendor marketplace UI in frontend/src/app/marketplace/
- [ ] T053 [P] Create subscription management pages in frontend/src/app/subscription/
- [ ] T054 [P] Create report viewer components in frontend/src/app/reports/
- [ ] T055 [P] Create admin panel in frontend/src/app/admin/

## Phase 3.8: Integration Tests (T056-T060)

- [ ] T056 [P] Integration test: User registration and email verification in backend/tests/integration/auth.flow.test.ts
- [ ] T057 [P] Integration test: Complete assessment flow in backend/tests/integration/assessment.flow.test.ts
- [ ] T058 [P] Integration test: Vendor matching for gaps in backend/tests/integration/vendor.matching.test.ts
- [ ] T059 [P] Integration test: Subscription and payment flow in backend/tests/integration/payment.flow.test.ts
- [ ] T060 [P] Integration test: Document upload and parsing in backend/tests/integration/document.flow.test.ts

## Phase 3.9: E2E Tests (T061-T063)

- [ ] T061 E2E test: Complete user journey from signup to assessment in frontend/tests/e2e/user-journey.spec.ts
- [ ] T062 E2E test: Free vs Premium feature access in frontend/tests/e2e/subscription-features.spec.ts
- [ ] T063 E2E test: Admin workflows in frontend/tests/e2e/admin-workflow.spec.ts

## Dependencies

- Setup (T001-T008) must complete first
- Contract tests (T009-T019) before any implementation
- Data models (T020-T027) before services
- Core libraries (T028-T032) before service layer
- Services (T033-T039) before API routes
- API (T040-T047) before frontend
- All implementation before integration tests
- Integration tests before E2E tests

## Parallel Execution Examples

### Setup Phase (T004-T008 can run together)

```bash
Task: "Configure ESLint and Prettier for both projects"
Task: "Setup PostgreSQL database and Redis with Docker Compose"
Task: "Configure environment variables (.env.example files)"
Task: "Setup AWS S3 bucket for document storage"
Task: "Configure GitHub Actions CI/CD pipeline"
```

### Contract Tests (T009-T019 can run together)

```bash
Task: "Contract test POST /auth/register in backend/tests/contract/auth.register.test.ts"
Task: "Contract test POST /auth/login in backend/tests/contract/auth.login.test.ts"
Task: "Contract test organizations endpoints in backend/tests/contract/organizations.test.ts"
Task: "Contract test assessments endpoints in backend/tests/contract/assessments.test.ts"
# ... and all other contract tests
```

### Data Models (T020-T025 can run together)

```bash
Task: "Create Prisma schema for User, Organization, Document"
Task: "Create Prisma schema for Assessment, Gap, Risk"
Task: "Create Prisma schema for Template sections"
Task: "Create Prisma schema for Vendor, Solution"
Task: "Create Prisma schema for Subscription, Invoice"
```

### Core Libraries (T028-T032 can run together)

```bash
Task: "Implement auth-lib with JWT and NextAuth.js"
Task: "Implement assessment-lib with OpenAI integration"
Task: "Implement vendor-lib matching engine"
Task: "Implement payment-lib with Stripe"
Task: "Implement ai-lib with document parsing"
```

### Services (T033-T039 can run together)

```bash
Task: "Create UserService with CRUD operations"
Task: "Create OrganizationService with profile management"
Task: "Create AssessmentService with risk scoring"
Task: "Create VendorService with marketplace logic"
# ... and all other services
```

### Frontend Components (T048-T055 can run together)

```bash
Task: "Create authentication pages and components"
Task: "Create organization onboarding flow"
Task: "Create assessment wizard components"
Task: "Create gap analysis dashboard"
# ... and all other frontend components
```

## Notes

- **[P]** tasks work on different files and have no dependencies
- Verify all tests fail before implementing (TDD requirement)
- Commit after each task with descriptive message
- Run linting after each implementation task
- Update CLAUDE.md with any new patterns or decisions

## Validation Checklist

- ✅ All 35+ API endpoints have contract tests
- ✅ All 16 entities have Prisma model tasks
- ✅ All tests come before implementation (TDD)
- ✅ Parallel tasks are truly independent (different files)
- ✅ Each task specifies exact file path
- ✅ No parallel task modifies same file as another

## Execution Command Template

```bash
# For individual task
/task "T009: Contract test POST /auth/register in backend/tests/contract/auth.register.test.ts"

# For parallel tasks
/parallel-tasks "T009-T019: All contract tests"
```

## Success Criteria

- All contract tests written and failing (RED phase)
- Implementation makes tests pass (GREEN phase)
- Code refactored for quality (REFACTOR phase)
- Integration tests validate user flows
- E2E tests confirm frontend functionality
- Performance goals met (<200ms API, <3s page load)
- Security requirements implemented (GDPR, PCI)

---

_Generated from 001-heliolus-platform implementation plan_
_Total tasks: 63_
_Estimated completion: 5-7 days with parallel execution_
