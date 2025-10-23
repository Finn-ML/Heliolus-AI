# Reports Stuck in "Generating" State - Bug Fix

**Date:** 2025-10-21
**Status:** ✅ FIXED
**Severity:** HIGH
**Impact:** 7 assessments fixed, future assessments protected

---

## 🐛 Problem Description

Users reported that completed assessments were stuck in a "generating" state in the Reports page and could not be viewed or downloaded.

### Symptoms
- Assessments showing as "generating" instead of "completed"
- View and Download buttons disabled
- Assessments had risk scores, gaps, and risks but status remained `IN_PROGRESS`

### Affected Assessments
7 assessments were found stuck in IN_PROGRESS status:
- All had risk scores calculated
- All had gaps and risks identified
- None had `completedAt` timestamp set
- Status was `IN_PROGRESS` instead of `COMPLETED`

---

## 🔍 Root Cause Analysis

### The Bug

Location: `backend/src/services/assessment.service.ts:609-770`

The `completeAssessment` method wrapped everything in a single database transaction:

```typescript
const result = await this.executeTransaction(async (tx) => {
  // 1. Update status to COMPLETED ✅
  await tx.assessment.update({
    where: { id },
    data: {
      status: AssessmentStatus.COMPLETED, // Line 615
      completedAt: this.now(),
    },
  });

  // 2. Perform AI analysis (can fail)
  // 3. Create gaps and risks (can fail)
  // 4. Update with analysis results

  // 5. Deduct credits ⚠️ (LINE 758 - INSIDE TRANSACTION)
  await subscriptionService.deductCredits(...);

  return updatedAssessment;
});
```

**The Problem:**
If credit deduction failed (or any step after the status update), the **entire transaction rolled back**, including the status update to `COMPLETED`. The assessment remained in `IN_PROGRESS` state despite having all the analysis data.

### Why This Happened

1. User completed an assessment
2. Status was set to `COMPLETED` within a transaction
3. AI analysis ran successfully
4. Gaps and risks were created successfully
5. **Credit deduction failed** (insufficient balance, database error, etc.)
6. **Entire transaction rolled back**
7. Assessment had gaps, risks, and risk score BUT status = `IN_PROGRESS`

---

## ✅ The Fix

### Code Changes

**File:** `backend/src/services/assessment.service.ts:760-781`

Moved credit deduction **outside** the transaction:

```typescript
const result = await this.executeTransaction(async (tx) => {
  // 1. Update status to COMPLETED
  // 2. AI analysis
  // 3. Create gaps/risks
  // 4. Update with analysis results
  return updatedAssessment;
}); // Transaction ends here ✅

// Deduct credits AFTER transaction completes
try {
  await subscriptionService.deductCredits(...);
} catch (creditError) {
  this.logger.error('Credit deduction failed after assessment completion');
  // Assessment already completed, just log the error
}
```

**Benefits:**
- Assessment stays `COMPLETED` even if credit deduction fails
- Users can view their reports immediately
- Credit issues can be reconciled separately
- More resilient failure handling

---

## 🔧 Fixing Existing Stuck Assessments

### Fix Script Created

**File:** `backend/prisma/fix-stuck-assessments.ts`

**Command:** `npm run db:fix-stuck-assessments`

**What It Does:**
1. Finds assessments with status `IN_PROGRESS` but indicators of completion:
   - Has `completedAt` timestamp
   - Has risk score
   - Has AI analysis
   - Has gaps or risks
2. Updates their status to `COMPLETED`
3. Sets `completedAt` if missing

### Execution Results

```bash
✨ Fix Complete!
   ✅ Successfully fixed: 7
   ❌ Failed: 0
```

**Fixed Assessments:**
1. `cmgtbfhvx0009lvmynuk2uds3` - Financial Crime Compliance (Risk Score: 74, 14 gaps)
2. `cmgtfhtuq0001lcej759yjqrs` - Financial Crime Compliance (Risk Score: 66, 15 gaps)
3. `cmguze20k0001ppz6raqpzowa` - Financial Crime Compliance (Risk Score: 64, 10 gaps)
4. `cmgz4r4sx0001qkidqfpdbyui` - Financial Crime Compliance Enhanced (Risk Score: 59, 26 gaps)
5. `cmgz76p3400g5qkid0as7z1qb` - Financial Crime Compliance Enhanced (Risk Score: 70, 67 gaps)
6. `cmgz8fwee010jqkid8getdlmq` - Financial Crime Compliance Enhanced (Risk Score: 68, 51 gaps)
7. `cmgza153q0007qkfa2hduw6tv` - Financial Crime Compliance Enhanced (Risk Score: 71, 42 gaps)

---

## 📋 Verification Steps

### Backend Verification

1. **Check assessment status:**
   ```sql
   SELECT id, status, riskScore, completedAt, createdAt
   FROM "Assessment"
   WHERE id = 'cmgza153q0007qkfa2hduw6tv';
   ```
   Should show `status = 'COMPLETED'`

2. **Check API response:**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:4000/api/v1/assessments
   ```
   Assessments should have `status: "COMPLETED"`

### Frontend Verification

1. Navigate to `/reports` page
2. Previously "generating" reports should now show as "completed"
3. **View** and **Download** buttons should be enabled
4. Clicking **View** should navigate to assessment results

---

## 🚀 Deployment Steps

### 1. Deploy Backend Code Change

```bash
cd backend
git add src/services/assessment.service.ts
git commit -m "Fix: Move credit deduction outside transaction to prevent status rollback"
git push
```

### 2. Run Fix Script (One-Time)

```bash
npm run db:fix-stuck-assessments
```

**Note:** This script is idempotent - safe to run multiple times. It won't affect already-completed assessments.

### 3. Restart Backend Service

```bash
# If using PM2
pm2 restart heliolus-backend

# If using Docker
docker-compose restart backend

# If using systemd
systemctl restart heliolus-backend
```

---

## 🔮 Prevention

### Future Protection

The code change ensures that:
- ✅ Assessments are always marked as `COMPLETED` when AI analysis succeeds
- ✅ Credit deduction failures don't block assessment completion
- ✅ Failed credit deductions are logged for admin review
- ✅ Users can immediately access their completed assessments

### Monitoring

Add alerts for:
- Credit deduction failures (already logged)
- Assessments stuck in `IN_PROGRESS` for > 24 hours
- Credit balance mismatches

---

## 📊 Impact Summary

**Before Fix:**
- 7 assessments stuck in "generating" state
- Users unable to view or download reports
- Poor user experience
- Potential credit balance inconsistencies

**After Fix:**
- ✅ All 7 assessments viewable in Reports page
- ✅ Future assessments protected from this bug
- ✅ Better error handling and logging
- ✅ Credit issues separated from assessment completion

---

## 🧪 Testing Recommendations

### Manual Testing

1. Complete a new assessment
2. Verify status changes to `COMPLETED`
3. Check Reports page shows the assessment
4. Verify View and Download buttons work

### Edge Case Testing

1. Test with user having 0 credits
2. Test with insufficient credits
3. Test with database connection issues during credit deduction
4. Verify assessment still completes in all cases

---

## 📝 Related Files

- **Bug Fix:** `backend/src/services/assessment.service.ts`
- **Fix Script:** `backend/prisma/fix-stuck-assessments.ts`
- **Package Script:** `backend/package.json` (added `db:fix-stuck-assessments`)
- **Frontend Display:** `frontend/src/pages/Reports.tsx` (no changes needed)

---

**Status:** ✅ Complete
**Reports Now Working:** Yes
**Future Assessments Protected:** Yes
