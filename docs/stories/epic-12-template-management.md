# Epic 12: Admin Template Management - Brownfield Enhancement

## Epic Goal

Enable administrators to fully manage assessment templates, sections, and questions through the admin panel, replacing mock UI with complete backend integration and adding reusable component library functionality for efficient template creation.

## Epic Status

**Draft** - Awaiting Story Manager review and breakdown

## Epic Description

### Existing System Context

**Current Relevant Functionality:**
- Mock UI exists in `frontend/src/pages/admin/TemplateManagement.tsx` with visual components for template/section/question CRUD
- Complete backend service exists (`backend/src/services/template.service.ts`) with full CRUD operations
- Database schema (Prisma) fully supports all features:
  - Template model with `isActive`, `creditCost`, `category`, `aiPrompts`, `version`, weight fields
  - Section model with `weight`, `order`, `isRequired` fields
  - Question model with `weight`, `aiPromptHint`, `scoringRules`, `categoryTag`, `order` fields
- Public template routes exist (`backend/src/routes/template.routes.ts`) for read-only access
- Two existing templates: Financial Crime Compliance and Trade Compliance (seeded in database)

**Technology Stack:**
- Frontend: React 18 + TypeScript + TanStack Query + Radix UI + Zustand
- Backend: Fastify 4 + TypeScript + Prisma 6 + PostgreSQL 15
- API Pattern: RESTful with Zod validation, stateless JWT auth
- Caching: Redis for session data, TanStack Query for client-side

**Integration Points:**
- Admin routes (`backend/src/routes/admin.routes.ts`) - Need to add template management endpoints
- Template service (existing, fully functional)
- Frontend API client (`frontend/src/lib/api.ts`) - Need to add admin template endpoints
- Assessment creation flow - Uses templates for assessment structure
- Credit cost calculation - Templates define credit cost per assessment

### Enhancement Details

**What's Being Added/Changed:**

1. **Backend Admin API Routes** (NEW)
   - POST /admin/templates - Create template
   - PUT /admin/templates/:id - Update template (including isActive status, creditCost)
   - DELETE /admin/templates/:id - Soft delete template
   - POST /admin/templates/:id/sections - Add section
   - PUT /admin/sections/:id - Update section (including weight)
   - DELETE /admin/sections/:id - Delete section
   - POST /admin/sections/:id/questions - Add question
   - PUT /admin/questions/:id - Update question (including weight, aiPromptHint)
   - DELETE /admin/questions/:id - Delete question
   - POST /admin/questions/bulk - Bulk create questions
   - GET /admin/templates/stats - Template usage statistics

2. **Frontend Integration** (ENHANCED)
   - Replace mock data with real API calls in TemplateManagement.tsx
   - Add TanStack Query hooks for all CRUD operations
   - Add API client methods to `lib/api.ts`
   - Implement optimistic updates for better UX
   - Add error handling and loading states
   - Connect weight management UI (already exists in mock)
   - Connect AI prompt management UI (already exists in mock)

3. **Section/Question Library** (NEW)
   - Database flags: `Section.isLibrary`, `Question.isLibrary` (requires schema migration)
   - Ability to mark sections/questions as "library items"
   - Browse library sections/questions when building templates
   - Reuse library items across multiple templates (copy pattern)
   - Library management UI in admin panel

4. **Template Status Management** (ENHANCED)
   - UI for setting template status: `draft`, `active`, `archived`
   - Validation: Cannot delete active templates with assessments
   - Visual indicators for template status

5. **Credit Cost Configuration** (ENHANCED)
   - UI for setting per-template credit costs
   - Update existing templates' credit costs
   - Display credit cost in template selection flow

**How It Integrates:**
- Admin routes require ADMIN role (existing RBAC middleware)
- Template service methods already exist, need route wrappers
- Frontend uses existing auth context and API client patterns
- Assessment creation flow already reads templates - no changes needed there
- Credit deduction service already uses template.creditCost - seamless integration

**Success Criteria:**
1. Admins can create/edit/delete templates entirely through UI (no database access needed)
2. All existing templates (Financial Crime, Trade Compliance) remain functional
3. New templates can be created with sections, questions, weights, and AI prompts
4. Library sections/questions can be reused across templates
5. Template status changes (active/draft/archived) work correctly
6. Credit costs can be configured per template
7. No regression in assessment creation flow
8. All operations audit-logged for compliance

