# Low-Confidence Questions Feature - Handover Document

**Date:** October 12, 2025  
**Feature:** Interactive Low-Confidence Questions System for Risk Assessment Engine  
**Status:** 🔴 IN PROGRESS - Critical Bug Blocking Completion

---

## 📋 Executive Summary

This document details the implementation of the **low-confidence questions feature** for the Heliolus risk assessment engine, which allows users to manually answer questions that the AI couldn't answer from uploaded documents. While the feature is nearly complete, there is a **critical backend bug preventing the results page from loading**.

---

## ✅ What Was Completed Successfully

### 1. **Low-Confidence Detection Logic** ✅
- Questions are marked as low-confidence when:
  - AI score is 0/5, OR
  - Explanation contains "no evidence" or "insufficient"
- Successfully identifies all 24 questions in test assessment as low-confidence

### 2. **Frontend UI Components** ✅
- **Location:** `frontend/src/pages/AssessmentResults.tsx`
- **Features Implemented:**
  - Expandable orange alert card showing low-confidence questions count
  - Grouped questions by section with visual separation
  - Text input fields for each question
  - "Update Answers" button to submit manual responses
  - Proper state management with React useState/useEffect
  - Loading states during answer updates
  - Success/error toast notifications

### 3. **Backend Answer Update Endpoint** ✅
- **Location:** `backend/src/routes/assessment.routes.ts`
- **Endpoint:** `POST /v1/assessments/:id/answers/update`
- **Features:**
  - Accepts array of `{ questionId, answer }` objects
  - Validates all answers are provided before updating
  - Uses `answerService` (not direct Prisma) for database operations
  - Updates only `explanation`, `score`, and `status` fields
  - Includes comprehensive step-by-step logging with `[UPDATE-ANSWERS]` prefix
  - Returns updated count on success

### 4. **Database Architecture** ✅
- Gaps are successfully created in database (24 CRITICAL gaps per test)
- Risk score calculation works (returns 42 for test assessment)
- All data is persisted correctly in PostgreSQL

---

## 🔴 Critical Bug - Results Page Not Loading

### **Error Details**

**Error Message:**
```
TypeError: Cannot read properties of undefined (reading 'Gap')
at /home/runner/workspace/backend/src/routes/assessment.routes.ts:806:48
```

**Error Location:** Line 806 in `backend/src/routes/assessment.routes.ts`

**Failing Code:**
```typescript
// Line 806 - FAILS because request.server.prisma is undefined
const gaps = await request.server.prisma.Gap.findMany({
  where: { assessmentId: params.id },
  orderBy: [{ severity: 'desc' }, { priority: 'desc' }],
});

const risks = await request.server.prisma.Risk.findMany({
  where: { assessmentId: params.id },
  orderBy: { riskLevel: 'desc' },
});
```

### **Root Cause**

The code attempts to bypass `FreemiumService` filtering (which removes gaps/risks for FREE users) by directly querying the database. However, **`request.server.prisma` is undefined** in this route context.

### **Why Direct Queries Were Added**

The `getAssessmentById` service method applies freemium filtering:
```typescript
// In assessment.service.ts
const userSubscriptionStatus = await FreemiumService.getUserSubscriptionStatus(assessment.userId);
const filteredAssessment = FreemiumService.filterAssessmentResults(assessment, userSubscriptionStatus.subscriptionType);
```

For FREE users, this filtering **removes all gaps and risks**, leaving empty arrays even though the data exists in the database. The results page treats empty arrays as a failed load, hence the attempt to fetch directly.

### **Database Evidence**

Logs confirm gaps ARE created successfully:
```
[DEBUG] Database Query: INSERT INTO "public"."Gap" ... 
[params: ["cmgnwf8bm0001oa2p4u0ak1bn", "Governance & Controls", "Gap in...", "CRITICAL", "IMMEDIATE", ...]]
```

24 gaps with CRITICAL severity are inserted, but they're filtered out before reaching the frontend.

---

## 🔧 Implementation Details

### **Modified Files**

1. **`backend/src/routes/assessment.routes.ts`**
   - Added low-confidence answer fetching to `/assessments/:id/results` endpoint
   - Created `POST /assessments/:id/answers/update` endpoint
   - Attempted direct database queries to bypass freemium filtering (currently failing)

2. **`frontend/src/pages/AssessmentResults.tsx`**
   - Added `LowConfidenceQuestionsCard` component
   - Implemented answer update mutation with React Query
   - Added grouped question display by section
   - Connected to backend update endpoint

3. **`backend/src/services/answer.service.ts`**
   - Fixed to use `answerService` for all Answer operations (not direct Prisma)
   - Corrected `getAssessmentAnswers` call with `includeQuestionDetails: true`

### **Key Architectural Patterns**

```typescript
// CORRECT: Use answerService for Answer operations
const answersResult = await answerService.getAssessmentAnswers(
  assessmentId,
  { includeQuestionDetails: true },
  context
);

// INCORRECT: Don't use request.server.prisma directly
// request.server.prisma doesn't exist in this context
```

### **Data Flow**

1. **Assessment Execution:**
   - AI analyzes 24 questions
   - All receive score=0 (no evidence in documents)
   - 24 CRITICAL gaps created in database
   - Assessment marked COMPLETED with riskScore=42

2. **Results Page Load (FAILING):**
   - Fetches assessment via `getAssessmentById`
   - FreemiumService filters out gaps/risks for FREE users
   - Attempts direct database query to bypass filter
   - **FAILS:** `request.server.prisma` is undefined

