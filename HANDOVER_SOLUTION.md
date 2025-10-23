# Low-Confidence Questions Bug - Solution Document

**Date:** October 12, 2025  
**Issue:** Results page failing with "Cannot read properties of undefined (reading 'Gap')"  
**Status:** 🟡 SOLUTION IDENTIFIED - Needs Implementation

---

## 🔍 Root Cause Analysis

### **The Problem**
The `/assessments/:id/results` endpoint attempts to bypass FreemiumService filtering by directly querying the database:

```typescript
// ❌ INCORRECT - request.server.prisma doesn't exist
const gaps = await request.server.prisma.Gap.findMany({
  where: { assessmentId: params.id },
  orderBy: [{ severity: 'desc' }, { priority: 'desc' }],
});
```

### **Why This Fails**
1. **Prisma is NOT available as `request.server.prisma`** in route context
2. In services, Prisma is accessed as `this.prisma` (class property)
3. Routes should use **service methods**, not direct database access

### **The Real Issue: FreemiumService Filtering**
The `getAssessmentById` service method filters results for FREE users:
```typescript
// In assessment.service.ts - line ~850
const userSubscriptionStatus = await FreemiumService.getUserSubscriptionStatus(assessment.userId);
const filteredAssessment = FreemiumService.filterAssessmentResults(
  assessment, 
  userSubscriptionStatus.subscriptionType
);
```

For FREE tier users, `filterAssessmentResults` **removes all gaps and risks**, returning:
```typescript
{
  id: "...",
  riskScore: 42,
  status: "COMPLETED",
  gaps: [],      // ← FILTERED OUT
  risks: [],     // ← FILTERED OUT
  // ... other fields
}
```

The frontend treats empty arrays as a load failure, hence the attempt to fetch directly.

---

## ✅ Recommended Solutions (Pick One)

### **Solution 1: Add Unfiltered Service Method** ⭐ RECOMMENDED

Create a new service method that bypasses freemium filtering for the results page:

```typescript
// In backend/src/services/assessment.service.ts

async getAssessmentResultsUnfiltered(
  id: string,
  context?: ServiceContext
): Promise<ApiResponse<AssessmentWithDetails>> {
  try {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, size: true, country: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        template: { select: { id: true, name: true, category: true } },
        gaps: {
          select: {
            id: true,
            category: true,
            title: true,
            severity: true,
            priority: true,
          },
          orderBy: [{ severity: 'desc' }, { priority: 'desc' }],
        },
        risks: {
          select: {
            id: true,
            category: true,
            title: true,
            riskLevel: true,
          },
          orderBy: { riskLevel: 'desc' },
        },
      },
    });

    if (!assessment) {
      throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
    }

    // Check permissions
    if (context) {
      const isAdmin = context.userRole === 'ADMIN';
      const isOwner = context.userId === assessment.userId;
      const belongsToOrg = context.organizationId && context.organizationId === assessment.organizationId;

      if (!isAdmin && !isOwner && !belongsToOrg) {
        throw this.createError('Access denied', 403, 'FORBIDDEN');
      }
    }

    // NO FREEMIUM FILTERING - Return full data
    return this.createResponse(true, assessment);
  } catch (error) {
    if (error.statusCode) throw error;
    this.handleDatabaseError(error, 'getAssessmentResultsUnfiltered');
  }
}
```

Then update the route:
```typescript
// In backend/src/routes/assessment.routes.ts - line ~785

// Replace getAssessmentById with new method
const result = await assessmentService.getAssessmentResultsUnfiltered(
  params.id,
  { userId: user.id, userRole: user.role, organizationId: user.organizationId }
);

const assessment = result.data;
const gaps = assessment.gaps || [];
const risks = assessment.risks || [];
// ... rest of code continues
```

**Pros:**
- ✅ Maintains service layer separation of concerns
- ✅ Keeps database logic encapsulated
- ✅ Reusable for other endpoints
- ✅ Maintains permission checks

