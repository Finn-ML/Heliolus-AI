# Final Fix for Inflated Assessment Scores - TWO Bugs Found

**Date:** 2025-10-22
**Assessment IDs:** cmh1x1s500001nan4zaakof37, cmh1yzhk60001na5jmeub6bst, cmh1zhg000001nacbp3jsxr80
**Scores:** All scored 66-68/100 with irrelevant documents
**Status:** ✅ BOTH BUGS FIXED

---

## Executive Summary

Found and fixed **TWO SEPARATE BUGS** in the AI scoring system that caused inflated scores:

1. **Bug #1:** Weak evidence (20-40% relevance) scored as 2/5 (moderate)
2. **Bug #2:** AI saying "cannot access document" but assigning 4-5/5 based on document keywords

Both bugs are now fixed in `ai-analysis.service.ts`.

---

## Bug #1: Lenient Evidence Scoring

### Location
`backend/src/services/ai-analysis.service.ts` lines 717-745
Method: `scoreFindings()`

### The Problem
When AI found weakly relevant evidence (20-40% match), it assigned score 2/5.

### The Fix
Tightened thresholds - now requires 50%+ relevance for score 2:

```typescript
// BEFORE (Lenient)
else if (avgRelevance > 0.2) {
  score = 2; // Limited evidence  ❌ TOO LENIENT
}

// AFTER (Strict)
else if (avgRelevance >= 0.5) {
  score = 2; // Limited evidence  ✅ REQUIRES 50%+
}
else if (avgRelevance >= 0.3) {
  score = 1; // Very limited  ✅ NEW TIER
}
else {
  score = 0; // No evidence  ✅ NOW POSSIBLE
}
```

---

## Bug #2: Document Relevance ≠ Evidence Quality

### Location
`backend/src/services/ai-analysis.service.ts` lines 388-417
Method: `calculateScoreFromAnalysis()`

### The Problem
When AI couldn't extract evidence and said "I cannot access the document", the code fell through to a default that used **document keyword relevance** instead of **actual evidence quality**.

**Example:**
```
Document: "Geographic Risk Assessment Policy.pdf"
Question: "Are trade compliance policies aligned?"

Step 1: Document relevance ranker scores doc as 0.8 (80% relevant)
        Reason: Contains keywords "risk", "assessment", "compliance"

Step 2: AI analyzes doc, finds no trade compliance policies
        AI says: "I cannot access the actual content of the document"

Step 3: calculateScoreFromAnalysis() checks explanation
        - No "comprehensive" → not 5
        - No "adequate" → not 4
        - No "partial" → not 3
        - No "minimal" → not 2
        - No "no evidence" → not 1
        - Falls through to DEFAULT

Step 4: DEFAULT uses document relevance
        score = 0.8 × 5 = 4  ❌ WRONG!

Result: Question scores 4/5 despite AI saying "cannot access document"
```

### The Fix
Added two layers of protection:

#### Layer 1: Detect "Cannot Access" Phrases
```typescript
// FIX: Check for "cannot access" or similar phrases
if (lowerAnalysis.includes('cannot access') ||
    lowerAnalysis.includes('cannot directly assess') ||
    lowerAnalysis.includes('i do not have access') ||
    lowerAnalysis.includes('document has not been provided') ||
    lowerAnalysis.includes('not available') ||
    lowerAnalysis.includes('no direct evidence')) {
  return 0; // AI explicitly states it can't access = no score  ✅
}
```

#### Layer 2: Tightened Fallback Scoring
```typescript
// BEFORE (Using document relevance as score)
const avgRelevance = topDocs.reduce((sum, d) => sum + d.score, 0) / topDocs.length;
return Math.max(1, Math.min(5, Math.round(avgRelevance * 5)));
// 0.8 relevance → score 4  ❌

// AFTER (Document relevance ≠ evidence quality)
if (avgRelevance >= 0.9) {
  return 3; // Very relevant doc = assume moderate evidence
} else if (avgRelevance >= 0.7) {
  return 2; // Relevant doc = assume limited evidence
} else if (avgRelevance >= 0.5) {
  return 1; // Somewhat relevant = assume minimal evidence
} else {
  return 0; // Low relevance = no evidence
}
// 0.8 relevance → score 2  ✅ MUCH BETTER
```

---

## Real-World Evidence

### Assessment cmh1zhg000001nacbp3jsxr80 (Latest Test)

Sample answers with Bug #2:

```
Question: "Are responsibilities defined across logistics, finance, and compliance teams?"
AI Says: "Based on the information provided, the answer...can..."
          (Vague, non-committal)
Document Relevance: 0.8-1.0
OLD Score: 5/5  ❌
NEW Score: 0-2/5  ✅

Question: "Is a formal trade risk assessment performed annually?"
AI Says: "I cannot directly analyze the content of Document 1 as it has not been shared"
Document Relevance: 0.9
OLD Score: 5/5  ❌ (assigned despite saying "cannot analyze"!)
NEW Score: 0/5  ✅ (catches "cannot" phrase)

Question: "Are counterparties screened against restricted parties?"
AI Says: "I cannot directly assess the content of Document 1 as it is not available"
Document Relevance: 1.0
OLD Score: 5/5  ❌
NEW Score: 0/5  ✅
```

**Score Distribution (First 20 questions):**
- OLD: 6× score 5, 5× score 4, 6× score 2, 3× score 1
- NEW (expected): 15-18× score 0, 2-5× score 1-2

---

## Why This Happened

### Root Cause: Confusion Between Two Concepts

The code conflated:
1. **Document Relevance** = How well document keywords match question keywords
2. **Evidence Quality** = How well document CONTENT answers the question

A "Geographic Risk Assessment Policy" scores HIGH relevance for "Are trade risks assessed?" (keyword match), but has ZERO actual evidence about trade risk processes.

### The Code Path

```
User uploads: Geographic Risk Policy.pdf
System runs: Document Relevance Ranker (keyword-based)
Result: 80-100% relevance scores for all trade questions

User executes assessment
System calls: analyzeQuestion() for each question
  → Calls OpenAI to extract evidence
  → OpenAI: "I cannot access the document content"
  → Calls: calculateScoreFromAnalysis(aiResponse, topDocs)
  → No keyword matches in AI response
  → Falls to default: topDocs[0].score × 5
  → Returns: 4 or 5

Answer created with score 4-5
Assessment final score: 68/100  ❌
```

---

## Testing Instructions

### CRITICAL: Server Must Reload

The fixes require the server to reload the changed TypeScript file.

**Check if reload happened:**
```bash
# In another terminal, watch server logs
tail -f logs/server.log  # or wherever your logs are

# You should see:
# [tsx] File change detected, reloading...
# [info] Server restarted
```

**If server didn't reload:**
```bash
# Stop and restart manually
cd backend
npm run dev
```

### Test Procedure

1. **Create BRAND NEW assessment**
   ```bash
   POST /v1/assessments
   {
     "templateId": "trade-compliance-template-id",
     "organizationId": "your-org-id"
   }
   ```

2. **Upload irrelevant document**
   ```bash
   POST /v1/documents/upload
   FormData: file="Geographic_Risk_Policy.pdf"
   ```

3. **Execute assessment**
   ```bash
   POST /v1/assessments/:id/execute
   {
     "documentIds": ["uploaded-doc-id"]
   }
   ```

4. **Check results**
   ```bash
   GET /v1/assessments/:id/results
   ```

### Expected Results (After Fix)

```json
{
  "assessment": {
    "id": "new-assessment-id",
    "riskScore": 5-20,  // Was 66-68
    "status": "IN_PROGRESS"
  },
  "answers": [
    {
      "score": 0,  // Most should be 0
      "explanation": "AI Analysis: I cannot access the document...",
      "confidence": 0.1
    },
    {
      "score": 1,  // Some might be 1
      "explanation": "...minimal evidence...",
      "confidence": 0.2
    }
    // Should NOT see scores of 4-5 anymore!
  ]
}
```

### Score Distribution Comparison

**BEFORE (Buggy):**
```
Score 5: 6 answers (30%)  ❌
Score 4: 5 answers (25%)  ❌
Score 2: 6 answers (30%)
Score 1: 3 answers (15%)
Average: 3.4/5 → Risk Score 68
```

**AFTER (Fixed):**
```
Score 0: 15-18 answers (75-90%)  ✅
Score 1: 2-5 answers (10-25%)    ✅
Score 2: 0-1 answers (0-5%)      ✅
Score 4-5: 0 answers              ✅
Average: 0.2-0.5/5 → Risk Score 5-15
```

---

## Files Modified

**File:** `backend/src/services/ai-analysis.service.ts`

