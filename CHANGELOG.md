# Changelog

All notable changes to the Heliolus Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed - 2025-10-13

#### Reports Page Not Displaying Completed Assessments (CRITICAL BUG FIX)

**Issue**: Reports page showed all assessments as "generating" and couldn't display any completed reports, even though 26 completed assessments existed in the database.

**Root Cause**:
1. Fastify response schema validation was stripping `template`, `gaps`, and `risks` fields from API responses
2. Prisma ORM `take` limitation applied globally instead of per-parent record
3. Default pagination limited results to first 10 assessments (all DRAFT/FAILED)

**Fixed**:
- Updated `AssessmentResponseSchema` in `backend/src/routes/assessment.routes.ts` to include template, gaps, and risks fields
- Removed problematic `take: 5` limits from gaps/risks queries in `backend/src/services/assessment.service.ts`
- Increased default pagination limit to 100 in `frontend/src/lib/api.ts`

**Impact**:
- ✅ Reports page now displays all 26 completed assessments with proper template names, gap counts, and risk scores
- ✅ Assessment titles show actual template names (e.g., "Trade Compliance Assessment") instead of generic "Assessment Report"
- ✅ Gap and risk counts display correctly (e.g., "25 gaps identified")

**Files Modified**:
- `backend/src/routes/assessment.routes.ts` (lines 48-97)
- `backend/src/services/assessment.service.ts` (lines 858-877)
- `frontend/src/lib/api.ts` (lines 162-167)

**Documentation**: See `/REPORTS_PAGE_FIX.md` for complete technical details.

### Added - 2025-10-13

#### Delete Assessment Feature

**Description**: Users can now delete assessments from the Reports page.

**Features**:
- Red "Delete" button with trash icon on each assessment card
- Confirmation dialog prevents accidental deletion ("Are you sure you want to delete...?")
- Button disabled during deletion to prevent duplicate requests
- Automatic list refresh after deletion
- Works for both COMPLETED and IN_PROGRESS assessments
- Proper error handling and user feedback

**New Endpoints**:
- `DELETE /v1/assessments/:id` - Delete an assessment (requires authentication)

**Files Modified**:
- `backend/src/routes/assessment.routes.ts` (added DELETE endpoint, lines 1647-1782)
- `frontend/src/pages/Reports.tsx` (added delete mutation and UI, lines 61-66, 167-176, 301-309, 360-368)

**Security**:
- Endpoint protected by JWT authentication
- RBAC enforcement prevents cross-tenant deletion
- Users can only delete assessments belonging to their organization
- Admins can delete any assessment

---

## Version History

### [0.1.0] - 2025-09-30 (Initial Release)

#### Added
- User authentication system (register, login, email verification, password reset)
- Organization profile management with website parsing
- Document upload, storage, and AI analysis
- Assessment template system with multiple compliance frameworks
- Assessment execution engine with AI-powered answer generation
- Gap and risk identification
- Vendor marketplace with filtering and matching
- Vendor comparison and contact features
- Subscription/billing integration (Stripe)
- Credit system with freemium tier
- Admin dashboard with vendor approval workflow
- PDF report generation
- Audit logging

#### Known Issues
- Frontend tests not yet implemented
- Playwright E2E tests not configured
- Reports page not displaying completed assessments (FIXED 2025-10-13)

---

## Notes

### Versioning Convention
- **Major version** (X.0.0): Breaking changes to API or database schema
- **Minor version** (0.X.0): New features, non-breaking changes
- **Patch version** (0.0.X): Bug fixes, minor improvements

### Issue Labels
- **CRITICAL**: System-breaking bugs, data loss risks
- **HIGH**: Major functionality broken, poor user experience
- **MEDIUM**: Feature partially broken, workarounds exist
- **LOW**: Minor issues, cosmetic problems

### Change Categories
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Features marked for removal
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes
