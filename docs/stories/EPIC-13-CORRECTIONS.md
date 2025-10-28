# Epic 13 - Required Corrections Before Implementation

**Date:** 2025-10-28
**Status:** REQUIRED READING before starting any Epic 13 stories
**Priority:** HIGH

---

## 🔴 CRITICAL CORRECTION #1: Match Quality Labels

**Affects:** Story 13.2 (Tasks 1, 5, and Testing section)

### Issue:
Story 13.2 incorrectly documents 4 match quality tiers. The actual codebase uses only 3 tiers.

### Current Story Documentation (INCORRECT):
```typescript
// ❌ WRONG - DO NOT USE
'Excellent' (≥120)
'Strong' (≥100)
'Good' (≥80)
'Partial' (<80)
```

### Actual Codebase Implementation (CORRECT):
```typescript
// ✅ CORRECT - USE THIS
// Source: frontend/src/types/vendor-matching.types.ts:112-119

export type MatchQuality = 'Highly Relevant' | 'Good Match' | 'Fair Match';

export function getMatchQuality(score: number): MatchQuality {
  if (score >= 120) return 'Highly Relevant';
  if (score >= 100) return 'Good Match';
  return 'Fair Match'; // <100
}
```

### Required Changes to Story 13.2:

#### AC #2 - Update to:
```
2. Match quality badges shown (Highly Relevant/Good Match/Fair Match based on score thresholds)
```

#### Task 1, Subtask 4 - Update to:
```
- [ ] Calculate and display match quality badge using helper functions from vendor-matching.types.ts:
  - [ ] getMatchQuality(score): 'Highly Relevant' (≥120), 'Good Match' (≥100), 'Fair Match' (<100)
  - [ ] getMatchQualityColor(score): color classes for badges (takes score, not quality)
```

#### Task 5 - Replace entirely with:
```
- [ ] Task 5: Add Match Quality Badge Component (AC: 2)
  - [ ] Create <MatchQualityBadge> component accepting score: number prop
  - [ ] Use Radix Badge with color variants:
    - [ ] Highly Relevant (≥120): bg-green-500/20 text-green-400 border-green-500/50
    - [ ] Good Match (≥100): bg-blue-500/20 text-blue-400 border-blue-500/50
    - [ ] Fair Match (<100): bg-yellow-500/20 text-yellow-400 border-yellow-500/50
  - [ ] Add icon from Lucide React based on quality:
    - [ ] Highly Relevant: CheckCircle2 (double check)
    - [ ] Good Match: Check (single check)
    - [ ] Fair Match: AlertCircle (info)
  - [ ] Add tooltip explaining score threshold and what it means
  - [ ] Make badge prominent (text-lg, px-4, py-2)
```

#### Testing Section - Update Test Case #2:
```typescript
// ❌ OLD (WRONG)
test('Match Quality Badges', () => {
  // Test Excellent badge: mock score 125
  // Test Strong badge: mock score 105
  // Test Good badge: mock score 85
  // Test Partial badge: mock score 65
});

// ✅ NEW (CORRECT)
test('Match Quality Badges', () => {
  // Test Highly Relevant badge: mock score 125, assert badge shows "Highly Relevant" with green color
  // Test Good Match badge: mock score 105, assert badge shows "Good Match" with blue color
  // Test Fair Match badge: mock score 85, assert badge shows "Fair Match" with yellow color
  // Test Fair Match badge (low score): mock score 65, assert badge shows "Fair Match" with yellow color
});
```

---

## ⚠️ REQUIRED ADDITION #1: Frontend Gaps API Wrapper

**Affects:** Story 13.3, Task 8

### Issue:
Story 13.3 assumes `assessmentApi.getGaps()` exists, but it doesn't. The backend endpoint exists, but no frontend wrapper.

### Backend Endpoint (EXISTS):
```
GET /v1/assessments/:id/gaps
Query params: severity?, category?, priority?
Response: Gap[]
```

### Frontend Wrapper (MISSING - MUST ADD):

Add to Story 13.3, Task 8 as **first subtask**:

```
- [ ] Task 8: Integrate with Assessment API (AC: 1)
  - [ ] ADD NEW SUBTASK: Create assessmentApi.getGaps() wrapper function
    Location: frontend/src/lib/api.ts
    Code to add:
    ```typescript
    // Add to assessmentApi object
    getGaps: async (
      assessmentId: string,
      filters?: {
        severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        category?: string;
        priority?: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
      }
    ): Promise<Gap[]> => {
      const params = new URLSearchParams(filters as any);
      const url = `/assessments/${assessmentId}/gaps${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest<Gap[]>(url);
      return response;
    },
    ```
  - [ ] Fetch assessment data including gaps using TanStack Query
  - [ ] Query key: ['assessment', assessmentId, 'gaps']
  - [ ] (rest of task remains the same)
```

---

## ⚠️ MINOR CORRECTION #1: Helper Function Signature

**Affects:** Story 13.2, Dev Notes section

### Issue:
Documentation shows incorrect function signature for `getMatchQualityColor()`.

### Story Documentation (INCORRECT):
```typescript
// ❌ WRONG
getMatchQualityColor(quality: string): string
```

### Actual Implementation (CORRECT):
```typescript
// ✅ CORRECT
// Source: frontend/src/types/vendor-matching.types.ts:122
getMatchQualityColor(score: number): string
```

### Usage Example:
```typescript
// ✅ CORRECT USAGE
const color = getMatchQualityColor(vendor.matchDetails.totalScore);

// ❌ WRONG - DO NOT DO THIS
const quality = getMatchQuality(score);
const color = getMatchQualityColor(quality); // Type error!
```

### Update Required:
Story 13.2, Dev Notes, "Helper Functions" section - update to show correct signature.

---

## ⚠️ MINOR CORRECTION #2: Token Storage Key

**Affects:** All stories (verify consistency)

### Issue:
Ensure all stories reference the correct localStorage key for auth token.

### Correct Key:
```typescript
localStorage.getItem('token') // ✅ CORRECT
```

### Incorrect Key (DO NOT USE):
```typescript
localStorage.getItem('authToken') // ❌ WRONG
```

### Verification:
Stories 13.1, 13.3, 13.5 - search for any references to 'authToken' and replace with 'token'.

---

## 📋 Implementation Checklist

Before starting each story, developers should:

### Story 13.1:
- [x] No corrections needed - ready to implement

### Story 13.2:
- [ ] Read CRITICAL CORRECTION #1 above
- [ ] Use 3-tier match quality system (not 4-tier)
- [ ] Use correct labels: 'Highly Relevant', 'Good Match', 'Fair Match'
- [ ] Use correct helper function: `getMatchQualityColor(score)` not `getMatchQualityColor(quality)`
- [ ] Update badge colors to match actual codebase
- [ ] Update test assertions

### Story 13.3:
- [ ] Read REQUIRED ADDITION #1 above
- [ ] Add `assessmentApi.getGaps()` wrapper function FIRST
- [ ] Then proceed with rest of Task 8

### Story 13.4:
- [x] No corrections needed - ready to implement

### Story 13.5:
- [ ] Verify no references to 'authToken' (should be 'token')
- [ ] Update test assertions to use 3-tier match quality system

---

## 🎯 Quick Reference: Correct Match Quality System

```typescript
// Use this as your reference during implementation

// Type Definition
type MatchQuality = 'Highly Relevant' | 'Good Match' | 'Fair Match';

// Score Thresholds
const thresholds = {
  highlyRelevant: 120, // ≥120 points
  goodMatch: 100,      // ≥100 points
  fairMatch: 0,        // <100 points
};

// Helper Functions (existing in codebase)
getMatchQuality(score: number): MatchQuality
getMatchQualityColor(score: number): string // Returns TailwindCSS classes

// Badge Colors (from codebase)
{
  'Highly Relevant': 'bg-green-500/20 text-green-400 border-green-500/50',
  'Good Match': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'Fair Match': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
}

// Icons
{
  'Highly Relevant': CheckCircle2, // or similar
  'Good Match': Check,
  'Fair Match': AlertCircle,
}
```

---

## 📞 Questions?

If you encounter discrepancies not covered in this document:
1. Check the actual codebase implementation
2. Prioritize codebase over story documentation
3. Document the discrepancy for review
4. Proceed with codebase-aligned implementation

**Remember:** Stories are 95% accurate. These corrections bring them to 100%.

---

**Last Updated:** 2025-10-28
**Applies To:** Epic 13 Stories 13.1-13.5
**Status:** ACTIVE - Apply before implementation

