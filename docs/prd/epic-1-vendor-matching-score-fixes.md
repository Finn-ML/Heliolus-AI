# Epic 1: Vendor Matching Score Fixes

**Epic ID:** 1
**Epic Name:** Fix Critical Vendor Matching Score Algorithm Issues
**Priority:** CRITICAL
**Status:** Draft
**Created:** 2025-10-16
**Analysis Reference:** [docs/VENDOR_MATCH_SCORE_ANALYSIS.md](../VENDOR_MATCH_SCORE_ANALYSIS.md)

---

## Epic Summary

Fix critical bugs and data quality issues causing vendor match scores to be artificially low (5-20/140 instead of expected 75-125/140). Current scoring is severely impacted by:
1. Data schema mismatches between gap categories and vendor categories (40 points lost)
2. Priority format mismatches in comparison logic (20 points lost)
3. Missing vendor metadata causing zero scores in multiple components (55 points lost)

**Business Impact:**
- Users see poor vendor matches that don't reflect actual compatibility
- Marketplace appears broken with uniformly low match scores
- Loss of trust in AI-powered vendor recommendations
- Potential lost revenue from vendor partnerships

**Expected Outcome:**
- Match scores improve from 10-15% to 50-85% range
- Accurate vendor-to-gap matching based on actual compatibility
- Proper prioritization of vendors based on user needs

---

## Root Cause Analysis

### Issue 1: Gap Category Mismatch (0/40 points lost)
**Problem:** AI-generated gaps use descriptive text categories (e.g., "Transaction Risk & Monitoring"), but vendors use VendorCategory enum values (e.g., "TRANSACTION_MONITORING"). The comparison fails completely.

**Current State:**
```typescript
// Gap categories (from AI):
"Geographic Risk Assessment"
"Transaction Risk & Monitoring"
"Governance & Controls"
"Regulatory Alignment"

// Vendor categories (enum):
"RISK_ASSESSMENT"
"TRANSACTION_MONITORING"
"DATA_GOVERNANCE"
"REGULATORY_REPORTING"
```

**Impact:** Risk Area Coverage component scores 0/40 points for all vendors

---

### Issue 2: Priority Format Mismatch (0/20 points lost)
**Problem:** User priorities stored as lowercase-hyphenated strings (e.g., "transaction-monitoring"), but vendor categories are UPPERCASE_SNAKE_CASE (e.g., "TRANSACTION_MONITORING"). String comparison fails.

**Current State:**
```typescript
// User priorities:
['transaction-monitoring', 'risk-scoring', 'fraud-detection']

// Vendor categories:
['KYC_AML', 'TRANSACTION_MONITORING', 'SANCTIONS_SCREENING']

// Comparison: 'transaction-monitoring' === 'TRANSACTION_MONITORING' → false
```

**Impact:** Top Priority Coverage component scores 0/20 points for all vendors

---

### Issue 3: Empty Vendor Metadata (55 points lost)
**Problem:** 5 out of 7 scoring fields are 0% populated across all vendors:
- `targetSegments` (CompanySize[]) - **0% complete** → -20 points
- `features` (string[]) - **0% complete** → -10 points
- `geographicCoverage` (string[]) - **0% complete** → -20 points
- `pricingRange` (string) - **0% complete** → -10 points (gets 10 partial)
- `implementationTimeline` (number) - **0% complete** → -5 points

**Impact:** Combined loss of 55+ points per vendor across multiple scoring components

---

## Stories

### Story 1.1: Fix Gap Category to Vendor Category Mapping
**Priority:** CRITICAL
**Estimated Effort:** 2-3 hours
**Expected Impact:** +0-30 points per vendor (0% → 15-30%)

**User Story:**
As a compliance officer using the vendor marketplace, I want gaps identified in my assessment to properly match vendor categories so that I see vendors who actually address my specific compliance gaps.

