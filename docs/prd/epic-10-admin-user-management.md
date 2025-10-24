# Epic 10: Admin User Management

**Epic ID:** 10
**Status:** Draft
**Priority:** P1 - High
**Estimated Effort:** 6-8 hours
**Dependencies:** None (Existing admin console infrastructure)

---

## Epic Description

Enhance and fix the existing Admin User Management feature to enable administrators to effectively manage user accounts. The current implementation has a critical bug preventing user data from loading, and is missing several operational features needed for day-to-day user administration.

---

## Business Value

- **Critical Bug Fix**: Restore admin ability to view and manage users (currently broken)
- **Operational Efficiency**: Enable admins to manage users without backend database access
- **User Support**: Streamline user support operations (password resets, account issues)
- **System Hygiene**: Track bulk operations and maintain audit trails
- **Data Integrity**: Prevent accidental bulk changes with proper safeguards

---

## Existing System Context

**Current Status:**
- Frontend UI exists at `/admin/users` with full table, filters, search, dialogs
- Backend endpoints exist at `/v1/admin/users/*` with CRUD operations
- **BLOCKING BUG**: User fetch fails due to invalid Prisma query (line 579 in user.service.ts references non-existent `vendorProfile` field)
- Mock stats displayed (using client-side counts instead of real DB aggregations)

**Technology Stack:**
- Frontend: React + TanStack Query + Radix UI
- Backend: Fastify + Prisma + PostgreSQL
- Auth: JWT with RBAC middleware

**Integration Points:**
- User model: `backend/prisma/schema.prisma` (User, Organization, Subscription relations)
- User service: `backend/src/services/user.service.ts` (listUsers, updateUser, deleteUser methods)
- Admin routes: `backend/src/routes/admin.routes.ts` (REST endpoints)
- Frontend page: `frontend/src/pages/admin/UserManagement.tsx`

---

## Stories

### Story 10.1: Fix User Fetch Bug and Real Stats

**As an** admin
**I want** to view all users with accurate statistics
**So that** I can monitor and manage user accounts effectively

**Acceptance Criteria:**
1. ✅ FIXED: Remove invalid `vendorProfile` filter from user.service.ts line 579
2. Backend returns real aggregated stats for users:
   - Total users count (all non-deleted)
   - Active users count (status = ACTIVE)
   - Verified users count (emailVerified = true)
   - Role breakdown (count by ADMIN, USER, VENDOR)
3. New endpoint: `GET /v1/admin/users/stats` returns:
   ```typescript
   {
     total: number,
     active: number,
     verified: number,
     unverified: number,
     byRole: { ADMIN: number, USER: number, VENDOR: number },
     byStatus: { ACTIVE: number, SUSPENDED: number, DELETED: number }
   }
   ```
4. Frontend fetches real stats and displays in stat cards (replacing client-side filter counts)
5. User table loads successfully with pagination (20 per page)
6. Search by email/name works correctly
7. Filter by role and status works correctly

**Technical Notes:**
- Bug already identified and fixed in user.service.ts:579
- Add new stats endpoint to admin.routes.ts
- Implement efficient aggregation query in user.service.ts using Prisma groupBy
- Frontend uses TanStack Query for stats: `useQuery(['admin-users-stats'], ...)`

---

### Story 10.2: Bulk User Operations

**As an** admin
**I want** to perform actions on multiple users at once
**So that** I can efficiently manage large user sets

**Acceptance Criteria:**
1. Add checkbox column to user table (select individual users)
2. "Select All" checkbox in header (selects all visible users on current page)
3. When users selected, show floating action bar with:
   - Count: "X users selected"
   - Actions: "Suspend", "Activate", "Delete"
   - "Clear Selection" button
4. Bulk suspend action:
   - Confirmation dialog: "Suspend X users?"
   - `POST /v1/admin/users/bulk-suspend` with `userIds: string[]`
   - Updates status to SUSPENDED for all selected users
   - Shows toast: "X users suspended"
5. Bulk activate action:
   - Confirmation dialog: "Activate X users?"
   - `POST /v1/admin/users/bulk-activate` with `userIds: string[]`
   - Updates status to ACTIVE for all selected users
   - Shows toast: "X users activated"
6. Bulk delete action:
   - DESTRUCTIVE confirmation dialog: "Permanently delete X users? This cannot be undone."
   - User must type "DELETE" to confirm
   - `POST /v1/admin/users/bulk-delete` with `userIds: string[]`
   - Soft deletes users (status = DELETED)
   - Shows toast: "X users deleted"
