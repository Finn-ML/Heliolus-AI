# Epic 13: Architectural Decisions & Issue Resolutions

**Document Purpose**: Document critical architectural decisions to resolve issues identified in deep analysis
**Created**: 2025-10-27
**Status**: Final
**Related**: `.ai/epic-13-deep-analysis-issues.md`, Epic 13 Stories (13.1-13.6)

---

## Table of Contents

1. [Data Lifecycle & Deletion Strategy](#data-lifecycle--deletion-strategy)
2. [Transaction Boundaries](#transaction-boundaries)
3. [Email Failure Handling](#email-failure-handling)
4. [API Route Naming Conventions](#api-route-naming-conventions)
5. [File Upload Size Limits](#file-upload-size-limits)
6. [Enum Simplification](#enum-simplification)
7. [Authorization Pattern](#authorization-pattern)
8. [Rate Limiting Strategy](#rate-limiting-strategy)
9. [Implementation Priority](#implementation-priority)

---

## 1. Data Lifecycle & Deletion Strategy

### Problem
Epic 13 introduces RFP system with VendorContact relationships. Need to decide:
- How RFP deletion affects VendorContact records
- How User/Organization deletion affects RFPs
- Compliance and audit trail requirements

### Decision: **Use Cascade Deletes with Audit Logging**

#### Rationale
- **Business Context**: RFPs are business documents with audit requirements
- **Data Integrity**: Orphaned VendorContact records create reporting inconsistencies
- **Compliance**: GDPR/data retention requires clean deletion paths
- **Existing Pattern**: Codebase already uses `onDelete: Cascade` extensively (23 instances in schema.prisma)

#### Schema Changes Required

```prisma
model RFP {
  id             String   @id @default(cuid())
  userId         String
  organizationId String
  // ... other fields

  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  contacts       VendorContact[]
}

model VendorContact {
  id             String   @id @default(cuid())
  vendorId       String
  userId         String
  organizationId String
  rfpId          String?  // NEW FIELD
  // ... other fields

  vendor         Vendor       @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  rfp            RFP?         @relation(fields: [rfpId], references: [id], onDelete: Cascade)  // NEW RELATION
}
```

#### Deletion Behavior

| Trigger | Cascade Effect | Audit Required |
|---------|---------------|----------------|
| User deleted | → All RFPs deleted → All VendorContacts deleted | Yes (log userId, rfpIds) |
| Organization deleted | → All RFPs deleted → All VendorContacts deleted | Yes (log orgId, rfpIds) |
| RFP deleted by user | → All VendorContacts for that RFP deleted | Yes (log rfpId, contactIds) |
| Vendor deleted | → VendorContacts deleted, RFP vendorIds updated | Yes (log vendorId) |

#### Audit Logging Requirements

**Story 13.1 (RFP Creation) - Add to Implementation**:
```typescript
// backend/src/services/rfp.service.ts
async deleteRFP(rfpId: string, userId: string) {
  const rfp = await this.prisma.rFP.findUnique({
    where: { id: rfpId },
    include: { contacts: true }
  });

  if (!rfp) throw new Error('RFP not found');
  if (rfp.userId !== userId) throw new Error('Access denied');

  // Log before deletion (cascade will remove contacts)
  await this.logAudit({
    userId,
    action: 'RFP_DELETED',
    resourceType: 'RFP',
    resourceId: rfpId,
    metadata: {
      title: rfp.title,
      contactsDeleted: rfp.contacts.length,
      contactIds: rfp.contacts.map(c => c.id)
    }
  });

  // Cascade delete handles VendorContact cleanup
  await this.prisma.rFP.delete({ where: { id: rfpId } });

  return this.createResponse({ success: true });
}
```

### Alternative Considered: Soft Deletes

**Rejected because**:
- Adds complexity (need to filter `deletedAt` everywhere)
- RFPs are not high-value business documents requiring retention
- Users expect "delete" to actually remove data
- Cascade deletes are already used extensively in codebase

**Exception**: User/Organization deletion should consider soft deletes (separate decision)

---

## 2. Transaction Boundaries

### Problem
Story 13.2 RFP delivery system has multi-step operations:
1. Create VendorContact records (N vendors)
2. Send emails (N vendors)
3. Update RFP status to SENT

Need to decide:
- What happens if step 2 fails partially?
- What happens if all emails fail?
- Should database writes be rolled back?

### Decision: **Partial Success with Transaction Protection**

#### Rationale
- **User Experience**: Better to have some contacts created than none
- **Idempotency**: Users can retry failed emails separately
- **Email Reliability**: Postmark has high success rate, total failure is rare
- **Existing Pattern**: `vendor.service.ts:738-789` uses similar approach (create contact, then secondary operations)

#### Transaction Strategy

**Story 13.2 - Update sendRFP() Implementation**:

```typescript
// backend/src/services/rfp.service.ts
async sendRFP(rfpId: string, userId: string) {
  const rfp = await this.authorizeRFPAccess(rfpId, userId);

  if (rfp.status === 'SENT') {
    throw new Error('RFP already sent');
  }

  // TRANSACTION 1: Create all VendorContact records first
  const contacts = await this.prisma.$transaction(async (tx) => {
    return Promise.all(
      rfp.vendorIds.map(vendorId =>
        tx.vendorContact.create({
          data: {
            vendorId,
            userId,
            organizationId: rfp.organizationId,
            rfpId: rfp.id,
            type: 'RFP',
            status: 'PENDING',
            metadata: { rfpTitle: rfp.title }
          }
        })
      )
    );
  });

  // TRANSACTION 2: Send emails (outside transaction - external API)
  const emailResults = await Promise.allSettled(
    contacts.map(async (contact, index) => {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: contact.vendorId }
      });

      if (!vendor?.contactEmail) {
        throw new Error(`Vendor ${vendor?.companyName} has no contact email`);
      }

      return this.emailService.sendRFPToVendor(
        vendor.contactEmail,
        vendor.companyName,
        rfp,
        this.generateDocumentLinks(rfp.documents)
      );
    })
  );

  // Analyze results
  const successCount = emailResults.filter(r => r.status === 'fulfilled').length;
  const failureCount = emailResults.filter(r => r.status === 'rejected').length;
  const failures = emailResults
    .map((r, i) => r.status === 'rejected' ? { vendorId: contacts[i].vendorId, error: r.reason } : null)
    .filter(Boolean);

  // TRANSACTION 3: Update RFP status and contact statuses
  await this.prisma.$transaction(async (tx) => {
    // Update successful contacts
    const successfulVendorIds = contacts
      .filter((_, i) => emailResults[i].status === 'fulfilled')
      .map(c => c.vendorId);

    if (successfulVendorIds.length > 0) {
      await tx.vendorContact.updateMany({
        where: { rfpId, vendorId: { in: successfulVendorIds } },
        data: { status: 'CONTACTED', contactedAt: new Date() }
      });
    }

    // Update failed contacts
    const failedVendorIds = contacts
      .filter((_, i) => emailResults[i].status === 'rejected')
      .map(c => c.vendorId);

    if (failedVendorIds.length > 0) {
      await tx.vendorContact.updateMany({
        where: { rfpId, vendorId: { in: failedVendorIds } },
        data: {
          status: 'FAILED',
          metadata: { emailError: 'Failed to send email' }
        }
      });
    }

    // Update RFP status (even if some emails failed)
    if (successCount > 0) {
      await tx.rFP.update({
        where: { id: rfpId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          metadata: {
            emailsSent: successCount,
            emailsFailed: failureCount
          }
        }
      });
    } else {
      // ALL emails failed - mark RFP as failed
      await tx.rFP.update({
        where: { id: rfpId },
        data: {
          status: 'FAILED',
          metadata: {
            error: 'All emails failed to send',
            failures
          }
        }
      });
    }
  });

  // Log audit trail
  await this.logAudit({
    userId,
    action: 'RFP_SENT',
    resourceType: 'RFP',
    resourceId: rfpId,
    metadata: { successCount, failureCount, failures }
  });

  return this.createResponse({
    success: true,
    data: {
      emailsSent: successCount,
      emailsFailed: failureCount,
      failures,
      status: successCount > 0 ? 'SENT' : 'FAILED'
    },
    message: successCount > 0
      ? `RFP sent successfully to ${successCount} vendor(s)`
      : 'All emails failed to send'
  });
}
```

#### Key Decisions

1. **Create contacts first**: Ensures database consistency before external API calls
2. **Partial success allowed**: If any email succeeds, RFP is marked SENT
3. **Total failure handling**: If all emails fail, RFP marked FAILED (not SENT)
4. **No rollback on email failure**: VendorContact records remain (user can retry)
5. **Contact status tracking**: PENDING → CONTACTED (success) or FAILED (error)

#### Schema Addition Required

```prisma
enum RFPStatus {
  DRAFT
  SENT
  FAILED    // NEW: for total email failure
  ARCHIVED
}
```

---

## 3. Email Failure Handling

### Problem
Story 13.2 uses `emailService.sendRFPToVendor()` which has retry logic (3 attempts). Current implementation in `email.service.ts:122-142` has **no delay between retries**, risking rate limits.

### Decision: **Exponential Backoff with Jitter**

#### Rationale
- **Rate Limit Protection**: Postmark has per-second rate limits
- **Transient Failure Recovery**: Network issues often resolve within seconds
- **Best Practice**: Industry standard for retry strategies
- **Minimal Impact**: Total delay ~7 seconds for 3 retries (2s + 4s + 1s jitter)

#### Implementation

**Story 13.2 - Update email.service.ts sendEmailWithRetry()**:

```typescript
// backend/src/services/email.service.ts
private async sendEmailWithRetry<T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on final attempt
      if (attempt === retries) break;

      // Exponential backoff: 2^attempt * 1000ms + random jitter
      const baseDelay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      const jitter = Math.random() * 1000; // 0-1s random
      const delay = baseDelay + jitter;

      console.warn(`Email send attempt ${attempt} failed: ${error.message}. Retrying in ${Math.round(delay)}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`Email send failed after ${retries} attempts:`, lastError);
  throw lastError;
}
```

#### Retry Schedule

| Attempt | Base Delay | Jitter | Total Wait | Cumulative Time |
|---------|-----------|--------|------------|-----------------|
| 1 | - | - | 0s | 0s |
| 2 | 2s | 0-1s | 2-3s | 2-3s |
| 3 | 4s | 0-1s | 4-5s | 6-8s |
| FAIL | - | - | - | Max 8s total |

---

## 4. API Route Naming Conventions

### Problem
Epic 13 introduces new routes. Need consistency:
- `/rfp` vs `/rfps`?
- `/lead` vs `/leads`?

### Decision: **Use Plural Convention for Collections**

#### Rationale
- **Existing Pattern**:
  - `/v1/assessments` (backend/src/routes/assessment.routes.ts)
  - `/v1/documents` (backend/src/routes/document.routes.ts)
  - `/v1/vendors` (backend/src/routes/vendor.routes.ts)
- **REST Best Practice**: Plural for resource collections
- **Semantic Clarity**: `/rfps/:id` reads as "one of many RFPs"

#### Route Structure

**Story 13.1 (RFP Creation)**:
```typescript
// backend/src/routes/rfp.routes.ts
POST   /v1/rfps                    // Create RFP
GET    /v1/rfps                    // List user's RFPs
GET    /v1/rfps/:id                // Get single RFP
PATCH  /v1/rfps/:id                // Update RFP
DELETE /v1/rfps/:id                // Delete RFP
POST   /v1/rfps/:id/send           // Send RFP (Story 13.2)
GET    /v1/rfps/strategic-roadmap  // Get auto-population data
```

**Story 13.3 (Lead Tracking)**:
```typescript
// backend/src/routes/admin.routes.ts (add to existing)
GET    /v1/admin/leads             // List all leads (RFP + Basic)
GET    /v1/admin/leads/:id         // Get lead details
PATCH  /v1/admin/leads/:id/status  // Update lead status
GET    /v1/admin/leads/export      // CSV export
```

**Server Registration**:
```typescript
// backend/src/server.ts (add after line 280)
await server.register(rfpRoutes, { prefix: '/v1' });
```

---

## 5. File Upload Size Limits

### Problem
Mismatch between server limit and document service validation:
- `server.ts:122`: 10MB max file size
- `document.service.ts:31`: 50MB validation

**Result**: Files 10-50MB pass document validation but fail at server level.

### Decision: **Standardize to 10MB Maximum**

#### Rationale
- **Server Constraint**: Fastify multipart plugin enforces 10MB (line 122)
- **Performance**: 10MB is sufficient for most documents (PDFs, Word docs)
- **Storage Cost**: Smaller files reduce S3/Replit Object Storage costs
- **User Experience**: Clear error message better than silent failure
- **Existing Behavior**: Frontend already assumes 10MB (no issues reported)

#### Changes Required

**Story 13.1 - Update RFP Document Upload Validation**:
```typescript
// backend/src/services/rfp.service.ts
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (matches server.ts:122)

const RFPDocumentSchema = z.object({
  filename: z.string(),
  size: z.number().min(1).max(MAX_FILE_SIZE, 'File size must not exceed 10MB'),
  mimetype: z.enum(ALLOWED_MIME_TYPES),
  data: z.instanceof(Buffer)
});
```

**Document Service - Update Validation** (separate ticket):
```typescript
// backend/src/services/document.service.ts:31
// CHANGE FROM:
size: z.number().min(1).max(50 * 1024 * 1024), // 50MB max

// CHANGE TO:
size: z.number().min(1).max(10 * 1024 * 1024), // 10MB max (matches server.ts multipart limit)
```

#### Frontend Error Message
```typescript
// frontend/src/components/rfp/RFPDocumentUpload.tsx
const validateFile = (file: File) => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  if (file.size > MAX_SIZE) {
    return `File "${file.name}" exceeds 10MB limit`;
  }

  // ... other validations
};
```

---

## 6. Enum Simplification

### Problem
Story 13.3 introduces `LeadStatus` enum that duplicates `RFPStatus`:

```prisma
enum RFPStatus {
  DRAFT
  SENT
  ARCHIVED
}

enum LeadStatus {
  NEW           // Same as SENT
  IN_PROGRESS   // Custom admin workflow
  QUALIFIED     // Custom admin workflow
  CONVERTED     // Custom admin workflow
  LOST          // Same as ARCHIVED
}
```

**Issue**: Confusion about which status to use, potential sync issues.

### Decision: **Keep Both Enums, Clarify Purposes**

#### Rationale
- **Different Domains**:
  - `RFPStatus`: User-facing workflow state (DRAFT → SENT → ARCHIVED)
  - `LeadStatus`: Admin sales funnel state (NEW → IN_PROGRESS → QUALIFIED → CONVERTED)
- **One-to-Many Relationship**: One RFP can have multiple status transitions in admin funnel
- **No Synchronization Needed**: They track different lifecycle stages

#### Mapping Logic

**Story 13.3 - Lead Creation from RFP**:
```typescript
// backend/src/services/lead.service.ts
private mapRFPToLeadStatus(rfpStatus: RFPStatus): LeadStatus {
  switch (rfpStatus) {
    case 'SENT':
      return 'NEW';        // Initial lead state when RFP sent
    case 'ARCHIVED':
      return 'LOST';       // User archived RFP = lead lost
    case 'DRAFT':
      return null;         // Don't create leads for drafts
    default:
      return 'NEW';
  }
}

async getLeads(filters: LeadFilters): Promise<Lead[]> {
  // Only fetch RFPs with status SENT (not drafts)
  const rfps = await this.prisma.rFP.findMany({
    where: {
      status: 'SENT',  // Filter out drafts
      ...(filters.leadStatus && { leadStatus: filters.leadStatus })
    }
  });

  return rfps.map(rfp => ({
    id: rfp.id,
    type: 'PREMIUM',
    leadStatus: rfp.leadStatus || 'NEW',  // Default to NEW if null
    rfpStatus: rfp.status,                // Show both for admin context
    // ... other fields
  }));
}
```

#### Status Update Independence

**Admin updates leadStatus without affecting rfpStatus**:
```typescript
// PATCH /v1/admin/leads/:id/status
async updateLeadStatus(leadId: string, newStatus: LeadStatus) {
  await this.prisma.rFP.update({
    where: { id: leadId },
    data: { leadStatus: newStatus }  // Only update leadStatus field
    // rfpStatus remains unchanged
  });
}
```

---

## 7. Authorization Pattern

### Problem
Story 13.1, 13.4 RFP endpoints need ownership validation. Without checks:
- User A could access User B's RFPs
- User A could delete User B's RFPs

**Security Risk**: CRITICAL vulnerability (IDOR - Insecure Direct Object Reference)

### Decision: **Centralized Authorization Helper**

#### Rationale
- **DRY Principle**: Every RFP endpoint needs same check
- **Consistency**: Reduces risk of forgetting checks
- **Auditability**: Single place to review authorization logic
- **Existing Pattern**: `assessment.service.ts` uses similar approach

#### Implementation

**Story 13.1 - Add to rfp.service.ts**:
```typescript
// backend/src/services/rfp.service.ts
export class RFPService extends BaseService {
  /**
   * Authorizes RFP access for the requesting user
   * @throws Error if RFP not found or user doesn't own it
   */
  private async authorizeRFPAccess(
    rfpId: string,
    userId: string,
    includeRelations?: { contacts?: boolean; organization?: boolean }
  ): Promise<RFP> {
    const rfp = await this.prisma.rFP.findUnique({
      where: { id: rfpId },
      include: includeRelations
    });

    if (!rfp) {
      throw new Error('RFP not found');
    }

    if (rfp.userId !== userId) {
      await this.logAudit({
        userId,
        action: 'UNAUTHORIZED_RFP_ACCESS',
        resourceType: 'RFP',
        resourceId: rfpId,
        metadata: { ownerId: rfp.userId }
      });

      throw new Error('Access denied - you do not own this RFP');
    }

    return rfp;
  }

  // Use in all endpoints
  async getRFP(rfpId: string, userId: string) {
    return this.authorizeRFPAccess(rfpId, userId, {
      contacts: true,
      organization: true
    });
  }

  async updateRFP(rfpId: string, userId: string, data: UpdateRFPInput) {
    await this.authorizeRFPAccess(rfpId, userId); // Throws if unauthorized

    return this.prisma.rFP.update({
      where: { id: rfpId },
      data
    });
  }

  async deleteRFP(rfpId: string, userId: string) {
    const rfp = await this.authorizeRFPAccess(rfpId, userId, { contacts: true });

    // ... deletion logic (see Section 1)
  }

  async sendRFP(rfpId: string, userId: string) {
    const rfp = await this.authorizeRFPAccess(rfpId, userId, { organization: true });

    // ... send logic (see Section 2)
  }
}
```

#### Route Handler Pattern
```typescript
// backend/src/routes/rfp.routes.ts
server.get<{ Params: { id: string } }>(
  '/rfps/:id',
  {
    onRequest: [server.authenticate, requireUser],  // JWT + User role check
    schema: { /* ... */ }
  },
  async (request, reply) => {
    const rfpId = request.params.id;
    const userId = request.user.id;  // From JWT token

    // Service handles authorization check
    const rfp = await server.rfpService.getRFP(rfpId, userId);

    return reply.send({ success: true, data: rfp });
  }
);
```

---

## 8. Rate Limiting Strategy

### Problem
Story 13.6 contact form needs rate limiting:
- Prevent spam/abuse (3 contacts per user per 24 hours)
- Don't block legitimate Premium RFP contacts

**Current State**: Global rate limiter exists (100 req/min, `server.ts:140-154`)

### Decision: **Per-User, Per-Endpoint Rate Limiting with Redis**

#### Rationale
- **Scalability**: In-memory Map doesn't work across multiple servers
- **Redis Already Available**: `backend/docker-compose.yml` has Redis service
- **Granular Control**: Different limits for different endpoints
- **Existing Pattern**: Redis used for session management

#### Implementation

**Story 13.6 - Create Middleware**:
```typescript
// backend/src/middleware/rate-limit-contacts.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { Redis } from 'ioredis';

const CONTACT_LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function rateLimitContactsMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  redis: Redis
) {
  const userId = request.user.id;
  const key = `rate-limit:contact:${userId}`;

  // Get current count
  const current = await redis.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= CONTACT_LIMIT) {
    // Check if window expired
    const ttl = await redis.ttl(key);
    const resetIn = ttl > 0 ? Math.ceil(ttl / 3600) : 0;

    return reply.code(429).send({
      success: false,
      message: `You've reached the daily limit of ${CONTACT_LIMIT} vendor contacts. Resets in ${resetIn} hours.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: resetIn * 3600
    });
  }

  // Increment counter
  const newCount = await redis.incr(key);

  // Set expiry on first request
  if (newCount === 1) {
    await redis.expire(key, Math.floor(WINDOW_MS / 1000));
  }

  // Add headers
  reply.header('X-RateLimit-Limit', CONTACT_LIMIT);
  reply.header('X-RateLimit-Remaining', Math.max(0, CONTACT_LIMIT - newCount));
}
```

**Server Setup**:
```typescript
// backend/src/server.ts (add after line 100)
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Decorate server with redis client
server.decorate('redis', redis);
```

**Route Application** (Story 13.6):
```typescript
// backend/src/routes/vendor.routes.ts
// MODIFY existing POST /:id/contact endpoint (line 518)
server.post<{ Params: { id: string }; Body: ContactVendorRequest }>(
  '/:id/contact',
  {
    onRequest: [
      server.authenticate,
      requireUser,
      // REMOVE: requirePremium (allow Free users)
      // ADD: Rate limiting for Free users only
      async (request, reply) => {
        // Check if user is Premium
        const subscription = await server.prisma.subscription.findUnique({
          where: { userId: request.user.id }
        });

        const isPremium = subscription?.plan === 'PREMIUM' && subscription?.status === 'ACTIVE';

        // Only rate limit Free users
        if (!isPremium) {
          await rateLimitContactsMiddleware(request, reply, server.redis);
        }
      }
    ],
    schema: { /* ... existing schema ... */ }
  },
  async (request, reply) => {
    // ... existing contactVendor logic ...
  }
);
```

#### Rate Limiting Matrix

| User Tier | Endpoint | Limit | Window | Notes |
|-----------|----------|-------|--------|-------|
| FREE | POST /vendor/:id/contact | 3 | 24h | Story 13.6 |
| PREMIUM | POST /vendor/:id/contact | ∞ | - | No limit |
| ALL | POST /rfps/:id/send | 1/min | 1min | Prevent accidental double-send |
| ALL | Global | 100 | 1min | Existing `server.ts:140-154` |

---

## 9. Implementation Priority

### Priority 1: CRITICAL (Security & Data Integrity)
**Must be fixed before any code implementation**

1. **Add Authorization Checks** (Story 13.1, 13.4)
   - Create `authorizeRFPAccess()` helper
   - Apply to all RFP endpoints
   - Add audit logging for unauthorized attempts

2. **Add Cascade Delete** (Story 13.1)
   - Update VendorContact model with rfpId field
   - Add `onDelete: Cascade` relation
   - Create database migration

3. **Fix Empty Vendor List** (Story 13.1)
   - Update CreateRFPSchema with `.min(1)` validation
   - Add frontend validation

### Priority 2: HIGH (Reliability & User Experience)
**Should be implemented in initial release**

4. **Email Notification for Existing Contact Endpoint** (Story 13.6)
   - Update `vendor.service.ts:738-789` to send email
   - Use existing email template or create new one

5. **Transaction Boundaries** (Story 13.2)
   - Wrap RFP send logic in transactions
   - Handle partial email failures
   - Update RFP status based on results

6. **Exponential Backoff** (Story 13.2)
   - Update `email.service.ts:122-142` with delay logic
   - Add jitter to prevent thundering herd

7. **Rate Limiting Middleware** (Story 13.6)
   - Create Redis-based rate limiter
   - Apply to contact endpoint (Free users only)
   - Remove Premium requirement from existing endpoint

### Priority 3: MEDIUM (Polish & Optimization)
**Can be addressed in follow-up PRs**

8. **File Upload Size Standardization** (Story 13.1)
   - Update `document.service.ts:31` to 10MB
   - Add clear error messages

9. **Route Registration** (Story 13.1)
   - Add rfp.routes.ts to `server.ts:280`

10. **Enum Documentation** (Story 13.3)
    - Add comments explaining RFPStatus vs LeadStatus
    - Document mapping logic

### Priority 4: LOW (Nice-to-Have)
**Optional enhancements for future iterations**

11. **Soft Deletes for Organizations** (Not in current stories)
12. **Email Template Improvements** (Use existing templates)
13. **Advanced Lead Analytics** (Beyond Story 13.3 scope)

---

## Summary: Key Changes to Stories

### Story 13.1 Updates Required
1. Add `authorizeRFPAccess()` helper to service
2. Add VendorContact.rfpId cascade delete to Prisma schema
3. Update CreateRFPSchema with `.min(1)` validation on vendorIds
4. Standardize file upload to 10MB
5. Add RFPStatus.FAILED to enum

### Story 13.2 Updates Required
1. Add transaction boundaries (3 transactions: contacts, emails, status)
2. Add exponential backoff to email retry logic
3. Add partial failure handling
4. Add RFPStatus.FAILED for total email failure

### Story 13.3 Updates Required
1. Add documentation clarifying LeadStatus vs RFPStatus
2. Add status mapping logic

### Story 13.6 Updates Required
1. **MODIFY** (not create) existing POST /vendor/:id/contact
2. Remove Premium requirement
3. Add Redis-based rate limiting (Free users only)
4. Add email notification to existing contactVendor() method

### Epic 13 File Updates Required
1. Update total effort estimate (43-49 hours → 45-51 hours)
2. Add architectural decisions reference

---

## References

- Deep Analysis: `.ai/epic-13-deep-analysis-issues.md`
- Codebase Review: `.ai/epic-13-codebase-review.md`
- Epic Definition: `docs/prd/epic-13-rfp-vendor-engagement.md`
- Stories: `docs/stories/13.1.rfp-form-auto-population.story.md` through `13.6.contact-form-basic-lead.story.md`
- Existing Code:
  - `backend/prisma/schema.prisma` (cascade delete patterns)
  - `backend/src/services/vendor.service.ts:738-789` (contact creation pattern)
  - `backend/src/services/email.service.ts:122-142` (retry logic)
  - `backend/src/server.ts:122` (file upload limit)
  - `backend/src/middleware/rbac.middleware.ts:169` (incomplete requirePremium)

---

**Document Status**: ✅ FINAL - Ready for Story Updates
**Next Action**: Update Stories 13.1-13.6 with architectural decisions
