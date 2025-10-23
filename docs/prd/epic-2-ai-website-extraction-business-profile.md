# Epic 2: AI-Powered Website Extraction for Business Profile

**Epic ID:** 2
**Epic Name:** AI Website Extraction for Automated Business Profile Population
**Priority:** HIGH
**Status:** Draft
**Created:** 2025-10-17

---

## Epic Summary

Implement AI-powered website extraction to automatically populate business profile fields, reducing friction in the onboarding flow. Users will be able to enter their company website URL and have 11+ profile fields auto-filled with accurate data extracted from their website, company information databases, and AI analysis.

**Business Impact:**
- Reduce onboarding friction from 8-10 minutes to 2-3 minutes
- Improve data quality through AI-powered extraction vs manual entry
- Increase conversion rate by 30-50% (estimated)
- Enhance user experience with "magic" auto-fill functionality
- Reduce user errors and incomplete profiles

**Expected Outcome:**
- Users enter website URL → profile auto-populates in 5-10 seconds
- 75-85% accuracy on core fields (Phase 1 MVP - good enough!)
- Graceful fallback to manual entry if extraction fails
- Professional, polished UX that builds trust in the platform

---

## ⚡ Quick Start: What to Build First

**🚀 Phase 1 - MVP (Ship in Week 1):**
Build ONLY website scraping with confidence scores. This gets you:
- ✅ 75-85% accuracy (good enough for most users)
- ✅ 3-4 days implementation
- ✅ $150/month cost
- ✅ Real user feedback to guide next steps

**Stop and measure for 1 week before building more.**

**📊 Phase 2 - Enhanced (Week 2 - IF NEEDED):**
Add OpenAI search fallback ONLY if Phase 1 accuracy <80%.
- ⏸️ 85-90% accuracy
- ⏸️ +1 day implementation
- ⏸️ $300-500/month cost

**🎯 Phase 3 - Advanced (Future):**
Full multi-source with consensus ONLY if Phase 2 insufficient AND budget allows.
- 🔮 90-95% accuracy
- 🔮 +2-3 days implementation
- 🔮 $1,200/month cost

**Recommendation: Ship Phase 1 → Measure → Iterate based on real data**

---

## Current State Analysis

### Existing Infrastructure ✅
The codebase already has foundational infrastructure:

1. **Backend Service** (`backend/src/services/organization.service.ts`):
   - `parseWebsite(organizationId)` function exists
   - Currently calls AI lib functions but gets mock data

2. **AI Library** (`backend/src/lib/ai/`):
   - `analyzeWebsite(url)` - Website analysis function (mocked)
   - `extractCompanyData(input)` - Data extraction function (mocked)
   - Real implementations disabled in `.ts.disabled` files

3. **Database Schema** (`backend/prisma/schema.prisma`):
   - `Organization` model has all required fields
   - `OrganizationDraft` model supports pre-registration flow

4. **API Route** (`backend/src/routes/organization.routes.ts`):
   - POST `/organizations/:id/parse-website` endpoint exists
   - Needs permission checks and error handling improvements

### What's Missing ❌

1. **Real AI Implementation**:
   - OpenAI integration for website scraping (currently mocked)
   - Structured data extraction from website HTML
   - Company information enrichment (optional: Clearbit, LinkedIn, etc.)
   - Error handling and retry logic
   - Confidence score calculation

2. **Frontend UI Enhancements**:
   - Checkbox next to website field in registration form: "Analyze with AI"
   - Loading states and progress indicators during extraction
   - Visual confidence indicators for auto-filled fields
   - Error handling UI (toast notifications)
   - Existing "Analyze" button needs to be connected to API

3. **Data Quality & Validation**:
   - Validation of extracted data against business rules
   - Confidence scores for each extracted field
   - Fallback strategies for missing/low-confidence data
   - Field highlighting for newly auto-filled values

4. **Integration**:
   - Website extraction not integrated with registration flow
   - OrganizationDraft doesn't support website-based creation
   - No analytics tracking for extraction success/failure

---

## Multi-Source Extraction Strategy

### Phased Approach (Build → Measure → Iterate)

We use a **phased rollout** to avoid overengineering while maximizing accuracy:

**🚀 Phase 1: MVP (Ship First - Week 1)**
- ✅ **Source 1: Website Scraping ONLY**
- ✅ Simple confidence scores (0-1)
- ✅ Flag low-confidence fields for manual review
- ✅ Cost: $150/month | Accuracy: 75-85% | Timeline: 1-2 days

**📊 Phase 2: Enhanced (Based on Real Data - Week 2-3)**
- ⏸️ **Source 2: OpenAI Online Search** (add if accuracy < 80%)
- ⏸️ Simple fallback merging (pick highest confidence)
- ⏸️ Cost: $300-500/month | Accuracy: 85-90% | Timeline: +1 day

**🎯 Phase 3: Advanced (If Proven Valuable - Future)**
- 🔮 **Source 3: External APIs** (Clearbit, etc.)
- 🔮 Consensus-based merging with field-specific weights
- 🔮 User feedback loop & ML optimization
- 🔮 Cost: $1,200/month | Accuracy: 90-95% | Timeline: +2-3 days

---

### Phase 1: MVP - Website Scraping (SHIP FIRST)

This is what we **build and ship in Week 1** to get real user feedback:

**How it works:**
1. Fetch website HTML using Puppeteer or Cheerio
2. Extract structured data (JSON-LD, Open Graph tags, meta tags)
3. Parse text content (hero section, about page, footer)
4. Send to GPT-4o-mini for structured extraction
5. Return fields with confidence scores (0-1)
6. Flag fields with confidence <0.70 for manual review

**Expected Results:**
- ✅ **Coverage**: 60-80% of fields populated
- ✅ **Confidence**: 0.6-0.9 per field
- ✅ **Accuracy**: 75-85% (good enough for MVP!)
- ✅ **Speed**: 5-8 seconds
- ✅ **Cost**: $0.01 per extraction = $150/month

**Why Start Here:**
- ✅ Simplest implementation (1-2 days)
- ✅ Lowest cost (88% cheaper than full multi-source)
- ✅ Real user data will tell us if we need more complexity
- ✅ 70% of companies have good websites with complete info

**Decision Criteria to Move to Phase 2:**
- ❌ Accuracy drops below 80% in production
- ❌ User complaints about missing/incorrect data
- ❌ More than 30% of fields flagged for manual review

---

### Phase 2: Enhanced - Add OpenAI Search (CONDITIONAL)

**Only implement if Phase 1 accuracy is insufficient** (measured with real user data).

**How it works:**
1. Run Phase 1 (website scraping) first
2. Check if critical fields have confidence <0.75
3. If yes, trigger OpenAI online search for those specific fields
4. Merge results using simple "pick highest confidence" strategy
5. Return combined results

**Expected Results:**
- ⏸️ **Coverage**: +20-30% additional fields
- ⏸️ **Accuracy**: 85-90%
- ⏸️ **Speed**: +3-5 seconds (total: 8-13s)
- ⏸️ **Cost**: $0.10-0.20 per search = $300-500/month

