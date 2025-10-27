# Epic 13: RFP & Vendor Engagement System

**Epic ID:** 13
**Status:** Draft
**Priority:** P1 - High
**Estimated Effort:** 33-37 hours
**Dependencies:**
- Existing Vendor model and marketplace (Epic 1, 2)
- User authentication & RBAC (Epic 4)
- Organization & Strategic Roadmap data

---

## Epic Description

Transform the existing vendor contact system into a comprehensive RFP (Request for Proposal) management platform. Enable users to create detailed RFPs with auto-populated strategic context, deliver them to multiple vendors via email, track engagement as qualified leads, and manage all RFP activity through a dedicated dashboard with tier-based access controls.

---

## Business Value

- **Qualified Lead Generation**: Transform vendor contacts into trackable, classifiable leads (Basic vs Premium)
- **Efficient Vendor Engagement**: Auto-populate RFPs from strategic roadmap data, reducing user effort by 70%
- **Revenue Opportunity**: Clear differentiation between Free tier (contact form) and Premium tier (full RFP)
- **Sales Pipeline**: Admin visibility into all RFP activity with export for CRM integration
- **User Experience**: Centralized RFP management dashboard for tracking vendor responses
- **Vendor ROI**: Professional RFP delivery increases vendor response rates and engagement quality

---

## Existing System Context

**Current Vendor Marketplace:**
- **Vendor** model: Company profiles with solutions, categories, contact info
- **VendorContact** model: Tracks user-to-vendor contacts (type, message, status, budget, timeline)
- **VendorMatch** model: AI-driven gap-to-vendor matching with scores
- **Solution** model: Vendor products addressing specific compliance gaps

**Current Contact Flow:**
1. User completes assessment → identifies gaps
2. System matches vendors to gaps
3. User views vendor profiles
4. User submits contact form (VendorContact)
5. Vendor receives notification (basic)

**What's Missing:**
- ❌ No RFP creation or structured proposal requests
- ❌ No strategic context auto-population
- ❌ No multi-vendor RFP broadcasting
- ❌ No user dashboard for RFP tracking
- ❌ No lead classification (Basic vs Premium)
- ❌ No tier-based access controls on contact features
- ❌ No admin analytics for lead quality

**Technology Stack:**
- **Backend:** Fastify 4 + Prisma (PostgreSQL)
- **Frontend:** React 18 + TypeScript + TanStack Query
- **Email:** Existing email service infrastructure
- **Auth:** JWT + RBAC middleware
- **Storage:** S3 (for document uploads)

**Integration Points:**
- Organization model → Strategic roadmap data
- Assessment/Gap models → Context for RFP
- Vendor model → RFP recipients
- User/Subscription models → Tier-based access control
- VendorContact model → Enhanced with RFP data

---

## Stories

### Story 13.1: RFP Form & Auto-Population System

**As a** Premium user
**I want** to create a detailed RFP with auto-populated strategic context
**So that** I can efficiently engage vendors with comprehensive requirements

**Scope:**
- Frontend: RFP form component with drag-and-drop document upload
- Auto-population: Pull data from organization strategic roadmap
- Validation: Form validation with required fields
- Backend: API endpoints for roadmap retrieval, file upload, RFP creation

**Acceptance Criteria:**
1. RFP form includes fields:
   - Company overview (auto-populated from Organization)
   - Project objectives (auto-populated from Strategic Roadmap)
   - Technical requirements (manual + auto-suggested from gaps)
   - Timeline & budget constraints
   - Document uploads (drag-and-drop, multi-file support)
   - Vendor selection (multi-select from matched vendors)
2. Auto-population button pre-fills strategic roadmap data
3. Document upload supports: PDF, DOCX, XLSX (max 10MB per file, 5 files max)
4. Form validation prevents submission without required fields
5. API: `POST /v1/rfp` creates RFP record
6. API: `GET /v1/organization/:id/strategic-roadmap` retrieves context
7. API: `POST /v1/rfp/:id/documents` handles file uploads to S3
8. Database: New `RFP` model with relationships to User, Organization, Vendor[]

**Estimated Effort:** 8-10 hours

**Technical Notes:**
- Use existing S3 upload patterns from document.service.ts
- Integrate with existing Organization model
- Form validation with Zod schema
- Drag-and-drop: react-dropzone library