## Stories

### Story 12.1: Admin Template CRUD API Routes
**Description:** Implement backend API routes in admin.routes.ts for template creation, update, delete, and statistics. Connect to existing TemplateService methods with proper RBAC, validation, and audit logging.

**Key Work:**
- Add 4 routes: POST/PUT/DELETE /admin/templates, GET /admin/templates/stats
- Zod schemas for request validation
- ADMIN role enforcement
- Audit logging for all mutations
- Error handling for templates in use

**Dependencies:** None (uses existing TemplateService)

---

### Story 12.2: Admin Section & Question CRUD API Routes
**Description:** Implement backend API routes for section and question management including bulk operations. Support weight and AI prompt configuration.

**Key Work:**
- Add 6 routes for sections/questions CRUD
- POST /admin/questions/bulk for efficient question creation
- Weight field validation (0-100 range)
- AI prompt field support
- Question order management

**Dependencies:** Story 12.1 (template management must exist first)

---

### Story 12.3: Frontend Template Management Integration
**Description:** Replace mock data in TemplateManagement.tsx with real API calls. Add TanStack Query hooks, optimistic updates, and proper error handling.

**Key Work:**
- Update lib/api.ts with admin template endpoints
- Create React Query hooks (useTemplates, useCreateTemplate, etc.)
- Replace mock state with API data
- Add loading states and error boundaries
- Implement optimistic UI updates
- Connect status toggle (draft/active/archived)
- Connect credit cost input field

**Dependencies:** Story 12.1, 12.2 (backend APIs must exist)

---

### Story 12.4: Section & Question Weight Management UI
**Description:** Enable weight editing for sections and questions in the admin UI with validation and visual feedback.

**Key Work:**
- Add weight input fields to section/question dialogs
- Validation: weight between 0-100
- Display total weight per template
- Visual indicator if weights don't sum to 100
- Update API calls to include weight field

**Dependencies:** Story 12.3 (frontend integration complete)

---

### Story 12.5: AI Prompt Configuration UI
**Description:** Enable per-question AI prompt configuration with preview and templates.

**Key Work:**
- AI prompt textarea in question dialog (already exists, connect to backend)
- Character limit validation (1000 chars)
- Prompt templates/examples dropdown
- Preview mode showing how prompt will be used
- Bulk AI prompt update for similar questions

**Dependencies:** Story 12.3 (frontend integration complete)

---

### Story 12.6: Section & Question Library System
**Description:** Implement library functionality for reusable sections and questions across templates.

**Key Work:**
- Database migration: Add `isLibrary` boolean to Section and Question models
- Backend API: Mark/unmark library items, browse library
- Frontend: Library browser modal
- Copy-from-library functionality
- Library item search and filtering

**Dependencies:** Story 12.2 (section/question APIs exist)

---

### Story 12.7: Template Statistics & Usage Tracking
**Description:** Display template usage statistics in admin panel including assessment counts and completion rates per template.

**Key Work:**
- Template stats API (extends existing getTemplateStats)
- Usage count display per template
- "In use" warning before deletion
- Most popular templates widget
- Template performance metrics (avg completion time)

**Dependencies:** Story 12.1 (template API exists)

---

## Compatibility Requirements

- [x] **Existing APIs remain unchanged**
  - Public template routes (`/templates`, `/templates/:id`) unchanged
  - Assessment creation flow continues using existing template structure
  - Credit deduction logic seamlessly reads template.creditCost

- [x] **Database schema changes are backward compatible**
  - Library fields are nullable booleans (default: false)
  - Existing templates continue functioning
  - Weight fields already exist in schema

- [x] **UI changes follow existing patterns**
  - Uses Radix UI components (consistent with project)
  - Follows TanStack Query patterns from other admin pages
  - Matches admin panel design system

- [x] **Performance impact is minimal**
  - Admin-only operations (low traffic)
  - Caching via TanStack Query (5-minute stale time)
  - Efficient Prisma queries (no N+1 problems)