**Simple Merging Strategy:**
```typescript
// Phase 2: Keep it simple
function mergeSources(websiteResult, openaiResult) {
  const merged = {};

  for (const field of ALL_FIELDS) {
    const values = [websiteResult[field], openaiResult[field]]
      .filter(v => v && v.confidence > 0.5);

    // Pick highest confidence
    merged[field] = values.reduce((best, curr) =>
      curr.confidence > best.confidence ? curr : best
    );
  }

  return merged;
}
```

**Decision Criteria to Move to Phase 3:**
- ❌ Still seeing accuracy issues (<85%)
- ❌ Need more authoritative data (revenue, size)
- ❌ Budget allows for external API costs

---

### Phase 3: Advanced - Full Multi-Source (FUTURE)

**Only implement if Phase 2 is still insufficient** and budget allows.

This includes all the sophisticated features documented below:
- 🔮 Source 3: External APIs (Clearbit, OpenCorporates)
- 🔮 Consensus-based merging (2+ sources agree = bonus)
- 🔮 Field-specific source weighting (table below)
- 🔮 Recency priority (prefer newer data)
- 🔮 User feedback loop with ML optimization

**Expected Results:**
- 🔮 **Coverage**: 85-95% of fields
- 🔮 **Accuracy**: 90-95%
- 🔮 **Consensus Rate**: 60-70% of fields
- 🔮 **Cost**: $0.08 per extraction = $1,200/month

---

## Phase 3 Documentation (Reference Only - Don't Build Yet)

The sections below document the **advanced multi-source strategy** for Phase 3. These are **reference materials** - only implement if Phase 1 & 2 prove insufficient.

---

### Source 1: Website Scraping (Phase 1 - MVP)

**How it works:**
1. Fetch website HTML using Puppeteer or Cheerio
2. Extract structured data (JSON-LD, Open Graph tags, meta tags)
3. Parse text content (hero section, about page, footer)
4. Send to GPT-4o-mini for structured extraction

**Strengths:**
- ✅ First-party data (authoritative for name, description)
- ✅ Fast (~5-8 seconds)
- ✅ Cheap (~$0.01 per extraction)
- ✅ High confidence for company messaging fields

**Weaknesses:**
- ❌ Missing objective data (revenue, employee count)
- ❌ Can be outdated or incomplete
- ❌ May fail if site is down or blocks scraping

**Expected Coverage:** 60-80% of fields with 0.6-0.9 confidence

---

#### Source 2: OpenAI Online Search (Conditional)

**How it works:**
1. Triggered only if Source 1 has low-confidence fields (<0.75)
2. Use OpenAI's online search feature (web browsing)
3. Query: "Find information about [company name] including industry, size, location, revenue"
4. GPT-4 searches web and returns structured data

**Strengths:**
- ✅ Finds external data (news, LinkedIn, Crunchbase, Wikipedia)
- ✅ Objective information (not self-reported)
- ✅ Recent data from multiple sources
- ✅ High confidence for objective facts

**Weaknesses:**
- ❌ Expensive (~$0.10-0.20 per search)
- ❌ Slower (+3-5 seconds)
- ❌ May not find info for small/unknown companies

**Expected Coverage:** +20-30% additional fields with 0.7-0.95 confidence

**Optimization:** Only run for fields with confidence <0.75 after Source 1

---

#### Source 3: External APIs (Optional - Story 2.6)

**Providers:**
- **Clearbit Company API** - Paid, high quality ($99-499/month)
- **LinkedIn Company API** - Enterprise, expensive
- **OpenCorporates** - Free, registry data
- **HunterIO** - Email/domain verification

**How it works:**
1. Triggered for critical gaps after Sources 1 & 2
2. Query external provider by domain name
3. Return structured, verified company data

**Strengths:**
- ✅ Verified, authoritative data
- ✅ Comprehensive profiles (especially Clearbit)
- ✅ High confidence (0.85-0.98)

**Weaknesses:**
- ❌ Additional cost ($0.00-0.05 per lookup)
- ❌ API rate limits
- ❌ Coverage limited to registered companies

**Expected Coverage:** +10% additional fields with 0.85-0.98 confidence

---

### Sequential Execution with Early Exit (Cost Optimization)

Instead of running all sources in parallel, we use **intelligent sequencing** to minimize costs:

```
┌─────────────────────────────────────────────┐
│ Source 1: Website Scraping (ALWAYS)        │
│ Cost: $0.01 | Time: 5-8s                   │
│ Coverage: 60-80% of fields                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         Check: All fields > 0.75 confidence?
                  │
         YES ─────┴────► DONE ✅ (70% of cases)
                  │           Cost: $0.01
                 NO            Time: 5-8s
                  ▼
┌─────────────────────────────────────────────┐
│ Source 2: OpenAI Search (CONDITIONAL)      │
│ Target: Only low-confidence fields         │
│ Cost: $0.10-0.20 | Time: +3-5s             │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         Check: All fields > 0.70 confidence?
                  │
         YES ─────┴────► DONE ✅ (25% of cases)
                  │           Cost: $0.11-0.21
                 NO            Time: 8-13s
                  ▼
┌─────────────────────────────────────────────┐
│ Source 3: External APIs (OPTIONAL)         │
│ Target: Critical gaps only                 │
│ Cost: $0.00-0.05 | Time: +2-3s             │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
                DONE ✅ (5% of cases)
                Cost: $0.11-0.26
                Time: 10-16s
```

**Expected Results:**
- **70% of extractions**: Source 1 only ($0.01, 5-8s)
- **25% of extractions**: Source 1 + 2 ($0.11-0.21, 8-13s)
- **5% of extractions**: All sources ($0.11-0.26, 10-16s)
- **Average cost**: $0.05-0.10 per extraction (vs $0.30 parallel approach)
- **Average time**: 6-10 seconds (vs 15s parallel approach)

---

### Consensus-Based Confidence Scoring

Instead of simply picking the highest confidence value, we use **weighted consensus** to improve accuracy:

#### Algorithm

```typescript
function mergeFieldWithConsensus(field: string, sources: SourceResult[]) {
  // Filter out low-confidence results
  const validResults = sources.filter(s => s.confidence > 0.5);

  if (validResults.length === 0) {
    return { value: null, confidence: 0, needsReview: true };
  }

  // Count agreements (same value from multiple sources)
  const valueCounts = {};
  validResults.forEach(s => {
    valueCounts[s.value] = (valueCounts[s.value] || 0) + 1;
  });

  const maxAgreement = Math.max(...Object.values(valueCounts));

  // Case 1: Consensus (2+ sources agree)
  if (maxAgreement >= 2) {
    const consensusValue = Object.keys(valueCounts)
      .find(v => valueCounts[v] === maxAgreement);

    const agreeSources = validResults.filter(s => s.value === consensusValue);
    const avgConfidence = agreeSources.reduce((sum, s) => sum + s.confidence, 0) / agreeSources.length;

    return {
      value: consensusValue,
      confidence: Math.min(avgConfidence + 0.15, 1.0), // +15% consensus bonus
      sources: agreeSources.map(s => s.source),
      consensus: true,
      needsReview: false
    };
  }

  // Case 2: No consensus (all sources disagree)
  else {
    // Apply field-specific source weighting
    const weighted = validResults.map(s => ({
      ...s,
      weightedConfidence: s.confidence * getSourceWeight(field, s.source)
    }));

    const best = weighted.reduce((max, s) =>
      s.weightedConfidence > max.weightedConfidence ? s : max
    );

    return {
      value: best.value,
      confidence: best.confidence,
      sources: [best.source],
      consensus: false,
      needsReview: best.confidence < 0.80 // Flag for manual review
    };
  }
}
```