---

### Story 13.2: RFP Delivery System

**As a** system
**I want** to deliver RFPs to selected vendors via professional email
**So that** vendors receive detailed proposals and can respond effectively

**Scope:**
- Email: HTML template for RFP delivery
- Integration: Connect to existing email service (email.service.ts)
- Delivery logic: Send RFP to multiple vendors
- Logging: Track delivery confirmations and vendor notifications

**Acceptance Criteria:**
1. Email template includes:
   - Company name and brief overview
   - RFP summary and objectives
   - Link to full RFP details (vendor portal)
   - Attached documents (if < 5MB total, else download link)
   - Response instructions and deadline
2. API: `POST /v1/rfp/:id/send` triggers delivery to selected vendors
3. Batch email sending: One email per vendor with personalized greeting
4. Delivery confirmation logged to RFP record (sentAt timestamp)
5. Vendor notification creates VendorContact record with type: `RFP`
6. Error handling: Failed sends logged, user notified of delivery status
7. Email service integration: Reuse existing email.service.ts patterns

**Estimated Effort:** 3 hours

**Technical Notes:**
- Extend email.service.ts with RFP template
- Use existing email infrastructure (SendGrid/AWS SES)
- Batch processing for multiple vendors
- Store delivery status in RFP model

---

### Story 13.3: Lead Tracking & Classification System

**As an** admin
**I want** to see all RFPs and contacts classified by type (Basic vs Premium)
**So that** I can track lead quality and prioritize sales follow-up

**Scope:**
- Admin dashboard: Lead classification view
- Backend: Lead model and classification logic
- API: CRUD endpoints for leads
- Analytics: Lead quality metrics and export

**Acceptance Criteria:**
1. Admin dashboard shows two tabs:
   - **Premium Leads**: Full RFPs with strategic context
   - **Basic Leads**: Simple contact form submissions
2. Each lead displays:
   - Company name, user email, submission date
   - Lead type badge (Premium/Basic)
   - Status (New, Contacted, Qualified, Closed)
   - Associated vendors
   - Quick actions: View details, Export, Update status
3. Export functionality:
   - CSV export of filtered leads
   - Columns: Date, Company, User, Type, Status, Vendors, Budget, Timeline
4. API endpoints:
   - `GET /v1/admin/leads` - List all leads with filters (type, status, date range)
   - `GET /v1/admin/leads/:id` - Lead details
   - `PATCH /v1/admin/leads/:id` - Update lead status
   - `GET /v1/admin/leads/export` - CSV export
5. Backend: Unified "Lead" view combining RFP and VendorContact records
6. Analytics query: Count by type, status, conversion rates

**Estimated Effort:** 10 hours

**Technical Notes:**
- Virtual "Lead" model (not separate table, combines RFP + VendorContact)
- Classification logic: RFP = Premium, VendorContact (non-RFP) = Basic
- Use existing admin dashboard patterns from Epic 11
- CSV export: fast-csv library

---

### Story 13.4: Company User RFP Management Dashboard

**As a** user
**I want** to view all my RFPs, track their status, and see vendor responses
**So that** I can manage my vendor engagement activities efficiently

**Scope:**
- Frontend: RFP history list component with status display
- Detail view: Individual RFP with vendor response tracking
- Status management: Toggle RFP status (Active, Closed, Archived)
- Backend: User RFP retrieval API

**Acceptance Criteria:**
1. User dashboard shows:
   - RFP list (table or card view)
   - Columns: RFP Title, Created Date, Vendors Contacted, Status, Response Count
   - Filter: Status (All, Active, Closed, Archived)
   - Sort: Date (newest first), Status
2. RFP detail view:
   - Full RFP content (objectives, requirements, timeline, budget)
   - Vendor list with response status per vendor
   - Attached documents (downloadable)
   - Activity timeline (sent, viewed by vendors, responses received)
3. Status toggle:
   - User can mark RFP as Active, Closed, or Archived
   - Closed RFPs notify vendors (optional)
4. API endpoints:
   - `GET /v1/rfp/my-rfps` - User's RFP list
   - `GET /v1/rfp/:id` - RFP details (authorization: owner only)
   - `PATCH /v1/rfp/:id/status` - Update status