7. All bulk operations refresh user list and stats after completion
8. Maximum 100 users per bulk operation (enforce on frontend and backend)

**Technical Notes:**
- Use checkbox state management (array of selected user IDs)
- Floating action bar uses Radix UI Dialog + fixed positioning
- Backend validates all users exist and admin has permission
- Use Prisma `updateMany` for bulk status updates
- Log all bulk operations to audit log

---

### Story 10.3: User Activity Audit Trail

**As an** admin
**I want** to see a history of all administrative actions on users
**So that** I can track changes and troubleshoot issues

**Acceptance Criteria:**
1. New "Activity" tab added to user detail dialog
2. Tab shows chronological audit trail for the user:
   - Action (e.g., "User Created", "Status Changed", "Role Updated")
   - Changed fields (e.g., "status: ACTIVE → SUSPENDED")
   - Performed by (admin user name + email)
   - Timestamp (relative: "2 hours ago", absolute on hover)
3. Backend endpoint: `GET /v1/admin/users/:id/audit-log`
4. Audit log captures:
   - User creation (auto-logged on registration)
   - Profile updates (name, email, role changes)
   - Status changes (activated, suspended, deleted)
   - Password resets (admin-initiated)
   - Bulk operation participations
5. Audit entries stored in `AuditLog` table (already exists in schema)
6. Pagination: Show last 50 entries, "Load More" button
7. Filter by action type (dropdown: All, Created, Updated, Status Change, etc.)

**Technical Notes:**
- Use existing AuditLog model from schema
- Create audit entries using service helper: `auditLog.create({ userId, action, entity, entityId, changes })`
- Frontend uses virtualized list for long audit trails (react-window)
- Cache audit log for 5 minutes (rarely changes)

---

### Story 10.4: Enhanced User Search and Advanced Filters

**As an** admin
**I want** advanced search and filtering options
**So that** I can quickly find specific users or user segments

**Acceptance Criteria:**
1. Search enhancements:
   - Search by email, first name, last name, organization name (existing)
   - Add search by user ID (exact match)
   - Add "Search in" dropdown: "All Fields", "Email Only", "Name Only", "Organization Only"
   - Debounced search (300ms) to reduce API calls
2. Advanced filters panel (collapsible):
   - Email verified: Yes / No / All
   - Last login: "Last 7 days", "Last 30 days", "Last 90 days", "Never", "All"
   - Has organization: Yes / No / All
   - Subscription plan: FREE / PREMIUM / ENTERPRISE / None / All
   - Created date range: Date picker (from/to)
3. Filter chips displayed above table:
   - Show active filters as removable chips
   - "Clear All Filters" button
4. URL state management:
   - Filters persist in URL query params
   - Shareable URLs with filter state
   - Back/forward navigation preserves filters
5. Export filtered results:
   - "Export Visible" button exports current filtered/searched users
   - CSV format with columns: ID, Email, Name, Role, Status, Organization, Created Date, Last Login
   - `GET /v1/admin/users/export?[filters]` returns CSV
   - Downloads as `users-export-YYYY-MM-DD.csv`
6. Performance: Queries with filters return within 500ms

**Technical Notes:**
- Use React Hook Form for filter form state
- URL state management: use `useSearchParams` hook
- Backend: Build dynamic Prisma where clause from query params
- CSV generation: Use `papaparse` library
- Add database indexes for filtered fields (lastLogin, emailVerified, createdAt)

---

## Compatibility Requirements

- [x] Existing user table UI remains functional
- [x] Current search/filter behavior preserved
- [x] All existing admin routes remain unchanged (only additions)
- [x] No Prisma schema changes required
- [x] Works with existing RBAC middleware

---

## Risk Mitigation

**Primary Risk:** Bulk delete operation could accidentally remove critical users

**Mitigation:**
- Require explicit "DELETE" confirmation text
- Limit bulk operations to 100 users max
- Soft delete only (status = DELETED, data retained)
- Audit log captures all bulk operations with admin identity

**Rollback Plan:**
- Critical bug fix (10.1) has no rollback risk (pure fix)
- Bulk operations are additive features (can be feature-flagged)
- Audit trail is read-only addition (no existing functionality changed)

---

## Definition of Done

- [x] Story 10.1: Users load successfully, real stats displayed
- [ ] Story 10.2: Bulk operations work with proper confirmations
- [ ] Story 10.3: Audit trail visible for all user actions
- [ ] Story 10.4: Advanced search and export working
- [ ] All existing user management features still functional
- [ ] Admin can manage 1000+ users without performance issues
- [ ] Audit log captures all administrative actions
- [ ] No data loss or corruption from bulk operations
