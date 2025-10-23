# Implementation Plan: Heliolus Compliance Assessment Platform

**Branch**: `001-heliolus-platform` | **Date**: 2025-09-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-heliolus-platform/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

A comprehensive SaaS platform for compliance assessment and vendor marketplace integration. The platform enables organizations to assess compliance posture, identify gaps through AI-powered analysis, and connect with solution vendors through an integrated marketplace. Built as a responsive web application with tiered subscription model.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 LTS  
**Primary Dependencies**: React 18, Next.js 14, Express/Fastify, Stripe API, OpenAI API  
**Storage**: PostgreSQL 15+ with Prisma ORM, Redis for caching, S3 for document storage  
**Testing**: Jest + React Testing Library (frontend), Vitest (backend), Playwright (E2E)  
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge), responsive design
**Project Type**: web - frontend + backend architecture  
**Performance Goals**: <200ms API response time, <3s initial page load, 100 concurrent assessments  
**Constraints**: GDPR compliance, secure document handling, PCI compliance for payments  
**Scale/Scope**: Initial: 1000 users, 50+ vendors, 10k assessments/month

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 2 (backend, frontend)
- Using framework directly? Yes (Next.js, Express/Fastify without wrappers)
- Single data model? Yes (Prisma models shared via types)
- Avoiding patterns? Yes (direct service calls, no unnecessary abstractions)

**Architecture**:

- EVERY feature as library? Yes, organized as modules
- Libraries listed:
  - auth-lib: Authentication and authorization
  - assessment-lib: Risk assessment engine
  - vendor-lib: Marketplace management
  - payment-lib: Stripe integration
  - ai-lib: OpenAI integration
- CLI per library: Planned for each library
- Library docs: llms.txt format planned

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? Yes
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (PostgreSQL, Redis in tests)
- Integration tests for: new libraries, contract changes, shared schemas? Yes
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:

- Structured logging included? Yes (winston/pino)
- Frontend logs → backend? Yes (error tracking service)
- Error context sufficient? Yes (user, action, timestamp, stack)

**Versioning**:

- Version number assigned? 1.0.0 initial
- BUILD increments on every change? Yes (CI/CD)
- Breaking changes handled? Yes (API versioning)

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application) - frontend + backend architecture required

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each major API endpoint group → contract test tasks
- Each entity → Prisma model and migration task
- Each user story → integration test scenario
- Implementation tasks organized by library

**Task Categories**:

1. **Infrastructure Setup** (5 tasks)
   - Database setup and migrations
   - Redis configuration
   - AWS S3 bucket setup
   - Environment configuration
   - Docker containerization

2. **Contract Tests** (10 tasks)
   - Authentication endpoints
   - Organization management
   - Assessment flow
   - Vendor marketplace
   - Subscription management

3. **Core Libraries** (8 tasks)
   - auth-lib implementation
   - assessment-lib with AI
   - vendor-lib matching engine
   - payment-lib with Stripe
   - ai-lib with OpenAI

4. **API Implementation** (12 tasks)
   - Fastify server setup
   - Route handlers by domain
   - Middleware (auth, validation)
   - Error handling
   - Rate limiting

5. **Frontend Components** (10 tasks)
   - Authentication flow
   - Organization onboarding
   - Assessment wizard
   - Gap analysis dashboard
   - Vendor marketplace UI

6. **Integration Tests** (8 tasks)
   - User registration flow
   - Assessment completion
   - Report generation
   - Vendor matching
   - Payment processing

7. **E2E Tests** (5 tasks)
   - Complete user journey
   - Free vs Premium features
   - Admin workflows

**Ordering Strategy**:

- TDD order: Contract tests → Implementation → Integration
- Dependency order: Models → Services → API → UI
- Parallel execution marked with [P] for independent modules

**Estimated Output**: 58 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented (none required)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