## Risk Mitigation

### Primary Risk: Breaking Assessment Creation Flow

Existing assessments depend on template structure. Changes to template schema or API responses could break assessment creation.

**Mitigation:**
- All template API changes are admin-only (separate routes)
- Public template routes remain unchanged
- Integration tests verify assessment creation still works
- Rollback plan: Revert admin routes, public APIs unaffected

### Secondary Risk: Data Integrity During Template Edits

Editing templates while assessments are in-progress could cause inconsistencies.

**Mitigation:**
- Template snapshots: Assessment stores template structure at creation time (already implemented via sections/questions relations)
- Warning UI: "X assessments in progress" before major changes
- Soft delete only for templates with existing assessments
- Audit log tracks all changes for troubleshooting

### Tertiary Risk: Performance Degradation with Large Templates

Templates with 100+ questions could cause UI slowness.

**Mitigation:**
- Pagination for question lists (50 per page)
- Lazy loading: Collapse sections by default
- Backend limits: Max 200 questions per template
- Performance test with large template before launch

### Rollback Plan

**If Critical Issue Occurs:**
1. Disable admin template routes via feature flag (add to admin.routes.ts)
2. Admins revert to direct database access temporarily
3. Public template routes continue working (assessment creation unaffected)
4. Fix issue in isolated branch
5. Re-enable after testing

**Rollback Steps:**
```bash
# 1. Disable admin template management routes
# Edit backend/src/routes/admin.routes.ts
# Comment out template management route registration

# 2. Restart backend
npm run --workspace=backend restart

# 3. Frontend automatically falls back (API errors handled)
# No frontend changes needed

# 4. Database remains consistent (no destructive migrations)
```

## Definition of Done

- [x] All 7 stories completed with acceptance criteria met
- [x] Admins can create templates with sections/questions via UI
- [x] Admins can edit template details (name, description, category, status, credit cost)
- [x] Admins can manage section and question weights
- [x] Admins can configure AI prompts per question
- [x] Library system allows reusing sections/questions across templates
- [x] Template statistics display correctly (usage counts, performance metrics)
- [x] Existing functionality verified through regression testing:
  - Assessment creation flow works with new and existing templates
  - Credit deduction uses correct template.creditCost
  - Public template API responses unchanged
- [x] Integration points working correctly:
  - Admin RBAC enforces permissions
  - Audit logs capture all template mutations
  - TanStack Query cache invalidation works properly
- [x] Documentation updated appropriately:
  - API docs (Swagger) include new admin routes
  - Admin user guide updated with template management instructions
- [x] No regression in existing features:
  - All existing tests pass
  - No performance degradation in assessment flow
  - Existing templates (Financial Crime, Trade Compliance) function correctly

## Epic Validation Checklist

### Scope Validation

- [⚠️] **Epic can be completed in 1-3 stories maximum** - FAILED (7 stories)
  - **Justification:** While exceeding guideline, this is an isolated enhancement with clear boundaries. Stories are well-scoped and sequenced logically.

- [x] **No architectural documentation is required** - PASSED
  - Uses existing architecture patterns (service-oriented, REST API, React Query)

- [x] **Enhancement follows existing patterns** - PASSED
  - Matches admin panel patterns (user management, analytics)
  - Uses established tech stack and conventions

- [x] **Integration complexity is manageable** - PASSED
  - Limited integration points (admin routes, frontend API client)
  - Existing services handle business logic

### Risk Assessment

- [x] **Risk to existing system is low** - PASSED
  - Admin-only operations (isolated)
  - Public APIs unchanged
  - Existing templates unaffected

- [x] **Rollback plan is feasible** - PASSED
  - Feature flag for admin routes
  - No destructive migrations
  - Database remains consistent

- [x] **Testing approach covers existing functionality** - PASSED
  - Integration tests for assessment creation
  - Regression tests for template API
  - Unit tests for new service methods

- [x] **Team has sufficient knowledge of integration points** - PASSED
  - All integration points documented
  - Service layer well-established
  - Frontend patterns proven in other admin features

### Completeness Check

- [x] **Epic goal is clear and achievable** - PASSED
  - Specific: Replace mock UI with backend integration + add library
  - Measurable: UI connected, library functional, templates manageable
  - Achievable: All components exist, need wiring

- [x] **Stories are properly scoped** - PASSED
  - Each story: 1-3 days work
  - Clear dependencies
  - Logical sequence (backend → frontend → enhancements)

- [x] **Success criteria are measurable** - PASSED
  - Binary checks (can/cannot perform actions)
  - Quantifiable (credit costs configurable, statistics display)

- [x] **Dependencies are identified** - PASSED
  - Story-level dependencies documented
  - External dependencies: None (all in-house)

## Story Manager Handoff

**Please develop detailed user stories for this brownfield epic. Key considerations:**

- **Existing System Context:**
  - Enhancement to admin panel running React 18 + TypeScript + Fastify + Prisma + PostgreSQL
  - Mock UI already built with all visual components
  - Backend service layer complete with CRUD methods
  - Database schema supports all requested features

- **Integration Points:**
  - Admin routes (`backend/src/routes/admin.routes.ts`) - Add template management endpoints
  - Frontend API client (`frontend/src/lib/api.ts`) - Add admin template methods
  - Template service (existing) - Wrap methods with route handlers
  - RBAC middleware (existing) - Enforce ADMIN role
  - Audit logging (existing) - Log all mutations
  - Assessment creation flow (existing, read-only) - No changes needed

- **Existing Patterns to Follow:**
  - **Backend Route Pattern:** Seen in admin.routes.ts (user management, analytics endpoints)
  - **Frontend API Pattern:** Seen in lib/api.ts (TanStack Query hooks, optimistic updates)
  - **Service Layer Pattern:** Extend BaseService, use Prisma transactions, validateInput with Zod
  - **UI Component Pattern:** Radix UI components, shadcn/ui styling, dialog-based forms
  - **State Management:** TanStack Query for server state, Zustand for client state

- **Critical Compatibility Requirements:**
  - Public template routes (`/templates`) MUST remain unchanged
  - Assessment creation flow MUST continue working without modifications
  - Existing templates (Financial Crime, Trade Compliance) MUST function identically
  - Database migrations MUST be backward compatible (nullable fields, defaults)

- **Story Sequence:**
  1. Stories 12.1-12.2: Backend APIs (can be parallel)
  2. Story 12.3: Frontend integration (depends on 12.1, 12.2)
  3. Stories 12.4-12.5: UI enhancements (depends on 12.3)
  4. Story 12.6: Library system (depends on 12.2)
  5. Story 12.7: Statistics (depends on 12.1)

- **Each Story Must Include:**
  - Verification that existing assessment creation flow remains intact
  - Regression tests for public template API
  - Audit logging for mutations (CREATE/UPDATE/DELETE operations)
  - RBAC enforcement (ADMIN role required)
  - Error handling with user-friendly messages

**The epic should maintain system integrity while delivering comprehensive admin template management capabilities.**

---

## Epic Metadata

| Field | Value |
|-------|-------|
| **Epic Number** | 12 |
| **Epic Name** | Admin Template Management |
| **Epic Type** | Brownfield Enhancement |
| **Priority** | Medium |
| **Estimated Stories** | 7 |
| **Estimated Effort** | 10-14 developer days |
| **Risk Level** | Low-Medium |
| **Created By** | Bob (Scrum Master) |
| **Created Date** | 2025-10-24 |
| **Status** | Draft |

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-24 | 1.0 | Epic created - Admin Template Management brownfield enhancement | Bob (Scrum Master) |

---

## Notes

**Why This Exceeds 3-Story Guideline:**

This enhancement spans multiple layers (backend API, frontend integration, library system) and includes several distinct features (CRUD operations, weight management, AI prompts, library, statistics). While larger than typical brownfield epics, it's still isolated to the admin panel with minimal risk to core system functionality.

**Alternative Approach (If Epic Split Required):**

Could split into 2 smaller epics:
- **Epic 12A:** "Template Management Backend Integration" (Stories 12.1-12.3) - 3 stories
- **Epic 12B:** "Advanced Template Features" (Stories 12.4-12.7) - 4 stories

However, proceeding as single epic is recommended for cohesive delivery and avoiding partial features in production.
