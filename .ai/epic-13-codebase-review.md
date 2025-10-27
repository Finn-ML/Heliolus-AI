# Epic 13: RFP & Vendor Engagement System - Codebase Review

**Date**: 2025-10-27
**Branch**: `claude/activate-sm-persona-011CUY6si9Yyu8hz4tvBowtf`
**Reviewer**: Claude (Dev Agent)

## Executive Summary

This document analyzes all 6 stories from Epic 13 against the existing codebase to identify:
- Missing API routes that need to be created
- Missing services that need to be implemented
- Missing middleware components
- Database schema changes required
- Potential integration conflicts
- Recommendations for implementation

## Stories Analyzed

1. Story 13.1: RFP Form & Auto-Population System
2. Story 13.2: RFP Delivery System
3. Story 13.3: Lead Tracking & Classification System
4. Story 13.4: User RFP Management Dashboard
5. Story 13.5: User Tier Access Control
6. Story 13.6: Contact Form System (Basic Lead)

---

## 1. DATABASE SCHEMA ANALYSIS

### 1.1 Missing Models

#### **RFP Model** (DOES NOT EXIST - NEEDS TO BE CREATED)
Required by Stories: 13.1, 13.2, 13.3, 13.4

```prisma
model RFP {
  id             String   @id @default(cuid())
  userId         String
  organizationId String

  // RFP Content
  title          String
  objectives     String
  requirements   String
  timeline       String?
  budget         String?

  // Documents
  documents      String[] // Replit Object Storage URLs

  // Vendors
  vendorIds      String[] // Vendors this RFP was sent to

  // Status
  status         RFPStatus @default(DRAFT)
  leadStatus     LeadStatus? @default(NEW)  // For admin tracking
  sentAt         DateTime?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  user           User         @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  contacts       VendorContact[]

  @@index([userId])
  @@index([organizationId])
  @@index([status])
  @@index([leadStatus])
  @@index([sentAt])
}

enum RFPStatus {
  DRAFT
  SENT
  ACTIVE
  CLOSED
  ARCHIVED
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  CLOSED
}
```

**Migration command**: `npm run db:migrate` (from backend/)

### 1.2 Required Enhancements to Existing Models

#### **VendorContact Model** (EXISTS - NEEDS ENHANCEMENT)
Add optional `rfpId` field:

```prisma
model VendorContact {
  // ... existing fields
  rfpId  String?
  rfp    RFP?    @relation(fields: [rfpId], references: [id])
}
```

**Note**: VendorContact already has all other fields needed (message, budget, timeline, type, status).

#### **ContactType Enum** (ALREADY HAS RFP VALUE ✅)
Current enum at `backend/prisma/schema.prisma:221-227`:
```prisma
enum ContactType {
  DEMO_REQUEST
  INFO_REQUEST
  RFP          // ✅ Already exists!
  PRICING
  GENERAL
}
```

**Status**: NO CHANGE NEEDED

#### **User Model** (NEEDS RELATION)
Add RFP relation:
```prisma
model User {
  // ... existing fields
  rfps           RFP[]  // Add this line
}
```

#### **Organization Model** (NEEDS RELATION)
Add RFP relation:
```prisma
model Organization {
  // ... existing fields
  rfps           RFP[]  // Add this line
}
```

### 1.3 Subscription Plan (ALREADY EXISTS ✅)
At `backend/prisma/schema.prisma:187-191`:
```prisma
enum SubscriptionPlan {
  FREE
  PREMIUM // €599/month
  ENTERPRISE // Custom
}
```

**Status**: NO CHANGE NEEDED

---

## 2. BACKEND API ROUTES ANALYSIS

### 2.1 Missing Route Files

#### **rfp.routes.ts** (DOES NOT EXIST - NEEDS TO BE CREATED)
**Location**: `backend/src/routes/rfp.routes.ts`

**Required Endpoints**:
1. `POST /v1/rfp` - Create RFP (Story 13.1)
2. `GET /v1/rfp/:id` - Get RFP details (Story 13.1)
3. `PATCH /v1/rfp/:id` - Update draft RFP (Story 13.1)
4. `POST /v1/rfp/:id/documents` - Upload RFP documents (Story 13.1)
5. `POST /v1/rfp/:id/send` - Send RFP to vendors (Story 13.2)
6. `GET /v1/rfp/my-rfps` - User's RFP list (Story 13.4)
7. `PATCH /v1/rfp/:id/status` - Update RFP status (Story 13.4)

**Dependencies**:
- rfp.service.ts (needs to be created)
- premium-tier.middleware.ts (needs to be created)
- authenticationMiddleware (already exists)

**Registration**: Must be registered in `backend/src/server.ts`

### 2.2 Missing Routes in Existing Files

#### **organization.routes.ts** (EXISTS - NEEDS NEW ROUTE)
**New Route Required**:
- `GET /v1/organization/:id/strategic-roadmap` - Retrieve strategic roadmap for RFP auto-population (Story 13.1)

**Dependencies**:
- strategic-roadmap.service.ts (needs to be created)

#### **admin.routes.ts** (EXISTS - NEEDS NEW ROUTES)
**New Routes Required** (Story 13.3):
1. `GET /v1/admin/leads` - List all leads with filters
2. `GET /v1/admin/leads/:id` - Lead details (requires `type` query param)
3. `PATCH /v1/admin/leads/:id` - Update lead status
4. `GET /v1/admin/leads/export` - CSV export
5. `GET /v1/admin/leads/analytics` - Lead analytics summary

**Dependencies**:
- lead.service.ts (needs to be created)
- papaparse (already installed ✅, used at line 7 of admin.routes.ts)
- requireRole('ADMIN') middleware (already exists ✅)

#### **vendor.routes.ts** (EXISTS - ROUTE ALREADY EXISTS ✅)
**Existing Route** at line 518:
```typescript
POST '/:id/contact' - Contact vendor
```

**Status**: ALREADY IMPLEMENTED ✅

However, **Story 13.6 requires modifications**:
1. Add rate limiting middleware (not currently present)
2. Add email notification on contact (may need email.service.ts enhancement)
3. Ensure NO Premium tier check (currently returns 402 for premium - needs review)

---

## 3. BACKEND SERVICES ANALYSIS

### 3.1 Missing Services (NEED TO BE CREATED)

#### **rfp.service.ts** (DOES NOT EXIST)
**Location**: `backend/src/services/rfp.service.ts`
**Required by**: Stories 13.1, 13.2, 13.4

**Required Methods**:
```typescript
class RFPService extends BaseService {
  // Story 13.1
  async createRFP(userId: string, organizationId: string, data: CreateRFPInput): Promise<RFP>
  async getRFPById(id: string, userId: string): Promise<RFP>
  async updateRFP(id: string, userId: string, updates: UpdateRFPInput): Promise<RFP>
  async deleteDraft(id: string, userId: string): Promise<void>

  // Story 13.2
  async sendRFP(rfpId: string, userId: string): Promise<void>

  // Story 13.4
  async getMyRFPs(userId: string, filters: RFPFilters): Promise<RFPListItem[]>
  async getRFPDetails(rfpId: string, userId: string): Promise<RFPDetails>
  async updateRFPStatus(rfpId: string, userId: string, newStatus: RFPStatus): Promise<RFP>
}
```

**Dependencies**:
- document.service.ts (already exists ✅)
- email.service.ts (already exists ✅)
- Prisma client (already available ✅)

#### **strategic-roadmap.service.ts** (DOES NOT EXIST)
**Location**: `backend/src/services/strategic-roadmap.service.ts`
**Required by**: Story 13.1

**Required Methods**:
```typescript
class StrategicRoadmapService extends BaseService {
  async getStrategicRoadmap(organizationId: string): Promise<RoadmapData>
}
```

**Data Aggregation Sources**:
1. Organization model (profile data)
2. Assessment model (latest completed assessment)
3. AssessmentPriorities model (goals, timeline, use cases)
4. Gap model (top 5 HIGH/CRITICAL gaps)
5. Strategy Matrix (phased roadmap - optional)

**Note**: This is NOT AI generation, it's pure data aggregation.

#### **lead.service.ts** (DOES NOT EXIST)
**Location**: `backend/src/services/lead.service.ts`
**Required by**: Story 13.3

**Required Methods**:
```typescript
class LeadService extends BaseService {
  async getLeads(filters: LeadFilters): Promise<Lead[]>
  async getLeadById(leadId: string, leadType: 'PREMIUM' | 'BASIC'): Promise<Lead>
  async updateLeadStatus(leadId: string, leadType: 'PREMIUM' | 'BASIC', newStatus: LeadStatus): Promise<void>
  async getLeadAnalytics(): Promise<LeadAnalytics>
  async exportLeadsToCSV(filters: LeadFilters): Promise<string>
}
```

**Note**: This service creates a **virtual "Lead" model** by aggregating:
- Premium leads from RFP table (where status = SENT)
- Basic leads from VendorContact table (where type != RFP)

### 3.2 Required Enhancements to Existing Services

#### **document.service.ts** (EXISTS - NEEDS ENHANCEMENT)
**New Method Required**:
```typescript
async uploadRFPDocument(rfpId: string, file: File): Promise<string>
```

**Validation**:
- File types: PDF, DOCX, XLSX only
- Max file size: 10MB per file
- Max 5 files per RFP
- Upload to Replit Object Storage: `rfp/{rfpId}/{filename}`

**Note**: Current document.service.ts uses Replit Object Storage (NOT AWS S3 ✅)

#### **email.service.ts** (EXISTS - NEEDS ENHANCEMENT)
**New Methods Required**:

1. **sendRFPToVendor** (Story 13.2):
```typescript
async sendRFPToVendor(
  vendorEmail: string,
  vendorName: string,
  rfpData: RFPEmailData,
  documentLinks: string[]
): Promise<void>
```

2. **sendVendorInquiry** (Story 13.6):
```typescript
async sendVendorInquiry(
  vendorEmail: string,
  vendorName: string,
  userCompany: string,
  userName: string,
  userEmail: string,
  message: string,
  budget?: string,
  timeline?: string
): Promise<void>
```

**Email Provider**: Postmark (already configured ✅)
**Pattern**: Use `sendEmailWithRetry` method (already exists ✅)

**New Templates Required**:
1. `backend/src/templates/rfp-vendor-notification.html`
2. `backend/src/templates/rfp-vendor-notification.text`
3. `backend/src/templates/vendor-inquiry.html`
4. `backend/src/templates/vendor-inquiry.text`

---

## 4. MIDDLEWARE ANALYSIS

### 4.1 Missing Middleware (NEED TO BE CREATED)

#### **premium-tier.middleware.ts** (DOES NOT EXIST)
**Location**: `backend/src/middleware/premium-tier.middleware.ts`
**Required by**: Stories 13.1, 13.5

**Implementation**:
```typescript
export async function requirePremiumTier(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user?.id;

  if (!userId) {
    return reply.code(401).send({
      success: false,
      message: 'Authentication required'
    });
  }

  const subscription = await request.server.prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true }
  });

  if (!subscription || subscription.plan !== 'PREMIUM') {
    return reply.code(403).send({
      success: false,
      message: 'RFP creation requires Premium subscription. Upgrade to unlock.',
      code: 'PREMIUM_REQUIRED'
    });
  }

  if (subscription.status !== 'ACTIVE') {
    return reply.code(403).send({
      success: false,
      message: 'Your Premium subscription is not active. Please update payment method.',
      code: 'SUBSCRIPTION_INACTIVE'
    });
  }
}
```

**Apply to Routes**:
- POST /v1/rfp
- POST /v1/rfp/:id/send
- POST /v1/rfp/:id/documents

#### **rate-limit-contacts.middleware.ts** (DOES NOT EXIST)
**Location**: `backend/src/middleware/rate-limit-contacts.middleware.ts`
**Required by**: Story 13.6

**Implementation** (In-Memory):
```typescript
const contactAttempts = new Map<string, number[]>();

export function rateLimitContactsMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user?.id;
  if (!userId) {
    return reply.code(401).send({ success: false, message: 'Authentication required' });
  }

  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  let attempts = contactAttempts.get(userId) || [];
  attempts = attempts.filter(timestamp => timestamp > oneDayAgo);

  if (attempts.length >= 3) {
    return reply.code(429).send({
      success: false,
      message: "You've reached the daily limit of 3 vendor contacts. Please try again tomorrow.",
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  attempts.push(now);
  contactAttempts.set(userId, attempts);
}
```

**Alternative**: Use Redis for distributed rate limiting (Redis is already available ✅)

**Apply to Route**:
- POST /v1/vendor/:id/contact

### 4.2 Existing Middleware (NEEDS REVIEW)

#### **rbac.middleware.ts** (EXISTS - INCOMPLETE)
**Location**: `backend/src/middleware/rbac.middleware.ts`

**Issue**: `requirePremium` function exists (line 151) but is incomplete:
```typescript
// Line 169: TODO: Implement subscription check from database
const hasPremium = false; // Placeholder - implement actual check
```

**Recommendation**:
1. Either complete the `requirePremium` function in rbac.middleware.ts, OR
2. Create separate `premium-tier.middleware.ts` as specified in stories

**Decision**: Stories specify creating `premium-tier.middleware.ts`, so recommend creating new middleware and potentially deprecating incomplete `requirePremium` in rbac.middleware.ts.

---

## 5. EXISTING ROUTE CONFLICTS & CONSIDERATIONS

### 5.1 vendor.routes.ts Contact Endpoint

**Current Implementation** (Line 518):
```typescript
POST '/:id/contact'
```

**Current Behavior**:
- Requires authentication ✅
- Validates with ContactVendorRequestSchema ✅
- Creates VendorContact record ✅
- **Returns 402 for non-premium users** ⚠️ (Line 614-621)

**Story 13.6 Requirement**:
- Should be available to ALL authenticated users (Free + Premium)
- Should have rate limiting (3 contacts per day)
- Should send email to vendor

**Conflict**: Current implementation returns 402 (Payment Required) for non-premium users, but Story 13.6 requires this to be available to Free tier users.

**Resolution Required**:
1. Remove Premium subscription check from contact endpoint
2. Add rate limiting middleware
3. Ensure email notification is triggered
4. Verify this doesn't break existing functionality

### 5.2 Strategic Roadmap Route Placement

**Story 13.1 Specifies**: `GET /v1/organization/:id/strategic-roadmap`

**Consideration**: This route aggregates data from Organization, Assessment, AssessmentPriorities, Gap, and Strategy Matrix. Should it be in:
- organization.routes.ts? (implied by `/organization/:id/...`)
- assessment.routes.ts? (it's primarily assessment-related)
- rfp.routes.ts? (it's only used for RFP creation)

**Recommendation**: Place in `organization.routes.ts` as specified, since the endpoint path starts with `/organization/:id/`.

---

## 6. FRONTEND CONSIDERATIONS (Not in Scope, but FYI)

### 6.1 Required Frontend Components

**Story 13.1**:
- RFPFormModal.tsx
- Document upload with react-dropzone
- Vendor multi-select component

**Story 13.3**:
- LeadListPage.tsx (admin)
- LeadDetailsModal.tsx (admin)
- CSV export trigger

**Story 13.4**:
- RFPDashboardPage.tsx (user)
- RFPDetailPage.tsx (user)
- ActivityTimeline component
- VendorResponseTable component

**Story 13.5**:
- UpgradeModal.tsx
- Feature flag system
- Tier-based conditional rendering

**Story 13.6**:
- ContactVendorForm.tsx
- Rate limit UI handling

### 6.2 Frontend API Client Updates

**File**: `frontend/src/lib/api.ts`

**New Endpoints to Add**:
- POST /v1/rfp
- GET /v1/rfp/my-rfps
- GET /v1/rfp/:id
- PATCH /v1/rfp/:id
- PATCH /v1/rfp/:id/status
- POST /v1/rfp/:id/documents
- POST /v1/rfp/:id/send
- GET /v1/organization/:id/strategic-roadmap
- GET /v1/admin/leads (admin only)
- PATCH /v1/admin/leads/:id (admin only)
- GET /v1/admin/leads/export (admin only)
- POST /v1/vendor/:id/contact (already exists, verify)

---

## 7. SUMMARY OF MISSING COMPONENTS

### 7.1 Database Schema Changes

| Component | Status | Priority | Story |
|-----------|--------|----------|-------|
| RFP model | ❌ Missing | HIGH | 13.1, 13.2, 13.3, 13.4 |
| RFPStatus enum | ❌ Missing | HIGH | 13.1 |
| LeadStatus enum | ❌ Missing | HIGH | 13.3 |
| VendorContact.rfpId field | ❌ Missing | MEDIUM | 13.2, 13.3 |
| User.rfps relation | ❌ Missing | HIGH | 13.1 |
| Organization.rfps relation | ❌ Missing | HIGH | 13.1 |
| ContactType.RFP value | ✅ Exists | - | - |
| SubscriptionPlan (FREE/PREMIUM) | ✅ Exists | - | - |

### 7.2 Backend Route Files

| File | Status | Routes Count | Priority |
|------|--------|--------------|----------|
| rfp.routes.ts | ❌ Missing | 7 routes | HIGH |
| organization.routes.ts | ⚠️ Needs 1 route | +1 route | MEDIUM |
| admin.routes.ts | ⚠️ Needs 5 routes | +5 routes | MEDIUM |
| vendor.routes.ts | ⚠️ Needs modification | Modify 1 route | MEDIUM |

### 7.3 Backend Services

| Service | Status | Priority | Story |
|---------|--------|----------|-------|
| rfp.service.ts | ❌ Missing | HIGH | 13.1, 13.2, 13.4 |
| strategic-roadmap.service.ts | ❌ Missing | HIGH | 13.1 |
| lead.service.ts | ❌ Missing | MEDIUM | 13.3 |
| document.service.ts enhancement | ⚠️ Needs 1 method | MEDIUM | 13.1 |
| email.service.ts enhancement | ⚠️ Needs 2 methods | MEDIUM | 13.2, 13.6 |

### 7.4 Backend Middleware

| Middleware | Status | Priority | Story |
|------------|--------|----------|-------|
| premium-tier.middleware.ts | ❌ Missing | HIGH | 13.1, 13.5 |
| rate-limit-contacts.middleware.ts | ❌ Missing | MEDIUM | 13.6 |
| rbac.middleware.ts (requirePremium) | ⚠️ Incomplete | LOW | Review needed |

### 7.5 Email Templates

| Template | Status | Priority | Story |
|----------|--------|----------|-------|
| rfp-vendor-notification.html | ❌ Missing | MEDIUM | 13.2 |
| rfp-vendor-notification.text | ❌ Missing | MEDIUM | 13.2 |
| vendor-inquiry.html | ❌ Missing | MEDIUM | 13.6 |
| vendor-inquiry.text | ❌ Missing | MEDIUM | 13.6 |

---

## 8. POTENTIAL ISSUES & CONFLICTS

### 8.1 Critical Issues

1. **Vendor Contact Endpoint Conflict** (HIGH PRIORITY)
   - **Issue**: Current POST /v1/vendor/:id/contact returns 402 for non-premium users
   - **Story Requirement**: Should be available to Free tier users
   - **Impact**: Story 13.6 cannot be implemented without modifying existing behavior
   - **Resolution**: Remove Premium check from contact endpoint, apply only to RFP routes

2. **Missing RFP Model** (HIGH PRIORITY)
   - **Issue**: No RFP model exists in Prisma schema
   - **Impact**: 4 out of 6 stories depend on this model
   - **Resolution**: Create Prisma migration as first task

3. **Incomplete requirePremium Middleware** (MEDIUM PRIORITY)
   - **Issue**: Placeholder implementation in rbac.middleware.ts
   - **Impact**: Premium features cannot be gated until implemented
   - **Resolution**: Create new premium-tier.middleware.ts as specified in stories

### 8.2 Data Consistency Considerations

1. **Lead Classification Logic**
   - Premium leads: RFP records with status = SENT
   - Basic leads: VendorContact records with type != RFP
   - **Risk**: If RFP-generated VendorContact records don't have rfpId set, they'll be misclassified as Basic leads
   - **Mitigation**: Ensure Story 13.2 always sets rfpId when creating VendorContact from RFP

2. **VendorContact Rate Limiting**
   - Story 13.6 requires 3 contacts per user per day
   - **Risk**: In-memory rate limiting won't work in distributed environments
   - **Mitigation**: Use Redis (already available) for distributed rate limiting

3. **RFP Status vs Lead Status**
   - RFP has both `status` (RFPStatus) and `leadStatus` (LeadStatus)
   - **Risk**: Confusion between two status fields
   - **Clarification**:
     - `status` = RFP lifecycle (DRAFT → SENT → ACTIVE → CLOSED)
     - `leadStatus` = Sales tracking (NEW → CONTACTED → QUALIFIED → CLOSED)

### 8.3 Integration Points

1. **Document Upload**
   - Story 13.1 specifies max 10MB per file, 5 files max
   - Current document.service.ts uses 50MB limit
   - **Resolution**: Use stricter validation in RFP document upload method

2. **Email Service**
   - Postmark already configured ✅
   - Email template rendering pattern exists ✅
   - Retry logic exists (sendEmailWithRetry) ✅
   - **Resolution**: Follow existing patterns

3. **Strategic Roadmap Data**
   - Aggregates from 5 different models
   - No AI generation (pure data aggregation)
   - **Risk**: Performance if organization has many assessments/gaps
   - **Mitigation**: Fetch only latest completed assessment, limit to top 5 gaps

---

## 9. RECOMMENDATIONS

### 9.1 Implementation Order

**Phase 1: Foundation** (Stories 13.1, 13.5)
1. Create Prisma migration (RFP model, enums, relations)
2. Create premium-tier.middleware.ts
3. Create rfp.service.ts
4. Create strategic-roadmap.service.ts
5. Enhance document.service.ts
6. Create rfp.routes.ts with RFP CRUD endpoints
7. Add strategic roadmap route to organization.routes.ts

**Phase 2: Delivery** (Story 13.2)
1. Enhance email.service.ts (sendRFPToVendor method)
2. Create RFP email templates
3. Add sendRFP method to rfp.service.ts
4. Add POST /v1/rfp/:id/send route

**Phase 3: Admin Visibility** (Story 13.3)
1. Create lead.service.ts
2. Add lead routes to admin.routes.ts (5 routes)
3. Implement CSV export logic (papaparse already available)

**Phase 4: User Dashboard** (Story 13.4)
1. Add getMyRFPs, getRFPDetails, updateRFPStatus to rfp.service.ts
2. Add user RFP routes to rfp.routes.ts

**Phase 5: Contact Form** (Story 13.6)
1. Create rate-limit-contacts.middleware.ts
2. Enhance email.service.ts (sendVendorInquiry method)
3. Create vendor inquiry email templates
4. Modify POST /v1/vendor/:id/contact (remove Premium check, add rate limiting)

### 9.2 Testing Priorities

1. **Unit Tests** (HIGH PRIORITY)
   - rfp.service.ts methods
   - strategic-roadmap.service.ts aggregation logic
   - lead.service.ts classification logic
   - Middleware (premium tier, rate limiting)

2. **Contract Tests** (HIGH PRIORITY)
   - All 7 RFP routes
   - 5 admin lead routes
   - Modified vendor contact route
   - Strategic roadmap route

3. **Integration Tests** (MEDIUM PRIORITY)
   - End-to-end RFP flow (create → send → track)
   - Lead classification (Premium vs Basic)
   - Rate limiting behavior

### 9.3 Documentation Needs

1. Update API documentation (Swagger/OpenAPI) for all new routes
2. Document strategic roadmap data structure
3. Document lead classification logic
4. Update environment variables documentation (if any new vars needed)
5. Create migration guide for database schema changes

---

## 10. CONCLUSION

**Overall Assessment**: Epic 13 is a substantial addition requiring:
- 1 new database model (RFP)
- 3 new enums (RFPStatus, LeadStatus - though LeadStatus may not need enum)
- 13 new API routes (7 in new file, 6 in existing files)
- 3 new services (rfp, strategic-roadmap, lead)
- 2 new middleware (premium-tier, rate-limit-contacts)
- 4 new email templates
- Enhancements to 2 existing services (document, email)

**Estimated Implementation Effort**:
- Backend: ~33-37 hours (as estimated in Epic 13)
- Database: 2 hours (migrations, testing)
- Testing: 8-10 hours (unit + contract + integration)
- **Total**: ~43-49 hours

**Critical Path**:
1. Database schema (blocks everything)
2. Premium tier middleware (blocks Stories 13.1, 13.5)
3. RFP service + routes (blocks Stories 13.2, 13.3, 13.4)

**Risk Level**: MEDIUM
- No breaking changes to existing functionality (except vendor contact endpoint)
- Self-contained feature (minimal cross-cutting concerns)
- Clear acceptance criteria in all stories

**Readiness**: Stories are well-defined and ready for implementation. Recommend proceeding with Phase 1 (Foundation) first.

---

## APPENDIX A: Complete API Endpoint Checklist

### New Endpoints Required

#### RFP Routes (rfp.routes.ts - NEW FILE)
- [ ] POST /v1/rfp
- [ ] GET /v1/rfp/:id
- [ ] PATCH /v1/rfp/:id
- [ ] POST /v1/rfp/:id/documents
- [ ] POST /v1/rfp/:id/send
- [ ] GET /v1/rfp/my-rfps
- [ ] PATCH /v1/rfp/:id/status

#### Organization Routes (EXISTING FILE)
- [ ] GET /v1/organization/:id/strategic-roadmap

#### Admin Routes (EXISTING FILE)
- [ ] GET /v1/admin/leads
- [ ] GET /v1/admin/leads/:id
- [ ] PATCH /v1/admin/leads/:id
- [ ] GET /v1/admin/leads/export
- [ ] GET /v1/admin/leads/analytics

#### Vendor Routes (EXISTING FILE - MODIFY)
- [ ] POST /v1/vendor/:id/contact (remove Premium check, add rate limiting)

**Total**: 13 new routes + 1 modified route

---

## APPENDIX B: Service Method Checklist

### rfp.service.ts (NEW FILE)
- [ ] createRFP(userId, organizationId, data)
- [ ] getRFPById(id, userId)
- [ ] updateRFP(id, userId, updates)
- [ ] deleteDraft(id, userId)
- [ ] sendRFP(rfpId, userId)
- [ ] getMyRFPs(userId, filters)
- [ ] getRFPDetails(rfpId, userId)
- [ ] updateRFPStatus(rfpId, userId, newStatus)

### strategic-roadmap.service.ts (NEW FILE)
- [ ] getStrategicRoadmap(organizationId)

### lead.service.ts (NEW FILE)
- [ ] getLeads(filters)
- [ ] getLeadById(leadId, leadType)
- [ ] updateLeadStatus(leadId, leadType, newStatus)
- [ ] getLeadAnalytics()
- [ ] exportLeadsToCSV(filters)

### document.service.ts (EXISTING FILE)
- [ ] uploadRFPDocument(rfpId, file)

### email.service.ts (EXISTING FILE)
- [ ] sendRFPToVendor(vendorEmail, vendorName, rfpData, documentLinks)
- [ ] sendVendorInquiry(vendorEmail, vendorName, userCompany, userName, userEmail, message, budget, timeline)

**Total**: 17 new methods

---

**Document Version**: 1.0
**Last Updated**: 2025-10-27
**Next Review**: After Phase 1 completion