5. Empty state: "No RFPs yet" with CTA to create first RFP

**Estimated Effort:** 5 hours

**Technical Notes:**
- Use TanStack Query for data fetching
- Implement RBAC: User can only see their own RFPs
- Activity timeline: Query VendorContact records by RFP ID
- Responsive table design

---

### Story 13.5: User Tier Access Control

**As a** system
**I want** to restrict RFP features to Premium users only
**So that** we can monetize the RFP system and drive subscriptions

**Scope:**
- Middleware: Tier verification for RFP endpoints
- Frontend: Conditional rendering based on subscription tier
- Access gates: Block Free users from RFP creation
- Upgrade prompts: CTA to upgrade when accessing Premium features

**Acceptance Criteria:**
1. Backend middleware: `requirePremiumTier`
   - Applied to: `/v1/rfp` (POST), `/v1/rfp/:id/send` (POST)
   - Returns 403 Forbidden for Free tier users
   - Error message: "RFP creation requires Premium subscription. Upgrade to unlock."
2. Frontend RFP button:
   - Premium users: Enabled, opens RFP form
   - Free users: Disabled with tooltip "Premium feature"
3. Upgrade modal:
   - Triggered when Free user clicks RFP button
   - Shows: "Upgrade to Premium to create RFPs"
   - Lists: Premium features (RFP, auto-population, multi-vendor broadcast)
   - CTA: "Upgrade Now" → /settings/subscription
4. Tier check uses existing Subscription model
5. API response includes user tier in auth context

**Estimated Effort:** 3 hours

**Technical Notes:**
- Extend existing RBAC middleware from auth.middleware.ts
- Use Subscription.plan field (FREE, PREMIUM)
- Frontend: Conditional rendering with useAuth hook
- Upgrade flow: Link to existing subscription management

---

### Story 13.6: Contact Form System (Basic Lead)

**As a** Free tier user
**I want** to submit a simple contact form to vendors
**So that** I can express interest without Premium subscription

**Scope:**
- Contact form component (simplified version of RFP)
- Basic lead logging (extends VendorContact)
- Vendor notification (email)
- Integration with vendor profiles

**Acceptance Criteria:**
1. Contact form includes:
   - User name, email (auto-populated from User)
   - Company name (auto-populated from Organization)
   - Message (required, 500 char max)
   - Budget range (optional dropdown: <50K, 50K-100K, 100K-500K, 500K+)
   - Timeline (optional dropdown: <3mo, 3-6mo, 6-12mo, 12mo+)
   - Single vendor selection (not multi-select)
2. Form validation: Message required
3. API: `POST /v1/vendor/:vendorId/contact` creates VendorContact record
   - Sets `type: GENERAL_INQUIRY` (not RFP)
4. Vendor email notification:
   - Subject: "New inquiry from [Company Name]"
   - Body: Message, budget, timeline, user contact info
   - CTA: "Reply to [user email]"
5. Success message: "Your inquiry has been sent to [Vendor Name]"
6. Rate limiting: Max 3 contacts per user per day (prevent spam)

**Estimated Effort:** 4 hours

**Technical Notes:**
- Reuse existing VendorContact model
- Differentiate from RFP by type field
- Simple email template (less formal than RFP)
- Rate limiting: Redis-based or in-memory

---

## Database Schema Changes

### New Models

**RFP Model:**
```prisma
model RFP {
  id             String   @id @default(cuid())
  userId         String
  organizationId String

  // RFP Content
  title          String
  objectives     String   // Auto-populated from strategic roadmap
  requirements   String   // Technical requirements
  timeline       String?  // Project timeline
  budget         String?  // Budget range

  // Documents
  documents      String[] // S3 URLs

  // Vendors
  vendorIds      String[] // Vendors this RFP was sent to

  // Status
  status         RFPStatus @default(DRAFT) // DRAFT, SENT, ACTIVE, CLOSED, ARCHIVED
  sentAt         DateTime?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  user           User         @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  contacts       VendorContact[] // Vendors who received this RFP

  @@index([userId])
  @@index([organizationId])
  @@index([status])
  @@index([sentAt])
}

enum RFPStatus {
  DRAFT
  SENT
  ACTIVE
  CLOSED
  ARCHIVED
}
```