#### Example: Consensus Scenario

```typescript
// Field: companySize
Source 1 (Website):    "MEDIUM" (confidence: 0.75)
Source 2 (OpenAI):     "MEDIUM" (confidence: 0.80)
Source 3 (Clearbit):   "LARGE"  (confidence: 0.90)

// Analysis:
// - 2 sources agree on "MEDIUM" (consensus!)
// - 1 source says "LARGE" (outlier)

// Result:
{
  value: "MEDIUM",
  confidence: 0.92,  // (0.75 + 0.80) / 2 + 0.15 bonus = 0.925
  sources: ["website", "openai"],
  consensus: true,
  needsReview: false
}

// Why trust "MEDIUM" over "LARGE"?
// - Two independent sources agree
// - Consensus bonus increases confidence
// - Clearbit might be outdated or have different size definition
```

#### Example: No Consensus Scenario

```typescript
// Field: companySize
Source 1 (Website):    "SMALL"  (confidence: 0.70)
Source 2 (OpenAI):     "MEDIUM" (confidence: 0.75)
Source 3 (Clearbit):   "LARGE"  (confidence: 0.85)

// Analysis:
// - All sources disagree (no consensus)
// - Use field-specific source weighting

// Field-specific weights for companySize:
// - Website: 0.8 (companies may downplay size)
// - OpenAI: 1.0 (objective search results)
// - Clearbit: 1.3 (verified business data)

// Weighted scores:
// - "SMALL":  0.70 × 0.8 = 0.56
// - "MEDIUM": 0.75 × 1.0 = 0.75
// - "LARGE":  0.85 × 1.3 = 1.105 → capped at 1.0

// Result:
{
  value: "LARGE",
  confidence: 0.85,
  sources: ["clearbit"],
  consensus: false,
  needsReview: true  // Flag for user attention (confidence < 0.90)
}
```

---

### Field-Specific Source Priorities

Different fields have **authoritative sources**. We apply source-specific weights:

| Field | Website | OpenAI Search | External API | Rationale |
|-------|---------|---------------|--------------|-----------|
| **name** | **1.3** | 0.9 | 1.1 | First-party name is authoritative |
| **website** | **1.5** | 0.5 | 1.0 | Self-reference is always correct |
| **description** | **1.4** | 0.8 | 0.9 | Company's own messaging preferred |
| **industry** | 1.0 | **1.2** | **1.2** | Objective classification better |
| **size** | 0.8 | 1.0 | **1.3** | External data more accurate |
| **country** | **1.2** | 1.0 | **1.2** | Should match across sources |
| **region** | 1.1 | 1.0 | **1.2** | Geographic data is objective |
| **annualRevenue** | 0.7 | 1.0 | **1.4** | Public/verified data only |
| **geography** | 0.9 | **1.1** | **1.2** | Operational scope from external |
| **riskProfile** | 0.8 | **1.2** | 1.0 | Analysis of external factors |

**Implementation:**
```typescript
const SOURCE_WEIGHTS = {
  name: { website: 1.3, openai: 0.9, external: 1.1 },
  industry: { website: 1.0, openai: 1.2, external: 1.2 },
  size: { website: 0.8, openai: 1.0, external: 1.3 },
  annualRevenue: { website: 0.7, openai: 1.0, external: 1.4 },
  // ... etc
};

function getSourceWeight(field: string, source: string): number {
  return SOURCE_WEIGHTS[field]?.[source] ?? 1.0;
}
```

---

### Cross-Validation & Conflict Resolution

When sources **disagree significantly**, apply smart conflict resolution:

#### Strategy 1: Recency Priority

```typescript
// If sources disagree, prefer more recent data
if (result1.value !== result2.value) {
  const recencyWeight = (source) => {
    const age = Date.now() - source.timestamp;
    const monthsOld = age / (1000 * 60 * 60 * 24 * 30);

    // Decay: 100% weight if <3 months, 80% if <12 months, 50% if older
    if (monthsOld < 3) return 1.0;
    if (monthsOld < 12) return 0.8;
    return 0.5;
  };

  result1.confidence *= recencyWeight(result1);
  result2.confidence *= recencyWeight(result2);
}
```

#### Strategy 2: Majority Rules

```typescript
// If 3 sources, and 2 agree, always pick the majority
if (sources.length === 3) {
  const valueCounts = countValues(sources);
  const majority = Object.entries(valueCounts)
    .find(([value, count]) => count >= 2);

  if (majority) {
    return {
      value: majority[0],
      confidence: 0.90, // High confidence in consensus
      consensus: true
    };
  }
}
```

#### Strategy 3: Field Criticality

```typescript
const CRITICAL_FIELDS = ['name', 'country', 'website'];

// For critical fields, require higher confidence or flag for review
if (CRITICAL_FIELDS.includes(field)) {
  if (result.confidence < 0.85) {
    result.needsReview = true;
    result.criticalField = true;
  }
}
```

---

### User Feedback Loop (Future Enhancement)

Track user corrections to improve source weighting over time:

```typescript
// When user corrects a field
analytics.track('field_corrected', {
  field: 'companySize',
  extractedValue: 'SMALL',
  correctedValue: 'MEDIUM',
  sources: {
    website: { value: 'SMALL', confidence: 0.80 },
    openai: { value: 'MEDIUM', confidence: 0.75 },
  }
});

// ML model learns:
// "For companySize field, OpenAI is more accurate than website"
// Adjust weights: website 0.8 → 0.7, openai 1.0 → 1.1
```

---

### Expected Performance Improvements

| Metric | Single Source | Parallel 3-Source | **Sequential 3-Source** |
|--------|---------------|-------------------|------------------------|
| **Accuracy** | 70-80% | 90-95% | **90-95%** ✅ |
| **Coverage** | 60-70% | 85-95% | **85-95%** ✅ |
| **Avg Cost** | $0.05 | $0.30 | **$0.08** ✅ |
| **Avg Time** | 8s | 15s | **8s** ✅ |
| **Consensus Rate** | N/A | 60-70% | **60-70%** ✅ |
| **User Trust** | Medium | High | **Very High** ✅ |

**Key Insight:** Sequential approach achieves same accuracy as parallel but at **73% lower cost** and **47% faster** by avoiding unnecessary API calls.

---

### Implementation Notes