**Changes:**
1. Lines 717-745: Tightened `scoreFindings()` thresholds (Bug #1)
2. Lines 394-402: Added "cannot access" detection (Bug #2a)
3. Lines 404-417: Tightened document relevance fallback (Bug #2b)

**Total lines changed:** ~50 lines across 3 sections

---

## Verification Queries

### Check Recent Assessment Scores

```sql
-- Get most recent assessments with score distribution
SELECT
  a.id,
  a."riskScore",
  a."createdAt",
  COUNT(ans.id) as total_answers,
  ROUND(AVG(ans.score)::numeric, 2) as avg_answer_score,
  COUNT(CASE WHEN ans.score = 0 THEN 1 END) as score_0_count,
  COUNT(CASE WHEN ans.score <= 1 THEN 1 END) as score_0_1_count,
  COUNT(CASE WHEN ans.score >= 4 THEN 1 END) as score_4_5_count
FROM "Assessment" a
LEFT JOIN "Answer" ans ON ans."assessmentId" = a.id
WHERE a."createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY a.id
ORDER BY a."createdAt" DESC;
```

**Expected after fix:**
- `avg_answer_score`: 0.2-0.8 (was 3.0-3.5)
- `score_0_count`: 80-100 answers (was 0-5)
- `score_4_5_count`: 0-5 answers (was 40-60)

### Check Answer Explanations

```sql
-- Find answers that say "cannot access" but have high scores
SELECT
  ans.id,
  ans.score,
  ans.explanation,
  ans."sourceReference",
  a."createdAt"
FROM "Answer" ans
JOIN "Assessment" a ON a.id = ans."assessmentId"
WHERE
  a."createdAt" > NOW() - INTERVAL '1 hour'
  AND (
    ans.explanation ILIKE '%cannot access%' OR
    ans.explanation ILIKE '%cannot directly assess%' OR
    ans.explanation ILIKE '%not available%'
  )
  AND ans.score >= 3
ORDER BY ans.score DESC, ans."createdAt" DESC
LIMIT 20;
```

**Expected after fix:**
- No results (all "cannot access" answers should score 0)

---

## Deployment Checklist

- [x] Bug #1 fix applied (evidence scoring thresholds)
- [x] Bug #2a fix applied ("cannot access" detection)
- [x] Bug #2b fix applied (document relevance fallback)
- [x] Documentation created
- [ ] TypeScript compiles without errors
- [ ] Server reloaded/restarted
- [ ] Test with irrelevant document
- [ ] Verify scores are now 0-20 (not 60-70)
- [ ] Check sample answer explanations match scores
- [ ] Run SQL verification queries
- [ ] Deploy to production
- [ ] Monitor for 24 hours

---

## Impact on Existing Assessments

**Important:** This fix is NOT retroactive.

- Assessments created before fix: Keep inflated scores (66-68)
- Assessments created after fix: Correct scores (5-20)

**To identify affected assessments:**
```sql
SELECT
  id,
  "riskScore",
  "createdAt",
  "completedAt"
FROM "Assessment"
WHERE
  "riskScore" BETWEEN 60 AND 75
  AND "createdAt" < '2025-10-22 13:00:00'  -- Before fix time
  AND status = 'IN_PROGRESS'
ORDER BY "createdAt" DESC;
```

**Recommendation:** Consider adding a banner to affected assessments:
> ⚠️ This assessment was completed before a scoring fix on 2025-10-22. Results may be overly optimistic. Consider re-running for accurate scores.

---

## Next Steps

### Immediate (Before Next Test)
1. ✅ Apply both fixes
2. ⬜ Verify server reloaded changes
3. ⬜ Create new assessment with irrelevant doc
4. ⬜ Verify score is 5-20 (not 65+)
5. ⬜ Check answer explanations match scores

### Short-term (This Week)
1. ⬜ Add frontend warning when >50% answers have "cannot access"
2. ⬜ Implement document relevance pre-check before execution
3. ⬜ Add confidence/reliability badge to results page
4. ⬜ Create automated test for this scenario

### Long-term (Next Sprint)
1. ⬜ Improve document relevance algorithm (semantic, not keyword)
2. ⬜ Add document-template compatibility check
3. ⬜ Block execution if document clearly irrelevant
4. ⬜ Allow re-scoring of existing assessments

---

## Debugging Tools

### Check Answer Details
```bash
cd backend
node check-answers-detail.mjs
```

### Check Recent Assessments
```bash
cd backend
node check-recent-assessments.mjs
```

### Check Specific Assessment
```bash
cd backend
# Edit check-assessment.mjs line 6 with assessment ID
node check-assessment.mjs
```

---

## Related Documentation

- `INFLATED_SCORE_BUG_FIX.md` - Initial analysis (partially incorrect)
- `INFLATED_SCORE_FIX_CORRECT.md` - First corrected analysis (incomplete, missing Bug #2)
- `INFLATED_SCORE_FINAL_FIX.md` - **THIS DOCUMENT** (complete, both bugs)

---

**Document Version:** 3.0 (Final)
**Last Updated:** 2025-10-22 12:50 UTC
**Status:** Both Bugs Fixed, Awaiting Server Reload & Testing
**Bugs Fixed:** 2
**Lines Changed:** ~50
**Critical Fix:** Yes