3. **Low-Confidence Questions (READY but blocked):**
   - Frontend ready to display questions
   - Update endpoint implemented
   - Blocked by results page load failure

---

## 🛠️ Solutions to Consider

### **Option 1: Find Correct Prisma Access Method**
- Investigate how other routes in `assessment.routes.ts` access Prisma
- Use the same pattern for direct queries

### **Option 2: Modify FreemiumService Logic**
- Add exception for results page to skip filtering
- Keep gaps/risks for assessment detail view
- Apply filtering only for list views or reports

### **Option 3: Use Assessment Service Method**
- Create a new service method that bypasses freemium filtering
- Keep database access encapsulated in service layer
- Maintain separation of concerns

### **Option 4: Frontend Handles Empty Arrays**
- Modify frontend to not treat empty gaps/risks as error
- Show upgrade prompt when gaps exist but are filtered
- Load page successfully even with empty data

---

## 📊 Current Status

### ✅ Working
- Assessment execution and gap/risk creation
- Low-confidence question detection
- Frontend UI components
- Answer update endpoint logic (untested due to results page issue)
- Comprehensive logging system

### 🔴 Broken
- Results page load (`/assessments/:id/results` endpoint)
- Direct Prisma access via `request.server.prisma`
- Bypassing FreemiumService filtering

### ⏳ Blocked (Ready to Test)
- Low-confidence questions UI display
- Manual answer submission
- Re-analysis after user input

---

## 🧪 Testing Scenarios

### **Test Assessment:**
- **ID:** `cmgnwf8bm0001oa2p4u0ak1bn`
- **Template:** Financial Crime (24 questions)
- **User:** test-user-id (no subscription - FREE tier)
- **Documents:** Sample compliance documents uploaded
- **Result:** 24 low-confidence questions (all scored 0/5)

### **Expected Behavior (After Fix):**
1. Results page loads with riskScore=42
2. Orange low-confidence card shows "24 questions need your input"
3. User expands card to see grouped questions
4. User enters answers and clicks "Update Answers"
5. Backend updates Answer records with user input
6. User can trigger re-analysis with new data

---

## 📝 Code Patterns Discovered

### **Critical Patterns:**

1. **Answer Service Usage:**
   ```typescript
   // ALWAYS use answerService for Answer operations
   import { answerService } from '../services/answer.service';
   
   const result = await answerService.getAssessmentAnswers(
     assessmentId,
     { includeQuestionDetails: true },
     context
   );
   ```

2. **Status Values:**
   ```typescript
   // CORRECT enum values
   status: 'COMPLETE' | 'INCOMPLETE' | 'IN_PROGRESS'
   // NOT 'COMPLETED'
   ```

3. **Low-Confidence Detection:**
   ```typescript
   const isLowConfidence = (answer) => {
     const explanation = answer.explanation || '';
     const hasNoEvidence = explanation.toLowerCase().includes('no evidence') || 
                          explanation.toLowerCase().includes('insufficient');
     return answer.score === 0 || hasNoEvidence;
   };
   ```

---

## 📂 Important Files Reference

### Backend
- `backend/src/routes/assessment.routes.ts` - Results endpoint (line 806 has bug)
- `backend/src/services/assessment.service.ts` - Assessment logic
- `backend/src/services/answer.service.ts` - Answer operations
- `backend/src/services/freemium.service.ts` - Subscription filtering

### Frontend
- `frontend/src/pages/AssessmentResults.tsx` - Results page with low-confidence UI
- `frontend/src/types/assessment.ts` - TypeScript interfaces
- `frontend/src/lib/api.ts` - API client

### Logs
- Look for `[UPDATE-ANSWERS]` prefix for answer update debugging
- Look for `Failed to get assessment results` for results page errors

---

## 🎯 Next Steps

1. **Immediate Priority:** Fix Prisma access in results endpoint
   - Investigate correct Prisma access pattern in this route
   - Test with existing assessment ID: `cmgnwf8bm0001oa2p4u0ak1bn`

2. **Testing:** Once results page loads:
   - Verify 24 low-confidence questions display
   - Test manual answer submission
   - Validate answer updates persist to database

3. **Future Enhancements:**
   - Add re-analysis trigger after user answers
   - Implement confidence score display (0-1 scale)
   - Add section-level completion indicators

---

## 📞 Support Information

**Key Debugging Commands:**
```bash
# Check server logs
grep "Failed to get assessment results" /tmp/logs/*.log

# Check answer update logs
grep "\[UPDATE-ANSWERS\]" /tmp/logs/*.log

# Verify gaps in database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Gap\" WHERE \"assessmentId\" = 'cmgnwf8bm0001oa2p4u0ak1bn';"
```

**Assessment Execution Successful:**
- 24 questions processed
- 24 gaps created (all CRITICAL)
- Risk score: 42
- Status: COMPLETED
- Credits used: 24

**Current Blocker:**
- Results endpoint crashes trying to access `request.server.prisma.Gap`
- Error: `Cannot read properties of undefined (reading 'Gap')`
- Location: `backend/src/routes/assessment.routes.ts:806`

---

## 📖 Lessons Learned

1. **FreemiumService filters aggressively** - Removes all gaps/risks for FREE users, making results appear empty
2. **Prisma access varies by context** - `request.server.prisma` pattern doesn't work in all routes
3. **Service layer is authoritative** - Use service methods, not direct database access when possible
4. **Comprehensive logging is essential** - `[UPDATE-ANSWERS]` prefix made debugging much easier
5. **Frontend/backend structure mismatch** - Frontend expects nested response, backend returns flat (already adjusted)

---

**End of Handover Document**