**Phase 1 (MVP - Stories 2.1-2.2):**
- Implement Source 1 (Website Scraping) only
- Single-source extraction with confidence scores
- Basic error handling

**Phase 2 (Enhanced - Story 2.1 continuation):**
- Add Source 2 (OpenAI Online Search)
- Implement sequential execution with early exit
- Implement consensus-based merging

**Phase 3 (Optional - Story 2.6):**
- Add Source 3 (External APIs)
- Full multi-source consensus
- User feedback loop
- ML-based weight optimization

---

## Fields to Auto-Populate

### Core Fields (Organization Model)
1. **name** (String) - Company legal name
2. **website** (String?) - Company website URL (user-provided)
3. **industry** (String?) - Industry/sector (e.g., "Financial Services", "Healthcare")
4. **size** (CompanySize enum) - MICRO, SMALL, MEDIUM, LARGE, ENTERPRISE
5. **country** (String) - ISO country code (e.g., "US", "GB", "DE")
6. **region** (String?) - Region/state (e.g., "California", "London")
7. **description** (String?) - Company description/mission statement

### Financial & Team Fields
8. **annualRevenue** (AnnualRevenue enum) - LESS_THAN_1M, REVENUE_1M_10M, REVENUE_10M_50M, REVENUE_50M_100M, MORE_THAN_100M
9. **complianceTeamSize** (ComplianceTeamSize enum) - NONE, SIZE_1_5, SIZE_6_10, SIZE_11_25, MORE_THAN_25
10. **geography** (Geography enum) - SINGLE_COUNTRY, MULTI_COUNTRY, REGIONAL, GLOBAL

### Risk Profile (Optional)
11. **riskProfile** (RiskProfile enum) - LOW, MEDIUM, HIGH, CRITICAL

### Extended Fields (OrganizationDraft)
12. **financialCrimeRisk** (String?) - Assessed financial crime risk level
13. **riskAppetite** (String?) - Company's risk tolerance
14. **complianceBudget** (String?) - Estimated compliance budget
15. **regulatoryRequirements** (String?) - Key regulatory requirements
16. **painPoints** (String?) - Primary compliance challenges

---

## User Flow

### Primary Flow: Website-Based Profile Creation (Registration)

```
1. User Registration
   ├─ User enters email/password
   └─ User clicks "Continue"

2. Business Profile Setup
   ├─ User enters website URL (e.g., "acme.com" or "https://www.acme.com")
   ├─ User sees checkbox: "☐ Analyze with AI to speed up the process"
   ├─ User checks the box (optional)
   └─ User clicks "Continue" or "Submit"

3. AI Extraction Process (if checkbox was checked)
   ├─ Loading overlay: "Analyzing your website... (5-10s)"
   ├─ System fetches website HTML
   ├─ AI extracts company information
   ├─ System enriches data with external sources (optional)
   ├─ System maps extracted data to profile fields
   └─ System calculates confidence scores

4. Review & Edit
   ├─ User sees form with extracted data pre-filled
   ├─ Fields with low confidence show warning indicator (⚠️)
   ├─ User reviews and corrects any inaccuracies
   ├─ User fills in missing optional fields
   └─ User clicks "Save Profile"

5. Completion
   └─ Profile saved, user proceeds to assessment
```

### Alternative Flow 1: Existing User Profile Update

```
1. User navigates to Business Profile section
2. User sees existing website field with "Analyze" button
3. User clicks "Analyze" button
4. Loading state: "Analyzing your website..."
5. Confirmation dialog: "This will update 5 empty fields. Continue?"
6. User clicks "Yes, Update"
7. Form fields auto-populate with extracted data
8. Newly filled fields are highlighted
9. User reviews and saves
```

### Alternative Flow 2: Manual Entry Fallback

```
If extraction fails or user doesn't check the box:
├─ User sees error toast: "We couldn't extract your profile. Please fill in manually."
├─ Form fields remain empty or partially filled
├─ User completes form manually
└─ User saves profile
```

---

## Stories

### Story 2.1: Implement AI Website Extraction Backend (Phased)
**Priority:** CRITICAL
**Estimated Effort:** 1-2 days (Phase 1 MVP), +1 day (Phase 2), +2-3 days (Phase 3)
**Dependencies:** OpenAI API access

**User Story:**
As a backend developer, I want to implement AI-powered website extraction starting with a simple MVP and iterating based on real user data so that we ship fast and avoid overengineering.

---

### 🚀 Phase 1: MVP (SHIP FIRST - 1-2 days)

**Goal:** Ship basic website scraping with confidence scores. Good enough for 75-85% accuracy.

**Acceptance Criteria:**
1. ✅ Enable real OpenAI integration in `backend/src/lib/ai/index.ts`
2. ✅ Implement `scrapeWebsite(url)` with Cheerio (Puppeteer fallback for JS-heavy sites)
3. ✅ Extract structured data: JSON-LD, Open Graph tags, meta tags, text content
4. ✅ Implement `extractCompanyData(content)` with GPT-4o-mini structured extraction
5. ✅ Extract all 11 core Organization fields with confidence scores (0-1)
6. ✅ Flag fields with confidence <0.70 as "needs review"
7. ✅ Handle errors gracefully (invalid URL, timeout, scraping failures)
8. ✅ Add retry logic with exponential backoff (3 retries max)
9. ✅ Cache results in Redis (TTL: 24h)
10. ✅ Complete in <10 seconds for 95% of websites
11. ✅ Return simple `FieldResult` format with value + confidence

**Technical Requirements (Phase 1):**
- **Web Scraping**: Cheerio first (fast), Puppeteer fallback (slow but handles JS)
- **AI Model**: GPT-4o-mini for cost efficiency (~$0.01 per extraction)
- **Prompting**: Structured output with JSON schema enforcement
- **Error Handling**: Return partial results if some fields fail
- **Caching**: Redis cache key = `website_extraction:${url_hash}`
- **Rate Limiting**: Max 10 extractions per user per hour
- **Logging**: Track extraction_time, fields_populated, avg_confidence

**Success Metrics (Phase 1):**
- ✅ Cost: $0.01 per extraction = **$150/month** (500 extractions/day)
- ✅ Speed: 5-8 seconds average
- ✅ Coverage: 60-80% of fields populated
- ✅ Accuracy: 75-85% (measure with user corrections)

**Exit Criteria for Phase 1:**
- ✅ All 11 fields have extraction logic
- ✅ Confidence scores working correctly
- ✅ Error handling tested with 20+ test websites
- ✅ Deployed to production and monitored for 1 week

---

### 📊 Phase 2: Enhanced (ONLY IF NEEDED - +1 day)

**Trigger:** Implement ONLY if Phase 1 accuracy <80% after 1 week of real data

**Goal:** Add OpenAI online search as fallback for low-confidence fields