**VendorContact Enhancement:**
```prisma
// Add to existing VendorContact model:
rfpId  String? // Link to RFP if this contact came from RFP

// Update relation:
rfp    RFP?    @relation(fields: [rfpId], references: [id])
```

**ContactType Enhancement:**
```prisma
// Add to existing ContactType enum:
enum ContactType {
  GENERAL_INQUIRY   // Basic lead (existing)
  DEMO_REQUEST      // (existing)
  PRICING_INQUIRY   // (existing)
  RFP               // NEW: Premium RFP submission
}
```

---

## Technical Considerations

**Security:**
- RBAC enforcement: Premium tier required for RFP creation
- Document upload: Virus scanning, file type validation
- Rate limiting: Prevent spam on contact forms
- Authorization: Users can only access their own RFPs

**Performance:**
- S3 upload optimization: Multipart uploads for large files
- Batch email sending: Queue-based processing for multiple vendors
- Database indexes: RFP queries by user, organization, status

**Integration:**
- Reuse existing email.service.ts patterns
- Leverage S3 document storage from document.service.ts
- Extend VendorContact model (backward compatible)
- Integrate with Subscription model for tier checks

**User Experience:**
- Auto-save RFP drafts (prevent data loss)
- Real-time upload progress indicators
- Success/error toasts for all actions
- Mobile-responsive forms and dashboards

---

## Compatibility Requirements

- [ ] Existing VendorContact records remain unchanged
- [ ] Contact form (Basic Lead) works for Free tier users
- [ ] RFP system additively extends vendor marketplace
- [ ] No breaking changes to Vendor, VendorMatch models
- [ ] Email notifications maintain existing format for non-RFP contacts

---

## Risk Mitigation

**Primary Risks:**
1. **Spam/Abuse**: Free users could spam vendors with contact forms
   - **Mitigation**: Rate limiting (3 contacts/day), email verification required
2. **Storage Costs**: Large document uploads could increase S3 costs
   - **Mitigation**: File size limits (10MB/file, 5 files), cleanup job for orphaned files
3. **Email Deliverability**: RFP emails could be marked as spam
   - **Mitigation**: Proper email headers, SPF/DKIM, vendor email whitelisting
4. **Performance**: Batch email sending could slow API response
   - **Mitigation**: Background job queue for email sending (future: use Bull/BeeQueue)

**Rollback Plan:**
- Feature flag: `ENABLE_RFP_SYSTEM` (default: false)
- Disable RFP creation via flag if issues arise
- VendorContact records preserved (RFP data in separate table)

---

## Definition of Done

- [ ] All 6 stories completed with acceptance criteria met
- [ ] Database migrations applied (RFP model, ContactType enum)
- [ ] RFP form tested: Auto-population works, documents upload successfully
- [ ] Email delivery tested: RFPs sent to vendors, notifications received
- [ ] Admin dashboard tested: Leads visible, classified correctly, export works
- [ ] User dashboard tested: RFPs listed, detail view functional, status toggles work
- [ ] Access control tested: Free users blocked from RFP, Premium users have access
- [ ] Contact form tested: Free users can submit, rate limiting enforced
- [ ] Integration testing: Existing vendor contact flow unaffected
- [ ] No regressions in vendor marketplace functionality
- [ ] Documentation updated: API docs, admin guide, user guide

---

## Success Metrics (Post-Launch)

- **RFP Creation Rate**: Target 20% of Premium users create RFP in first month
- **Vendor Response Rate**: Target 40%+ vendors respond to RFPs
- **Lead Quality**: 80%+ of RFPs classified as Premium leads
- **Conversion**: 15%+ of RFP senders upgrade from Free to Premium
- **User Engagement**: 50%+ of RFP creators return to dashboard to track status

---

## Future Enhancements (Out of Scope)

- Vendor portal: Vendors log in to view/respond to RFPs directly (not email-only)
- RFP templates: Predefined templates for common compliance scenarios
- Automated vendor selection: AI recommends vendors based on RFP content
- RFP versioning: Track changes to RFPs over time
- Real-time collaboration: Multiple users edit RFP simultaneously
- RFP analytics: Track vendor response times, engagement metrics per RFP
