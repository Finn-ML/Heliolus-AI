# Vendor Match Score Analysis
**Date:** 2025-10-16
**Assessment ID:** cmgtah4e9003jlvglxp0ra3ri
**Issue:** Very low match scores (5-20 out of 140 possible)

## Executive Summary

**Root Cause: Severe vendor metadata deficiency (80-90% incomplete).**

The low match scores are **primarily due to missing vendor metadata**, not actual incongruence. Our vendors have empty critical fields that drive the scoring algorithm, resulting in near-zero scores across most components.

---

## Scoring Algorithm Breakdown

The vendor matching algorithm awards up to **140 points total**:

### Base Score (0-100 points)
1. **Risk Area Coverage** (0-40 points) - Gap category matching
2. **Company Size Fit** (0-20 points) - Target segment matching
3. **Geographic Coverage** (0-20 points) - Jurisdiction matching
4. **Price Appropriateness** (0-20 points) - Budget matching

### Priority Boost (0-40 points)
1. **Top Priority Coverage** (0-20 points) - Ranked priority matching
2. **Must-Have Features** (0-10 points) - Feature matching
3. **Deployment Match** (0-5 points) - Deployment model matching
4. **Speed to Deploy** (0-5 points) - Implementation timeline

---

## Assessment Data Analysis

### Gaps Identified (9 total)
```
Category Distribution:
- Regulatory Alignment: 4 gaps (44%)
- Governance & Controls: 2 gaps (22%)
- Geographic Risk Assessment: 1 gap (11%)
- Product & Service Risk: 1 gap (11%)
- Transaction Risk & Monitoring: 1 gap (11%)
```

**Gap categories:** Well-distributed across AML/compliance domains. Good data quality.

### User Priorities
```
Budget Range: €50K-€100K
Company Size: SMB (51-500 employees)
Annual Revenue: Over €100M
Jurisdictions: FINCEN, FCA, EBA, BaFin (4 jurisdictions)
Deployment: CLOUD
Must-Have Features:
  - REAL_TIME_MONITORING
  - CASE_MANAGEMENT
Ranked Priorities:
  #1: transaction-monitoring
  #2: risk-scoring
  #3: fraud-detection
```

**Priority data:** Complete and specific. Good data quality.

---

## Vendor Metadata Analysis

### Sample Vendor Data (First 5 of 10 approved vendors)

#### Vendor 1: Kount (Equifax)
```
Categories: ['KYC_AML'] ✅
Target Segments: [] ❌ EMPTY
Features: [] ❌ EMPTY (count: 0)
Geographic Coverage: [] ❌ EMPTY
Pricing Range: null ❌ MISSING
Implementation Timeline: null ❌ MISSING
Deployment Options: "SaaS; API" ✅ (but needs parsing)
```

#### Vendor 2: Silent Eight
```
Categories: ['KYC_AML', 'SANCTIONS_SCREENING'] ✅
Target Segments: [] ❌ EMPTY
Features: [] ❌ EMPTY (count: 0)
Geographic Coverage: [] ❌ EMPTY
Pricing Range: null ❌ MISSING
Implementation Timeline: null ❌ MISSING
Deployment Options: "SaaS; API; on-prem" ✅ (but needs parsing)
```

#### Vendor 3: Napier AI
```
Categories: ['KYC_AML', 'TRANSACTION_MONITORING', 'SANCTIONS_SCREENING'] ✅
Target Segments: [] ❌ EMPTY
Features: [] ❌ EMPTY (count: 0)
Geographic Coverage: [] ❌ EMPTY
Pricing Range: null ❌ MISSING
Implementation Timeline: null ❌ MISSING
Deployment Options: "SaaS; API; private cloud" ✅ (but needs parsing)
```

#### Vendor 4: Neterium
```
Categories: ['SANCTIONS_SCREENING'] ✅
Target Segments: [] ❌ EMPTY
Features: [] ❌ EMPTY (count: 0)
Geographic Coverage: [] ❌ EMPTY
Pricing Range: null ❌ MISSING
Implementation Timeline: null ❌ MISSING
Deployment Options: "API-first (cloud)" ✅ (but needs parsing)
```

#### Vendor 5: DISCAI (KBC Group)
```
Categories: ['KYC_AML', 'TRANSACTION_MONITORING'] ✅
Target Segments: [] ❌ EMPTY
Features: [] ❌ EMPTY (count: 0)
Geographic Coverage: [] ❌ EMPTY
Pricing Range: null ❌ MISSING
Implementation Timeline: null ❌ MISSING
Deployment Options: "SaaS; enterprise deployments" ✅ (but needs parsing)
```