**Acceptance Criteria:**
12. ⏸️ Implement `searchCompanyOnline(companyName, url)` using GPT-4 with web search
13. ⏸️ Trigger ONLY if critical fields (name, industry, size, country) have confidence <0.75
14. ⏸️ Return structured data with confidence scores
15. ⏸️ Merge with Phase 1 results using simple "pick highest confidence" strategy
16. ⏸️ Handle rate limits (max 100 searches per day initially)
17. ⏸️ Add feature flag `ENABLE_OPENAI_SEARCH` to disable if needed

**Simple Merging Logic (Phase 2):**
```typescript
// Just pick highest confidence - no fancy consensus yet
function mergeResults(websiteData, searchData) {
  return Object.keys(ALL_FIELDS).map(field => {
    const candidates = [websiteData[field], searchData[field]]
      .filter(c => c && c.confidence > 0.5);

    return candidates.reduce((best, curr) =>
      curr.confidence > best.confidence ? curr : best
    );
  });
}
```

**Success Metrics (Phase 2):**
- ⏸️ Cost: $0.10-0.20 per search, triggered ~30% of time = **$300-500/month**
- ⏸️ Speed: +3-5 seconds when triggered (total: 8-13s)
- ⏸️ Accuracy: 85-90%

---

### 🎯 Phase 3: Advanced (FUTURE - +2-3 days)

**Trigger:** Implement ONLY if Phase 2 accuracy <85% AND budget allows

**Goal:** Full multi-source with consensus, field weighting, external APIs

**Acceptance Criteria (Phase 3):**
18. 🔮 Add Source 3: External APIs (Clearbit, OpenCorporates)
19. 🔮 Implement `mergeWithConsensus()` algorithm with +15% bonus for agreement
20. 🔮 Add field-specific source weighting (see table in epic)
21. 🔮 Add recency priority (prefer data <6 months old)
22. 🔮 Implement user feedback tracking for ML optimization
23. 🔮 Return enhanced `FieldResult` with consensus metadata

**This is documented below for future reference - don't build yet!**

---

**What to Build First:**
**ONLY Phase 1** (1-2 days). Ship it. Measure accuracy with real users. Then decide if Phase 2/3 are needed.

**Files to Create/Modify:**
- `backend/src/lib/ai/website-extractor.ts` (new file)
- `backend/src/lib/ai/index.ts` (enable real implementation)
- `backend/src/lib/ai/parser.ts.disabled` → `parser.ts` (re-enable)
- `backend/src/lib/ai/analyzer.ts.disabled` → `analyzer.ts` (re-enable)

**API Design:**
```typescript
interface SourceResult {
  value: any;
  confidence: number; // 0-1
  source: 'website' | 'openai' | 'external';
  timestamp: Date;
}

interface FieldResult {
  value: any;
  confidence: number; // 0-1, includes consensus bonus
  sources: string[]; // Which sources contributed
  consensus: boolean; // True if 2+ sources agreed
  needsReview: boolean; // True if confidence < 0.70
}

interface WebsiteExtractionResult {
  success: boolean;
  data: {
    name?: FieldResult;
    industry?: FieldResult;
    size?: FieldResult;
    country?: FieldResult;
    region?: FieldResult;
    description?: FieldResult;
    annualRevenue?: FieldResult;
    complianceTeamSize?: FieldResult;
    geography?: FieldResult;
    riskProfile?: FieldResult;
  };
  metadata: {
    extractionTime: number; // milliseconds
    sourceUrl: string;
    scrapedAt: string; // ISO timestamp
    sourcesUsed: string[]; // ['website', 'openai']
    consensusRate: number; // % of fields with consensus
    avgConfidence: number; // Average confidence across all fields
  };
  errors?: string[];
}

// Example response:
{
  success: true,
  data: {
    name: {
      value: "Acme Corp",
      confidence: 0.95,
      sources: ["website", "openai"],
      consensus: true,
      needsReview: false
    },
    size: {
      value: "MEDIUM",
      confidence: 0.82,
      sources: ["website", "openai"],
      consensus: true,
      needsReview: false
    },
    annualRevenue: {
      value: "REVENUE_10M_50M",
      confidence: 0.68,
      sources: ["openai"],
      consensus: false,
      needsReview: true // User should verify
    }
  },
  metadata: {
    extractionTime: 8500,
    sourceUrl: "https://acme.com",
    scrapedAt: "2025-10-17T10:30:00Z",
    sourcesUsed: ["website", "openai"],
    consensusRate: 0.73, // 73% of fields had consensus
    avgConfidence: 0.82
  }
}
```

---

### Story 2.2: Update Organization Service for Website Extraction
**Priority:** CRITICAL
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 2.1

**User Story:**
As a backend developer, I want to update the organization service to properly orchestrate website extraction so that the API endpoint returns accurate, validated data to the frontend.

**Acceptance Criteria:**
1. ✅ Update `parseWebsite()` to call real AI extraction
2. ✅ Validate extracted data against Zod schemas
3. ✅ Store extraction results in Organization or OrganizationDraft
4. ✅ Return confidence scores and partial results
5. ✅ Add logging for extraction success/failure rates
6. ✅ Handle concurrent extraction requests (rate limiting)
7. ✅ Cache extraction results for 24 hours (Redis)

**Technical Requirements:**
- Validate URL format before extraction
- Check if website was recently extracted (cache hit)
- Store extraction metadata for analytics
- Emit events for successful/failed extractions
- Add audit log entry for data changes

**Files to Modify:**
- `backend/src/services/organization.service.ts`
- `backend/src/routes/organization.routes.ts`

**API Response:**
```typescript
POST /v1/organizations/:id/parse-website
Response: {
  success: true,
  data: {
    organization: { ...extractedFields },
    confidence: { name: 0.95, industry: 0.80, ... },
    metadata: { extractionTime: 8500, sourceUrl: "..." }
  }
}
```

---

### Story 2.3: Update Frontend UI for Website Extraction
**Priority:** HIGH
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 2.2

**User Story:**
As a new user, I want to enter my company website and optionally have AI analyze it to auto-populate my profile so that I can quickly complete onboarding without tedious manual data entry.

**Acceptance Criteria:**
1. ✅ Add checkbox next to website field in registration form: "Analyze with AI to speed up the process"
2. ✅ When checkbox is selected, trigger analysis on form submission/continue
3. ✅ Show loading state during extraction (5-10s) with progress indicator
4. ✅ Display extracted data in editable form fields
5. ✅ Make existing "Analyze" button functional in BusinessProfile component
6. ✅ Highlight fields with low confidence (<0.7) with visual indicator
7. ✅ Handle extraction errors with friendly messages
8. ✅ Allow manual edit of any auto-filled field

**Design Requirements:**
- Checkbox: "☐ Analyze with AI to speed up the process" next to website URL field
- Loading state: Progress spinner + "Analyzing your website..." message
- Visual confidence indicators (green checkmark for high confidence, yellow warning for low)
- Error handling: Toast notification for failures with option to retry
- Mobile-responsive design

**Files to Modify:**
- `frontend/src/pages/Register.tsx` (add checkbox to website field)
- `frontend/src/components/BusinessProfile.tsx` (make analyze button functional)
- `frontend/src/hooks/useWebsiteExtraction.ts` (new hook for API call)