**Cons:**
- ➖ Bypasses subscription-based filtering (intentional for results page)

---

### **Solution 2: Conditional Filtering in Existing Method**

Modify `getAssessmentById` to accept a flag for skipping freemium filter:

```typescript
// In backend/src/services/assessment.service.ts

async getAssessmentById(
  id: string,
  context?: ServiceContext,
  options?: { skipFreemiumFilter?: boolean }  // ← NEW
): Promise<ApiResponse<AssessmentWithDetails>> {
  // ... existing code ...

  // Apply freemium filtering based on user subscription (CONDITIONAL)
  if (!options?.skipFreemiumFilter) {
    const userSubscriptionStatus = await FreemiumService.getUserSubscriptionStatus(assessment.userId);
    const filteredAssessment = FreemiumService.filterAssessmentResults(assessment, userSubscriptionStatus.subscriptionType);
    return this.createResponse(true, filteredAssessment);
  }

  return this.createResponse(true, assessment);
}
```

Then in route:
```typescript
const result = await assessmentService.getAssessmentById(
  params.id,
  { userId: user.id, userRole: user.role, organizationId: user.organizationId },
  { skipFreemiumFilter: true }  // ← Skip filtering for results page
);
```

**Pros:**
- ✅ Minimal code changes
- ✅ Single method for all assessment fetching

**Cons:**
- ➖ Adds complexity to existing method
- ➖ Might confuse when to use flag

---

### **Solution 3: Frontend Handles Filtered Results**

Instead of fighting the filter, make the frontend work with filtered data:

```typescript
// In frontend/src/pages/AssessmentResults.tsx

if (!data?.assessment) {
  return <div>Loading...</div>;
}

// Check if results are filtered (empty gaps but completed assessment)
const isFiltered = data.assessment.status === 'COMPLETED' && 
                   data.gaps.length === 0 && 
                   data.assessment.riskScore > 0;

if (isFiltered) {
  return (
    <div className="p-6">
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Upgrade to View Detailed Results</AlertTitle>
        <AlertDescription>
          Your assessment is complete with a risk score of {data.assessment.riskScore}.
          Upgrade your subscription to view detailed gaps, risks, and recommendations.
        </AlertDescription>
      </Alert>
      <Button onClick={() => navigate('/upgrade')}>Upgrade Now</Button>
    </div>
  );
}

// Show normal results if not filtered
return (
  <>
    {data.lowConfidenceAnswers.length > 0 && (
      <LowConfidenceQuestionsCard questions={data.lowConfidenceAnswers} />
    )}
    {/* ... rest of results display ... */}
  </>
);
```

**Pros:**
- ✅ Respects subscription model
- ✅ Provides upgrade path
- ✅ No backend changes needed

**Cons:**
- ➖ Doesn't allow FREE users to see results (might be a business decision)
- ➖ Low-confidence questions feature blocked for free users

---

## 🎯 Recommended Implementation Path

**CHOOSE SOLUTION 1** for these reasons:

1. **Clear separation of concerns** - Results page explicitly needs unfiltered data
2. **Business logic makes sense** - Users should see results even on free tier, with upgrade prompts for advanced features
3. **Low-confidence questions work** - FREE users can manually improve their assessments
4. **Future-proof** - Easy to add filtering later if business requirements change

### **Step-by-Step Implementation:**

1. **Add new service method** (5 min)
   - Copy `getAssessmentById` logic
   - Remove freemium filtering section
   - Rename to `getAssessmentResultsUnfiltered`

2. **Update results route** (2 min)
   - Change service call to use new method
   - Remove broken `request.server.prisma` lines
   - Use `assessment.gaps` and `assessment.risks` directly

3. **Test** (5 min)
   - Load results page with assessment ID: `cmgnwf8bm0001oa2p4u0ak1bn`
   - Verify 24 gaps and risks display
   - Verify low-confidence questions card appears
   - Test manual answer submission

---

## 🧪 Testing Checklist

After implementing the fix:

- [ ] Results page loads without errors
- [ ] Risk score displays (should be 42)
- [ ] Gaps array has 24 items (all CRITICAL)
- [ ] Risks array has items
- [ ] Low-confidence questions card shows "24 questions need your input"
- [ ] Expanding card shows all questions grouped by section
- [ ] Entering answers and clicking "Update Answers" works
- [ ] Toast notification shows success
- [ ] Answer updates persist to database

---

## 📋 Code Changes Required

### **File 1: `backend/src/services/assessment.service.ts`**

Add after `getAssessmentById` method (~line 900):

```typescript
/**
 * Get assessment results without freemium filtering
 * Used for results page where users should see their full assessment data
 */
async getAssessmentResultsUnfiltered(
  id: string,
  context?: ServiceContext
): Promise<ApiResponse<AssessmentWithDetails>> {
  try {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            size: true,
            country: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        gaps: {
          select: {
            id: true,
            category: true,
            title: true,
            severity: true,
            priority: true,
          },
          orderBy: [{ severity: 'desc' }, { priority: 'desc' }],
        },
        risks: {
          select: {
            id: true,
            category: true,
            title: true,
            riskLevel: true,
          },
          orderBy: { riskLevel: 'desc' },
        },
      },
    });

    if (!assessment) {
      throw this.createError('Assessment not found', 404, 'ASSESSMENT_NOT_FOUND');
    }

    // Check permissions - allow access if user created the assessment OR belongs to the organization
    if (context) {
      const isAdmin = context.userRole === 'ADMIN';
      const isOwner = context.userId === assessment.userId;
      const belongsToOrg = context.organizationId && context.organizationId === assessment.organizationId;

      if (!isAdmin && !isOwner && !belongsToOrg) {
        throw this.createError('Access denied', 403, 'FORBIDDEN');
      }
    }

    // Return unfiltered results for results page
    return this.createResponse(true, assessment);
  } catch (error) {
    if (error.statusCode) throw error;
    this.handleDatabaseError(error, 'getAssessmentResultsUnfiltered');
  }
}
```

### **File 2: `backend/src/routes/assessment.routes.ts`**

Replace lines 785-814 with:

```typescript
    try {
      // Use unfiltered method to bypass freemium restrictions for results page
      const result = await assessmentService.getAssessmentResultsUnfiltered(
        params.id,
        { userId: user.id, userRole: user.role, organizationId: user.organizationId }
      );

      if (!result.success || !result.data) {
        reply.status(404).send({
          message: 'Assessment not found',
          code: 'ASSESSMENT_NOT_FOUND',
          statusCode: 404,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const assessment = result.data;
      const gaps = assessment.gaps || [];
      const risks = assessment.risks || [];

      // Fetch answers with low confidence (< 0.6) that need manual input
      let lowConfidenceAnswers: any[] = [];
      
      // ... rest of existing code continues ...
```

---

## 📊 Impact Assessment

### **What This Fixes:**
- ✅ Results page will load successfully
- ✅ All 24 gaps will be visible
- ✅ All risks will be visible
- ✅ Low-confidence questions card will appear
- ✅ Users can manually improve assessments

### **What This Changes:**
- ⚠️ FREE users now see full assessment results (gaps, risks, recommendations)
- ⚠️ Freemium filtering bypassed for results page only
- ⚠️ Other endpoints (lists, reports) still apply filtering

### **Business Considerations:**
- FREE users see value in the platform
- They can use low-confidence questions to improve results
- Upgrade prompts can be added to advanced features (PDF export, vendor matching, etc.)
- Results visibility encourages engagement vs. frustration

---

## 🔄 Alternative: If Business Wants FREE Filtering

If the business decision is to keep filtering for FREE users, then use **Solution 3** (frontend handles filtered results) with an upgrade prompt. This respects the freemium model but blocks the low-confidence questions feature for free users.

---

**End of Solution Document**

**Next Action:** Implement Solution 1 (recommended) or discuss with stakeholders which approach aligns with business goals.