**Acceptance Criteria:**
1. ✅ Gap categories created by AI analysis service are mapped to VendorCategory enum values
2. ✅ Mapping function covers all common gap category patterns from AI
3. ✅ Risk Area Coverage scoring component correctly matches gaps to vendors
4. ✅ Existing gaps in database are migrated to use proper enum values
5. ✅ Match scores increase for vendors whose categories align with assessment gaps

**Technical Requirements:**
- Create mapping function in `backend/src/services/ai-analysis.service.ts`
- Update gap creation logic to use mapped categories
- Create database migration script for existing gaps
- Add unit tests for category mapping logic
- Verify scoring improvement with test assessment

**Files to Modify:**
- `backend/src/services/ai-analysis.service.ts` (gap creation)
- `backend/src/matching/base-scorer.ts` (verify scoring logic)
- `backend/prisma/migrations/` (new migration for data fix)

---

### Story 1.2: Normalize Priority Format in Vendor Matching
**Priority:** CRITICAL
**Estimated Effort:** 1-2 hours
**Expected Impact:** +0-20 points per vendor (0% → 15-20%)

**User Story:**
As a compliance officer who completed the priorities questionnaire, I want my ranked priorities to properly boost vendor scores so that vendors matching my top priorities appear at the top of my results.

**Acceptance Criteria:**
1. ✅ Priority comparison normalizes formats (lowercase-hyphen → UPPER_SNAKE)
2. ✅ Top Priority Coverage component awards correct points for priority matches
3. ✅ Rank-based scoring works correctly (#1 priority = 20pts, #2 = 10pts, #3 = 5pts)
4. ✅ All three ranked priorities are checked for matches
5. ✅ Match scores increase for vendors matching user's top priorities

**Technical Requirements:**
- Update comparison logic in `backend/src/matching/priority-boost.ts`
- Normalize priority strings before comparison (lines 33, 41, 49)
- Add normalization helper function
- Add unit tests for priority matching edge cases
- Verify with real assessment data

**Files to Modify:**
- `backend/src/matching/priority-boost.ts` (calculateTopPriorityBoost function)

---

### Story 1.3: Implement Graceful Degradation for Missing Vendor Metadata
**Priority:** HIGH
**Estimated Effort:** 2-3 hours
**Expected Impact:** +25-30 points per vendor (10% → 32%)

**User Story:**
As a product manager, I want the vendor matching algorithm to provide reasonable scores even when vendor metadata is incomplete, so that the marketplace appears functional while we enrich vendor data.

**Acceptance Criteria:**
1. ✅ Empty `targetSegments` field awards 10 partial points (assume serves all segments)
2. ✅ Empty `geographicCoverage` field awards 10 partial points (assume global)
3. ✅ Empty `features` field awards 5 partial points (neutral stance)
4. ✅ Null `pricingRange` continues to award 10 partial points (existing behavior)
5. ✅ Overall match scores improve from ~15 to ~45 points average
6. ✅ Scoring logic clearly documents assumptions for missing data

**Technical Requirements:**
- Update base-scorer.ts functions: calculateSizeFit, calculateGeoCoverage
- Update priority-boost.ts function: calculateFeatureBoost
- Add clear code comments explaining partial credit rationale
- Add unit tests for missing data scenarios
- Verify scoring improvements with production vendor data

**Files to Modify:**
- `backend/src/matching/base-scorer.ts` (calculateSizeFit, calculateGeoCoverage, calculatePriceScore)
- `backend/src/matching/priority-boost.ts` (calculateFeatureBoost)

---

### Story 1.4: Enrich Vendor Metadata from Existing Text Fields
**Priority:** MEDIUM
**Estimated Effort:** 1-2 days
**Expected Impact:** +35-75 points per vendor (32% → 57-86%)

**User Story:**
As a product manager, I want to extract structured metadata from existing vendor text fields so that the matching algorithm can properly score vendors on all dimensions without requiring manual data entry.

**Acceptance Criteria:**
1. ✅ Script extracts features from `aiCapabilities` and `primaryProduct` fields
2. ✅ Script infers `targetSegments` from `customerSegments` field
3. ✅ Script maps `headquarters` to `geographicCoverage` array
4. ✅ Script generates reasonable `pricingRange` estimates based on vendor tier
5. ✅ Script sets `implementationTimeline` based on vendor maturity/deployment complexity
6. ✅ All 10+ approved vendors have enriched metadata
7. ✅ Match scores improve to 50-85% range for well-matched vendors
8. ✅ Enrichment results are reviewed and validated before database update

**Technical Requirements:**
- Create AI-assisted enrichment script using GPT-4
- Parse vendor text fields (benefitsSnapshot, maturityAssessment, etc.)
- Map text values to structured enum/array fields
- Generate SQL migration or Prisma script for bulk update
- Validate enrichment quality (spot-check 5+ vendors)
- Run enrichment against production vendor dataset

**Deliverables:**
- `backend/scripts/enrich-vendor-metadata.ts` (enrichment script)
- `backend/prisma/migrations/YYYYMMDD_enrich_vendor_data.sql` (migration)
- `docs/vendor-enrichment-validation.md` (validation report)

---

## Success Metrics

### Before Fix
- **Average Match Score:** 5-20/140 (3.6-14.3%)
- **Risk Coverage Score:** 0/40 (0%)
- **Priority Boost Score:** 0-5/40 (0-12.5%)
- **User Experience:** "Broken" marketplace, all vendors show low scores

### After Story 1.1 + 1.2 + 1.3
- **Average Match Score:** 40-50/140 (~32%)
- **Risk Coverage Score:** 10-30/40 (25-75%)
- **Priority Boost Score:** 15-25/40 (37-62%)
- **User Experience:** Functional marketplace, clear differentiation between vendors

### After Story 1.4 (Full Fix)
- **Average Match Score:** 75-125/140 (54-89%)
- **All Components:** Properly scoring based on actual vendor-assessment fit
- **User Experience:** Excellent, users trust vendor recommendations

---

## Technical Dependencies

### Data Models
- `Gap` model (category field)
- `Vendor` model (categories, targetSegments, features, geographicCoverage, pricingRange, implementationTimeline)
- `AssessmentPriorities` model (rankedPriorities field)

### Services/Modules
- `backend/src/services/ai-analysis.service.ts` (gap creation)
- `backend/src/services/vendor-matching.service.ts` (orchestration)
- `backend/src/matching/base-scorer.ts` (base scoring logic)
- `backend/src/matching/priority-boost.ts` (priority boost logic)

### Testing Requirements
- Unit tests for all scoring function edge cases
- Integration test with real assessment + vendor data
- Before/after scoring comparison validation

---

## Notes for Developers

### Key Insight from Analysis
The scoring algorithm design is **sound**. The issues are purely:
1. **Data format mismatches** (bugs in comparison logic)
2. **Missing data** (vendor metadata not populated)

The algorithm doesn't need redesign—just data alignment and graceful degradation.

### Testing Approach
Use assessment ID `cmgtah4e9003jlvglxp0ra3ri` as the reference test case:
- 9 gaps across 5 categories
- User priorities: transaction-monitoring, risk-scoring, fraud-detection
- Company: SMB, €50K-€100K budget, 4 jurisdictions

Expected results after fixes:
- Napier AI should score 80-100+ (has TRANSACTION_MONITORING category)
- Vendors without relevant categories should score 30-50 (partial credit)
- Clear ranking differentiation based on fit

---

## Epic Completion Checklist

- [ ] Story 1.1: Gap category mapping fixed and tested
- [ ] Story 1.2: Priority format normalization implemented
- [ ] Story 1.3: Graceful degradation for missing data
- [ ] Story 1.4: Vendor metadata enrichment completed
- [ ] Integration test with production data shows 50-85% scores
- [ ] User acceptance testing confirms marketplace feels functional
- [ ] Documentation updated with new scoring behavior

---

**Epic Owner:** Product/Engineering
**Stakeholders:** Compliance users, Vendor partners, Product team