**UI Changes:**
```typescript
// Registration Form
<Input
  label="Company Website"
  name="website"
  placeholder="acme.com"
/>
<Checkbox
  label="Analyze with AI to speed up the process"
  onChange={(checked) => setAnalyzeWithAI(checked)}
/>

// BusinessProfile Component (existing analyze button)
<Button
  onClick={handleAnalyze}
  loading={isAnalyzing}
>
  Analyze Website
</Button>
```

---

### Story 2.4: Integrate Website Extraction into Registration Flow
**Priority:** HIGH
**Estimated Effort:** 2-3 hours
**Dependencies:** Story 2.3

**User Story:**
As a new user, I want website extraction seamlessly integrated into the registration flow so that I can complete my profile in one smooth experience.

**Acceptance Criteria:**
1. ✅ When user checks "Analyze with AI" checkbox and submits, trigger extraction
2. ✅ Support website extraction in anonymous session flow (OrganizationDraft)
3. ✅ Pre-fill form fields with extracted data
4. ✅ Allow user to review and edit extracted data before final save
5. ✅ Persist extracted data across page refreshes (localStorage)
6. ✅ Track extraction success/failure in analytics
7. ✅ Handle extraction errors gracefully (show error, allow manual entry)

**Technical Requirements:**
- Call parseWebsite API when checkbox is checked on form submission
- Store extraction results temporarily in localStorage during draft
- Map extracted data to form fields
- Add analytics events (extraction_started, extraction_success, extraction_failed)
- Show visual feedback during extraction (loading overlay)

**Files to Modify:**
- `frontend/src/pages/Register.tsx` (add extraction logic)
- `frontend/src/components/BusinessProfile.tsx` (add analyze button handler)
- `frontend/src/hooks/useWebsiteExtraction.ts` (API integration hook)

---

### Story 2.5: Make Existing Analyze Button Functional for Profile Updates
**Priority:** MEDIUM
**Estimated Effort:** 1-2 hours
**Dependencies:** Story 2.2, Story 2.3

**User Story:**
As an existing user with an incomplete profile, I want to use the existing "Analyze" button in the business profile section to auto-fill missing fields so that I can improve my profile without manual data entry.

**Acceptance Criteria:**
1. ✅ Make existing "Analyze" button in BusinessProfile component functional
2. ✅ Only update empty/null fields (preserve existing data)
3. ✅ Show confirmation dialog: "This will update X empty fields. Continue?"
4. ✅ Display extracted data with visual indicators for new/updated fields
5. ✅ Require user confirmation before applying changes
6. ✅ Add audit log entry for website-based updates

**Technical Requirements:**
- Use existing `parseWebsite()` API endpoint
- Check RBAC permissions (user can only update own organization)
- Add confirmation modal before applying updates
- Highlight newly filled fields in the form

**Files to Modify:**
- `frontend/src/components/BusinessProfile.tsx` (make analyze button functional)
- `frontend/src/hooks/useWebsiteExtraction.ts` (reuse hook from Story 2.3)

---

### Story 2.6: External Data Enrichment (Optional Enhancement)
**Priority:** LOW
**Estimated Effort:** 2-3 days
**Dependencies:** Story 2.1

**User Story:**
As a product manager, I want to enrich extracted website data with external company databases so that we provide more accurate and comprehensive business profiles.

**Acceptance Criteria:**
1. ✅ Integrate with Clearbit API for company enrichment
2. ✅ Integrate with LinkedIn Company API (if available)
3. ✅ Use external data to validate/enhance AI extraction
4. ✅ Prioritize external data when confidence is high
5. ✅ Handle API rate limits and quotas gracefully
6. ✅ Cache external API responses for 30 days

**External APIs to Consider:**
- Clearbit Company API (paid, high quality)
- HunterIO Domain Search (email verification)
- LinkedIn Company Pages (if accessible)
- OpenCorporates (free, company registry data)
- Google Places API (for location data)

**Technical Requirements:**
- Create abstraction layer for external data providers
- Implement fallback chain (Clearbit → LinkedIn → OpenCorporates)
- Add feature flag for external enrichment
- Monitor API costs and usage

**Files to Create:**
- `backend/src/lib/enrichment/clearbit.ts`
- `backend/src/lib/enrichment/index.ts`

---

## Success Metrics (By Phase)

### Baseline (Current State)
- Onboarding completion time: 8-10 minutes
- Profile completion rate: 65-70%
- Field accuracy: 85% (self-reported, manual entry)
- User drop-off at profile step: 25-30%
- Cost per user: $0 (manual entry)

---

### 🚀 Phase 1 - MVP Targets (Week 1)

**Primary Goals:**
- ✅ Ship working extraction in 3-4 days
- ✅ Achieve 75-85% accuracy (good enough!)
- ✅ Keep costs low ($150/month)

**Quantitative Metrics:**
- Onboarding completion time: **3-4 minutes** (60% reduction)
- Profile completion rate: **80-85%** (+15-20%)
- **Field accuracy: 75-85%** (AI extraction)
- User drop-off at profile step: **15-20%** (30% reduction)
- **Extraction success rate: 85-90%** (at least partial results)
- **Extraction speed: 5-8 seconds**
- **Coverage: 60-80%** of fields populated
- **Cost: $0.01 per extraction** = $150/month (500/day)

**Qualitative Metrics:**
- User feedback: "This saved me time!"
- Reduced manual data entry frustration
- Platform feels "smart" and modern

**Decision Criteria:**
- ✅ If accuracy ≥80% → **Stop here, we're good!**
- ⚠️ If accuracy <80% → Consider Phase 2
- ❌ If accuracy <70% → Definitely need Phase 2

---

### 📊 Phase 2 - Enhanced Targets (Week 2 - IF NEEDED)

**Only implement if Phase 1 accuracy <80%**

**Quantitative Metrics:**
- **Field accuracy: 85-90%** (+5-10% improvement)
- **Extraction speed: 8-13 seconds** (when fallback triggered)
- **Coverage: 75-90%** of fields populated
- **Cost: $0.08-0.15 per extraction** = $300-500/month

**Decision Criteria:**
- ✅ If accuracy ≥85% → **Stop here!**
- ⚠️ If accuracy <85% AND budget allows → Consider Phase 3

---

### 🎯 Phase 3 - Advanced Targets (FUTURE)

**Only implement if Phase 2 insufficient AND budget allows**

**Quantitative Metrics:**
- **Field accuracy: 90-95%** (best-in-class)
- **Consensus rate: 60-70%** (fields with multi-source agreement)
- **Extraction speed: 8-12 seconds average**
- **Coverage: 85-95%** of fields populated
- **Cost: $0.08 per extraction** = $1,200/month (optimized)

---