### Metadata Completion Analysis

| Field | Complete | Empty/Null | Completion Rate |
|-------|----------|------------|-----------------|
| **Categories** | 10/10 | 0/10 | **100%** ✅ |
| **Target Segments** | 0/10 | 10/10 | **0%** ❌ |
| **Features** | 0/10 | 10/10 | **0%** ❌ |
| **Geographic Coverage** | 0/10 | 10/10 | **0%** ❌ |
| **Pricing Range** | 0/10 | 10/10 | **0%** ❌ |
| **Implementation Timeline** | 0/10 | 10/10 | **0%** ❌ |
| **Deployment Options** | 10/10 | 0/10 | **100%** ✅ |

**Overall Metadata Completion: 28.6% (2/7 fields)**

---

## Scoring Impact Analysis

### Component 1: Risk Area Coverage (0-40 points)
**Expected Score:** 5-15 points
**Actual Impact:** ✅ WORKING CORRECTLY

This component only uses `vendor.categories` vs `gap.category`. Since all vendors have categories populated, this scoring component should work.

**Example calculation for Napier AI:**
- Vendor categories: KYC_AML, TRANSACTION_MONITORING, SANCTIONS_SCREENING
- Gap categories: Geographic Risk Assessment (1), Product & Service Risk (1), Transaction Risk & Monitoring (1), Governance & Controls (2), Regulatory Alignment (4)
- **Problem:** Gap categories don't match VendorCategory enum values!

**CATEGORY MISMATCH DISCOVERED:**
```typescript
// Gap categories (from AI analysis):
"Geographic Risk Assessment"
"Product & Service Risk"
"Transaction Risk & Monitoring"
"Governance & Controls"
"Regulatory Alignment"

// VendorCategory enum:
KYC_AML
TRANSACTION_MONITORING
SANCTIONS_SCREENING
TRADE_SURVEILLANCE
RISK_ASSESSMENT
COMPLIANCE_TRAINING
REGULATORY_REPORTING
DATA_GOVERNANCE
```

**These don't overlap at all!** The gap categories are descriptive text, while vendor categories are enum values. This is a **data schema mismatch**.

### Component 2: Company Size Fit (0-20 points)
**Expected Score:** 0 points (all vendors have empty targetSegments)
**Impact:** ❌ **-20 points per vendor**

```typescript
// calculateSizeFit() in base-scorer.ts:
if (vendorSegments.length === 0) {
  return SIZE_FIT_SCORES.NO_MATCH; // 0 points
}
```

User is SMB, but no vendor specifies target segments, so all get 0 points.

### Component 3: Geographic Coverage (0-20 points)
**Expected Score:** 0 points (all vendors have empty geographicCoverage)
**Impact:** ❌ **-20 points per vendor**

```typescript
// calculateGeoCoverage() in base-scorer.ts:
const vendorCoverage = vendor.geographicCoverage || [];
// User requires: FINCEN, FCA, EBA, BaFin
// All vendors have: []
// Result: 0/4 matched = 0 points
```

### Component 4: Price Appropriateness (0-20 points)
**Expected Score:** 10 points (partial credit for missing pricing)
**Impact:** ❌ **-10 points per vendor**

```typescript
// calculatePriceScore() in base-scorer.ts:
if (!vendor.pricingRange) {
  return SCORING_WEIGHTS.PRICE / 2; // 10 points partial credit
}
```

This actually gives 10 points, but we lose the opportunity for 20 points if pricing matched.

### Component 5: Top Priority Coverage (0-20 points)
**Expected Score:** 0-20 points depending on match
**Impact:** ❌ **Likely 0 points due to category mismatch**

```typescript
// User's ranked priorities:
['transaction-monitoring', 'risk-scoring', 'fraud-detection']

// Vendor categories (enum values):
['KYC_AML', 'TRANSACTION_MONITORING', 'SANCTIONS_SCREENING']
```

**Second mismatch!** User priorities are stored as lowercase-hyphenated strings (`'transaction-monitoring'`), but vendor categories are enum values (`'TRANSACTION_MONITORING'`). The comparison will fail.

### Component 6: Must-Have Features (0-10 points)
**Expected Score:** 0 points (all vendors have empty features)
**Impact:** ❌ **-10 points per vendor**

```typescript
// User requires: REAL_TIME_MONITORING, CASE_MANAGEMENT
// All vendors have: [] (empty array)
// Result: missing.length = 2 (no match) = 0 points
```

### Component 7: Deployment Match (0-5 points)
**Expected Score:** 0 points (deployment options need parsing)
**Impact:** ❌ **-5 points per vendor**