### Qualitative Metrics (All Phases)
- User feedback: "Wow, that was easy!"
- Reduction in support tickets for profile issues
- Increased trust in platform ("smart" technology)
- Competitive differentiation vs manual-entry competitors
- Positive reviews mentioning "AI-powered onboarding"

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Register.tsx / BusinessProfile.tsx                   │  │
│  │  - Website URL input field                            │  │
│  │  - Checkbox: "Analyze with AI" (Register)            │  │
│  │  - "Analyze" button (BusinessProfile)                │  │
│  │  - Loading state & progress overlay                  │  │
│  │  - Auto-filled form fields with confidence indicators│  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │ POST /v1/organizations/:id/parse-website │
└──────────────────┼──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Layer                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  organization.routes.ts                               │  │
│  │  - Validate URL format                                │  │
│  │  - Check Redis cache for recent extraction           │  │
│  │  - Call OrganizationService.parseWebsite()           │  │
│  │  - Return extracted data + confidence scores         │  │
│  └───────────────┬───────────────────────────────────────┘  │
└──────────────────┼──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  organization.service.ts                              │  │
│  │  - Orchestrate extraction workflow                    │  │
│  │  - Call AI library for web scraping + extraction     │  │
│  │  - Validate extracted data (Zod schemas)             │  │
│  │  - Store in Organization/OrganizationDraft           │  │
│  │  - Cache results in Redis (TTL: 24h)                 │  │
│  └───────────────┬───────────────────────────────────────┘  │
└──────────────────┼──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      AI Library                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  website-extractor.ts                                 │  │
│  │  1. Scrape website HTML (Puppeteer/Cheerio)          │  │
│  │  2. Extract structured data (JSON-LD, meta tags)     │  │
│  │  3. Call GPT-4 for text analysis                     │  │
│  │  4. Map raw data → Organization fields               │  │
│  │  5. Calculate confidence scores (0-1)                │  │
│  │  6. Return WebsiteExtractionResult                    │  │
│  └───────────────┬───────────────────────────────────────┘  │
└──────────────────┼──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐    ┌─────────────────┐
│   OpenAI     │    │   External      │
│   GPT-4      │    │   Enrichment    │
│   API        │    │   (Optional)    │
│              │    │   - Clearbit    │
│              │    │   - LinkedIn    │
└──────────────┘    └─────────────────┘
```

### Data Flow

1. **User Input**: User enters company website URL in form
2. **User Action**: User checks "Analyze with AI" checkbox OR clicks "Analyze" button
3. **URL Validation**: Frontend validates URL format (basic check)
4. **Loading State**: Show overlay: "Analyzing your website..."
5. **API Request**: POST to `/v1/organizations/:id/parse-website`
6. **Cache Check**: Backend checks Redis for recent extraction (TTL: 24h)
7. **Web Scraping**: Puppeteer/Cheerio fetches website HTML + metadata
8. **Data Extraction**: GPT-4 analyzes content → structured data
9. **External Enrichment** (optional): Call Clearbit/LinkedIn APIs
10. **Data Mapping**: Map raw extracted data to Organization schema fields
11. **Validation**: Validate against Zod schemas + business rules
12. **Cache**: Store extraction result in Redis (TTL: 24h)
13. **Response**: Return extracted data + confidence scores to frontend
14. **Auto-Fill**: Frontend populates form fields with extracted data
15. **Visual Feedback**: Highlight newly filled fields, show confidence indicators
16. **User Review**: User reviews and edits auto-filled form
17. **Final Save**: User clicks "Save" → data persisted to database

---

## Technical Considerations

### Performance
- **Target Speed**: <15s for 95% of websites
- **Optimization Strategies**:
  - Use lightweight Cheerio for simple HTML parsing
  - Only use Puppeteer for JavaScript-heavy sites
  - Parallel execution of scraping + external API calls
  - Cache extraction results for 24 hours
  - Rate limiting to prevent abuse

### Error Handling
- **Common Errors**:
  - Invalid/unreachable URL
  - Website blocks scraping (403, captcha)
  - Timeout (website too slow)
  - GPT-4 extraction failure
  - External API rate limits
- **Mitigation**:
  - Retry logic with exponential backoff
  - Graceful degradation (partial results)
  - Clear error messages to user
  - Fallback to manual entry

### Security
- **Risks**:
  - SSRF attacks (scraping internal IPs)
  - XSS from scraped content
  - PII leakage in logs
  - OpenAI API key exposure
- **Mitigation**:
  - Whitelist public IP ranges only
  - Sanitize all scraped HTML
  - Redact sensitive data in logs
  - Use environment variables for API keys
  - Rate limiting per user

### Cost Management

**Multi-Source Cost Breakdown:**

**Source 1 - Website Scraping (Always):**
- Cost: ~$0.01 per extraction (GPT-4o-mini)
- Usage: 100% of extractions
- Monthly (500 extractions/day): ~$150

**Source 2 - OpenAI Online Search (Conditional):**
- Cost: ~$0.10-0.20 per search (GPT-4 with web search)
- Usage: ~30% of extractions (triggered only for low-confidence fields)
- Monthly (150 searches/day): ~$450-900

**Source 3 - External APIs (Optional - Story 2.6):**
- Clearbit: $99-499/month (subscription)
- OpenCorporates: Free (limited)
- Usage: ~5% of extractions (critical gaps only)

**Expected Total Monthly Cost:**
- **Without External APIs**: $600-1,050/month (500 extractions/day)
- **With External APIs**: $700-1,550/month
- **Average cost per extraction**: $0.05-0.10

**Cost Optimization Strategies:**
1. ✅ **Sequential Execution**: 70% of extractions use Source 1 only ($0.01)
2. ✅ **Confidence Thresholds**: Only trigger Source 2 if confidence <0.75
3. ✅ **Field-Specific Targeting**: Only search for low-confidence fields, not all fields
4. ✅ **Aggressive Caching**: 24h TTL reduces duplicate extractions by 40-50%
5. ✅ **GPT-4o-mini**: Use cheaper model for website scraping
6. ✅ **Rate Limiting**: Prevent abuse, cap extractions per user per day
7. ✅ **Feature Flags**: Ability to disable Source 2/3 if costs exceed budget

**Cost Comparison:**
- **Single Source**: $0.05/extraction × 500/day = $750/month
- **Parallel 3-Source**: $0.30/extraction × 500/day = $4,500/month
- **Sequential 3-Source**: $0.08/extraction × 500/day = **$1,200/month** ✅

**73% cost savings** vs parallel approach while maintaining same accuracy!

### Compliance & Privacy
- **GDPR Considerations**:
  - Only scrape publicly available data
  - Allow users to delete extracted data
  - Log extraction events for audit trail
- **Terms of Service**:
  - Respect robots.txt
  - Don't scrape competitors maliciously
  - Rate limit to avoid DoS

---

## Testing Strategy

### Unit Tests
- Website URL validation
- Data extraction from mock HTML
- Field mapping logic
- Confidence score calculation
- Error handling edge cases

### Integration Tests
- End-to-end extraction flow
- External API integration (mocked)
- Cache hit/miss scenarios
- Concurrent extraction requests

### Manual QA Test Cases
1. **Happy Path**: Extract from well-structured corporate website
2. **Small Business**: Extract from simple 1-page website
3. **Complex Site**: Extract from JavaScript-heavy SPA
4. **Invalid URL**: Test error handling for 404, timeout
5. **Low Confidence**: Review UI for uncertain extractions
6. **Mobile**: Test mobile responsiveness
7. **Skip Flow**: Test manual entry fallback

### Performance Testing
- Load test: 100 concurrent extraction requests
- Stress test: Extraction of 1000 websites in sequence
- Monitor response times, error rates, API costs

---

## Rollout Plan (Phased Approach)

### Week 1: Internal Testing + Phase 1 MVP Deployment
- **Day 1-3**: Build Phase 1 (website scraping only)
- **Day 4**: Deploy to staging environment
- **Day 5**: Team testing with 20+ test websites
- **Day 6**: Fix critical bugs
- **Day 7**: Deploy Phase 1 MVP to production (10% of users)

**Key Metrics to Watch:**
- Extraction success rate (target: 85-90%)
- Field accuracy (target: 75-85%)
- Average confidence scores
- User corrections (which fields are most often wrong?)
- Cost per extraction (target: $0.01)

---

### Week 2: Measure & Decide

**Decision Point #1: Do we need Phase 2?**

Measure Phase 1 MVP performance:
- ✅ **If accuracy ≥80%** → Expand to 100% of users, **stop here**
- ⚠️ **If accuracy 70-80%** → Consider Phase 2 (OpenAI search)
- ❌ **If accuracy <70%** → Definitely implement Phase 2

If implementing Phase 2:
- **Day 8-9**: Build OpenAI search fallback
- **Day 10**: Deploy to 10% of users
- **Day 11-14**: Measure improvement

---

### Week 3: Scale or Enhance

**If Phase 1 was sufficient:**
- Enable for 100% of new signups
- Add extraction to existing user profiles
- Monitor costs and performance
- Gather user feedback

**If Phase 2 was needed:**
- **Decision Point #2**: Is 85-90% accuracy good enough?
- ✅ **If yes** → Scale to 100%, **stop here**
- ❌ **If no** → Plan Phase 3 implementation

---

### Week 4+: Optimization & Enhancements

Only if data shows clear need:
- Phase 3: Advanced multi-source (if accuracy still insufficient)
- Story 2.6: External APIs (if budget allows)
- Field-specific improvements based on user corrections
- ML-based source weighting optimization

**Guiding Principle: Let data drive decisions, not assumptions**

---

## Risk Assessment

### High Risks 🔴
1. **Extraction Accuracy**: AI may extract incorrect data
   - **Mitigation**: Confidence scores, user review, manual override
2. **Website Blocking**: Sites may block scraping attempts
   - **Mitigation**: Retry logic, user-agent rotation, fallback to manual
3. **Performance**: Extractions may be too slow (>15s)
   - **Mitigation**: Caching, optimization, async processing

### Medium Risks 🟡
1. **Cost Overruns**: OpenAI API costs may exceed budget
   - **Mitigation**: Rate limiting, caching, cost monitoring
2. **User Confusion**: Users may not understand auto-fill
   - **Mitigation**: Clear onboarding, tooltips, help text
3. **External API Dependencies**: Clearbit/LinkedIn downtime
   - **Mitigation**: Graceful degradation, fallback to AI-only

### Low Risks 🟢
1. **Legal/Compliance**: Scraping may violate ToS
   - **Mitigation**: Respect robots.txt, public data only
2. **Browser Compatibility**: UI may break on older browsers
   - **Mitigation**: Progressive enhancement, fallback UI

---

## Epic Completion Checklist

### 🚀 Phase 1 - MVP (Week 1)
- [ ] Story 2.1 Phase 1: Website scraping with confidence scores implemented
- [ ] Story 2.2: Organization service orchestration complete
- [ ] Story 2.3: Frontend checkbox and analyze button functional
- [ ] Story 2.4: Registration flow integration complete
- [ ] Story 2.5: Existing BusinessProfile analyze button working
- [ ] Unit tests passing for extraction logic (70%+ coverage)
- [ ] Integration tests with 20+ real websites
- [ ] Performance: <10s for 95% of extractions
- [ ] Deployed to production with monitoring
- [ ] **Decision Point**: Measure accuracy for 1 week → Proceed to Phase 2?

### 📊 Phase 2 - Enhanced (IF NEEDED - Week 2)
- [ ] Story 2.1 Phase 2: OpenAI search fallback implemented
- [ ] Simple merging logic (pick highest confidence)
- [ ] Feature flag `ENABLE_OPENAI_SEARCH` added
- [ ] Rate limiting for search API (100/day initially)
- [ ] Cost monitoring dashboard (track spend)
- [ ] Performance: <13s average
- [ ] Accuracy improvement validated (85-90%)
- [ ] **Decision Point**: Good enough? Or proceed to Phase 3?

### 🎯 Phase 3 - Advanced (FUTURE)
- [ ] Story 2.1 Phase 3: Consensus algorithm implemented
- [ ] Field-specific source weighting added
- [ ] Story 2.6: External API enrichment (Clearbit, etc.)
- [ ] User feedback tracking with ML optimization
- [ ] Consensus rate 60-70% achieved
- [ ] Full documentation updated

### General (All Phases)
- [ ] Analytics tracking implemented (extraction_success, field_accuracy)
- [ ] Error monitoring (Sentry/DataDog)
- [ ] Cost alerting (if monthly > $1,500)
- [ ] API documentation updated
- [ ] User guides and inline help
- [ ] Beta testing feedback positive
- [ ] Full rollout completed (100% of users)

---

## Related Documentation

- **Architecture**: docs/architecture/ai-extraction.md (to be created)
- **API Docs**: Backend API documentation for `/parse-website` endpoint
- **User Guide**: Help center article on website extraction feature
- **Analytics**: Dashboard for extraction success/failure rates

---

**Epic Owner:** Product & Engineering
**Stakeholders:** Product team, Engineering, Users (onboarding), Sales (demo feature)

**Estimated Effort (Phased):**

**🚀 Phase 1 - MVP (SHIP FIRST):**
- Story 2.1 (Phase 1): 1-2 days (Backend - website scraping only)
- Story 2.2: 4-6 hours (Service orchestration)
- Story 2.3: 4-6 hours (Frontend UI updates)
- Story 2.4: 2-3 hours (Registration integration)
- Story 2.5: 1-2 hours (Existing profile button)
- **Total: 3-4 days** | Cost: $150/month | Accuracy: 75-85%

**📊 Phase 2 - Enhanced (IF NEEDED):**
- Story 2.1 (Phase 2): +1 day (Add OpenAI search fallback)
- **Total: +1 day** | Cost: $300-500/month | Accuracy: 85-90%

**🎯 Phase 3 - Advanced (FUTURE):**
- Story 2.1 (Phase 3): +2-3 days (Full multi-source + consensus)
- Story 2.6: +2-3 days (External API enrichment)
- **Total: +4-6 days** | Cost: $1,200/month | Accuracy: 90-95%

**Recommendation: Ship Phase 1 first, measure for 1 week, then decide**