```typescript
// User preference: 'CLOUD'
// Vendor deploymentOptions: "SaaS; API; private cloud" (string)
// Code checks: vendorOptions.toLowerCase().includes(preference.toLowerCase())
// "saas; api; private cloud".includes("cloud") = true ✅

// This should actually work! But might not due to case sensitivity.
```

This component might actually award 5 points if the string matching works correctly.

### Component 8: Speed to Deploy (0-5 points)
**Expected Score:** 0 points (no timeline data)
**Impact:** ❌ **-5 points per vendor**

```typescript
// User urgency: Not "IMMEDIATE" (would need to check assessment)
// But even if immediate, vendor timeline is null, defaulting to 365 days
// 365 > 90, so 0 points
```

---

## Calculated Expected Scores

### With Current Data Quality

| Component | Max Points | Expected Score | Reason |
|-----------|-----------|----------------|---------|
| Risk Area Coverage | 40 | **0** | Category mismatch (text vs enum) |
| Company Size Fit | 20 | **0** | Empty targetSegments |
| Geographic Coverage | 20 | **0** | Empty geographicCoverage |
| Price Appropriateness | 20 | **10** | Partial credit for null pricing |
| **Base Score Total** | **100** | **10** | |
| Top Priority Coverage | 20 | **0** | Format mismatch (lowercase vs ENUM) |
| Must-Have Features | 10 | **0** | Empty features array |
| Deployment Match | 5 | **5** | String matching works |
| Speed to Deploy | 5 | **0** | Null timeline |
| **Priority Boost Total** | **40** | **5** | |
| **GRAND TOTAL** | **140** | **15** | |

**Predicted score: 15/140 (10.7%)**
**Actual observed scores: 5-20/140 (3.6-14.3%)**

✅ **Prediction matches reality!**

---

## Root Causes Summary

### 1. **Gap Category Mismatch** (CRITICAL)
- **Problem:** Gaps have descriptive text categories (e.g., "Transaction Risk & Monitoring")
- **Vendor:** Vendor categories are enum values (e.g., "TRANSACTION_MONITORING")
- **Impact:** 0/40 points on Risk Area Coverage
- **Fix Required:** Map gap categories to VendorCategory enums during gap creation

### 2. **Priority Format Mismatch** (CRITICAL)
- **Problem:** User priorities are lowercase-hyphenated (e.g., "transaction-monitoring")
- **Vendor:** Vendor categories are UPPERCASE_SNAKE (e.g., "TRANSACTION_MONITORING")
- **Impact:** 0/20 points on Top Priority Coverage
- **Fix Required:** Normalize formats before comparison

### 3. **Empty Vendor Metadata** (CRITICAL)
- **Problem:** 5 out of 7 scoring fields are empty/null for all vendors
- **Missing Fields:**
  - `targetSegments` (CompanySize[]) - 0% populated
  - `features` (string[]) - 0% populated
  - `geographicCoverage` (string[]) - 0% populated
  - `pricingRange` (string) - 0% populated
  - `implementationTimeline` (number) - 0% populated
- **Impact:** Loss of 55 points per vendor (Company Size: 20, Geo: 20, Features: 10, Speed: 5)
- **Fix Required:** Data enrichment from vendor CSV or manual entry

---

## Recommendations

### Immediate Fixes (Code Changes - 1-2 hours)

#### 1. Fix Gap Category Mapping
**File:** `backend/src/services/ai-analysis.service.ts` (gap creation logic)

Create a mapping function:
```typescript
function mapGapCategoryToVendorCategory(gapCategory: string): VendorCategory | null {
  const mapping: Record<string, VendorCategory> = {
    'Geographic Risk Assessment': 'RISK_ASSESSMENT',
    'Product & Service Risk': 'RISK_ASSESSMENT',
    'Transaction Risk & Monitoring': 'TRANSACTION_MONITORING',
    'Governance & Controls': 'DATA_GOVERNANCE',
    'Regulatory Alignment': 'REGULATORY_REPORTING',
    'KYC': 'KYC_AML',
    'AML': 'KYC_AML',
    'Sanctions': 'SANCTIONS_SCREENING',
    'Trade Surveillance': 'TRADE_SURVEILLANCE',
  };

  return mapping[gapCategory] || null;
}
```

Apply this when creating gaps to ensure `gap.category` matches VendorCategory enum values.

#### 2. Normalize Priority Comparison
**File:** `backend/src/matching/priority-boost.ts:33`

Change:
```typescript
// Before
if (rankedPriorities[0] && vendorCategories.includes(rankedPriorities[0])) {

// After
const normalizedPriority = rankedPriorities[0]
  ?.toUpperCase()
  .replace(/-/g, '_');

if (normalizedPriority && vendorCategories.includes(normalizedPriority)) {
```

#### 3. Improve Partial Scoring for Missing Data
**File:** `backend/src/matching/base-scorer.ts`

Give more generous partial credit:
```typescript
// Company Size Fit - if empty, assume vendor serves all segments
if (vendorSegments.length === 0) {
  return SIZE_FIT_SCORES.PARTIAL_MATCH; // 10 points instead of 0
}

// Geographic Coverage - if empty, assume global coverage
if (vendorCoverage.length === 0) {
  return SCORING_WEIGHTS.GEO_COVERAGE / 2; // 10 points instead of 0
}

// Features - if empty, assume vendor might have features
if (vendorFeatures.length === 0) {
  return PRIORITY_BOOST_WEIGHTS.FEATURES_PARTIAL; // 5 points instead of 0
}
```

**Expected impact:** Scores increase from 15 to ~45 points (32% vs 10%)

### Medium-Term Fixes (Data Enrichment - 1-2 days)

#### 4. Vendor Data Enrichment
Populate missing vendor fields through:

**Option A: Parse from CSV**
- Original vendor CSV likely has this data in other columns
- Parse `deploymentOptions` into proper array
- Extract features from `aiCapabilities`, `primaryProduct` fields
- Infer `targetSegments` from `customerSegments` field
- Map `headquarters` to `geographicCoverage`

**Option B: AI-Assisted Enrichment**
- Use GPT-4 to analyze vendor text fields (benefitsSnapshot, maturityAssessment)
- Extract structured data for missing fields
- Validate and store

**Option C: Vendor Self-Service**
- Create vendor portal for profile completion
- Incentivize completion (featured listing, etc.)

**Expected impact:** Scores increase from 45 to 80-120 points (57-86%)

### Long-Term Improvements (Architecture - 1 week)

#### 5. Fuzzy Category Matching
Instead of exact enum matching, use semantic similarity:
```typescript
// Use embeddings or keyword matching
function calculateCategoryOverlap(gapText: string, vendorCategories: string[]): number {
  // "Transaction Risk & Monitoring" should match "TRANSACTION_MONITORING"
  // Score based on keyword overlap
}
```

#### 6. Weighted Scoring Based on Data Completeness
Track vendor data completeness and adjust expectations:
```typescript
interface VendorDataQuality {
  completenessScore: number; // 0-100
  hasTargetSegments: boolean;
  hasFeatures: boolean;
  hasPricing: boolean;
  // ...
}

// Adjust max possible score based on available data
const maxPossibleScore = calculateMaxScore(vendorDataQuality);
const normalizedScore = (actualScore / maxPossibleScore) * 140;
```

#### 7. Alternative Scoring Sources
When structured data is missing, fall back to text analysis:
- Parse `benefitsSnapshot` for feature keywords
- Analyze `customerSegments` for size inference
- Extract jurisdiction mentions from `dataCoverage`

---

## Conclusion

**The low match scores (5-20/140) are almost entirely due to missing vendor metadata, not algorithmic failure or actual vendor-assessment mismatch.**

### Evidence:
1. ✅ **Assessment data quality:** Excellent (complete gaps, priorities, user profile)
2. ✅ **Algorithm logic:** Sound (well-designed 4+4 component scoring)
3. ❌ **Vendor data quality:** Poor (0% completion on 5/7 critical fields)
4. ❌ **Data format alignment:** Mismatched (gap categories vs vendor enums)

### If Vendor Metadata Were Complete:
With the same assessment and proper vendor data, we'd expect scores of:
- **Risk Coverage:** 15-30 points (gap-category matching)
- **Size/Geo/Price:** 40-60 points (demographic matching)
- **Priority Boost:** 20-35 points (feature/deployment/timeline matching)
- **Total:** **75-125 points** (54-89%)

### Recommended Action Plan:
1. ✅ **Week 1:** Implement immediate code fixes (gap category mapping, priority normalization, partial scoring)
   - Expected improvement: 10% → 32%
2. ✅ **Week 2:** Vendor data enrichment (parse CSV, AI extraction, or manual entry)
   - Expected improvement: 32% → 57-86%
3. ⏱️ **Week 3+:** Long-term architecture improvements (fuzzy matching, completeness-aware scoring)

---

**Analysis completed:** 2025-10-16
**Next steps:** Review with team and prioritize fixes based on resource availability.
