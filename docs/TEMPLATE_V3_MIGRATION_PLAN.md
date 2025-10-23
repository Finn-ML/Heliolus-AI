# Financial Crime Template v3.0 Migration Plan

**Version:** 1.0
**Date:** 2025-10-20
**Status:** Draft
**Owner:** Development Team

---

## Executive Summary

This document outlines the strategy for migrating from the Financial Crime Compliance Assessment Template v2.0 (24 questions) to v3.0 (85 questions) while maintaining data integrity, user experience, and backward compatibility.

**Migration Scope:**
- **New Sections:** 5 entirely new sections (CDD, Adverse Media, Fraud, Data Infrastructure, AI)
- **Enhanced Sections:** 6 existing sections with additional questions
- **Total New Questions:** 61 (from 24 to 85)
- **Affected Data:** Templates, Sections, Questions, potentially in-progress Assessments

**Key Principles:**
1. **Zero Downtime**: Deploy without interrupting service
2. **Backward Compatibility**: Maintain v2.0 for completed assessments
3. **Data Preservation**: No loss of existing assessment data
4. **User Choice**: Allow users to select template version
5. **Gradual Migration**: Phased approach with rollback capabilities

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Data Model Impact](#2-data-model-impact)
3. [Question Mapping Strategy](#3-question-mapping-strategy)
4. [Migration Phases](#4-migration-phases)
5. [Technical Implementation](#5-technical-implementation)
6. [Testing Strategy](#6-testing-strategy)
7. [Rollback Procedures](#7-rollback-procedures)
8. [User Communication](#8-user-communication)
9. [Success Metrics](#9-success-metrics)
10. [Risk Mitigation](#10-risk-mitigation)

---

## 1. Current State Analysis

### 1.1 Existing Template v2.0 Structure

```
Template: financial-crime-compliance (v2.0)
├── Section 1: Geographic Risk Assessment (4 questions)
├── Section 2: Product & Service Risk (5 questions)
├── Section 3: Transaction Risk & Monitoring (5 questions)
├── Section 4: Governance & Controls (5 questions)
└── Section 5: Regulatory Alignment (5 questions)

Total: 5 sections, 24 questions, ~45 minutes
```

### 1.2 Database State

**Query to check current state:**
```sql
-- Count existing assessments by template and status
SELECT
  t.slug,
  t.version,
  a.status,
  COUNT(a.id) as count
FROM "Assessment" a
JOIN "Template" t ON a."templateId" = t.id
WHERE t.slug = 'financial-crime-compliance'
GROUP BY t.slug, t.version, a.status;

-- Check for in-progress assessments
SELECT COUNT(*)
FROM "Assessment"
WHERE "templateId" = (
  SELECT id FROM "Template"
  WHERE slug = 'financial-crime-compliance'
)
AND status IN ('DRAFT', 'IN_PROGRESS');
```

### 1.3 Affected Components

**Backend:**
- `backend/prisma/schema.prisma` - No changes needed (schema supports versioning)
- `backend/prisma/seed-templates.ts` - Add v3.0 template
- `backend/src/services/assessment.service.ts` - Version-aware logic
- `backend/src/services/report-generator.service.ts` - Version-specific reporting
- `backend/src/routes/template.routes.ts` - Version filtering

**Frontend:**
- `frontend/src/pages/AssessmentTemplates.tsx` - Show v2.0 and v3.0 options
- `frontend/src/pages/assessment/execute/` - Handle variable question counts (assessment execution flow)
- `frontend/src/pages/AssessmentResults.tsx` - Version-aware result display
- `frontend/src/components/TemplateSelector.tsx` - Version selection UI

---

## 2. Data Model Impact

### 2.1 Schema Changes Required

**Good News:** ✅ No schema migrations needed! Current schema supports versioning.

**Existing Fields Support Migration:**
```typescript
model Template {
  version   String   @default("1.0") // ✅ Already exists
  isActive  Boolean  @default(true)  // ✅ Can deactivate v2.0 later
  slug      String   @unique          // ⚠️ Need new slug for v3.0
  // ... rest of fields
}
```

**Decision: Template Slug Strategy**

**Option A: Version Suffix (RECOMMENDED)**
```
- financial-crime-compliance        (v2.0 - keep as-is)
- financial-crime-compliance-v3     (v3.0 - new template)
```

**Option B: Same Slug, Different Version**
```
- financial-crime-compliance (version: "2.0")
- financial-crime-compliance (version: "3.0")
```

**Recommendation:** Option A (version suffix) for these reasons:
- Unique slug constraint prevents conflicts
- Clearer differentiation in queries
- Easier rollback (just deactivate v3)
- Better frontend routing (can have different URLs)

### 2.2 Data Relationships

```
Template (v2.0)                    Template (v3.0)
    |                                  |
    ├── Section 1 (4 questions)       ├── Section 1 (5 questions) ← Enhanced
    ├── Section 2 (5 questions)       ├── Section 2 (8 questions) ← Enhanced
    ├── Section 3 (5 questions)       ├── Section 3 (7 questions) ← Enhanced
    ├── Section 4 (5 questions)       ├── Section 4 (8 questions) ← Enhanced NEW
    ├── Section 5 (5 questions)       ├── Section 5 (6 questions) ← Enhanced NEW
    |                                  ├── Section 6 (10 questions) ← Enhanced
    |                                  ├── Section 7 (9 questions) ← Enhanced
    |                                  ├── Section 8 (6 questions) ← NEW
    |                                  ├── Section 9 (8 questions) ← NEW
    |                                  ├── Section 10 (7 questions) ← Enhanced
    |                                  ├── Section 11 (6 questions) ← Enhanced
    |                                  └── Section 12 (10 questions) ← NEW (optional)
    |
    ├── Assessment A (COMPLETED)
    ├── Assessment B (IN_PROGRESS)
    └── Assessment C (DRAFT)
```

**Key Insight:** No data migration needed for completed assessments. They remain linked to v2.0 template.

### 2.3 Template Weighting Strategy

**Status:** ✅ DEFINED - Regulatory-Priority Weighting with AI Integration

#### 2.3.1 Section Weights (v3.0)

The v3.0 template uses **regulatory-priority weighting** based on FATF, FFIEC BSA/AML, and EU AMLD frameworks. Sections are weighted according to their criticality in regulatory examinations and compliance program effectiveness.

**12 Sections (AI Module Integrated):**

| Section # | Section Name | Weight | % | Regulatory Rationale |
|-----------|--------------|--------|---|---------------------|
| 1 | Geographic Risk Assessment | 0.0285 | 2.85% | Risk factor, not standalone control (FATF Risk Factor) |
| 2 | Governance & Regulatory Readiness | 0.1425 | 14.25% | **HIGHEST** - FATF Pillar 1, foundation for all controls |
| 3 | Risk Assessment Framework | 0.114 | 11.4% | FATF Pillar 2 - Risk-based approach mandatory |
| 4 | Customer Due Diligence | 0.114 | 11.4% | FATF R.10 - Core KYC/CDD/EDD requirement |
| 5 | Adverse Media Screening | 0.076 | 7.6% | Enhanced due diligence component (FATF R.12) |
| 6 | Sanctions Screening | 0.114 | 11.4% | OFAC/EU sanctions - Critical regulatory priority |
| 7 | Transaction Monitoring | 0.114 | 11.4% | FATF R.11 - Record keeping & suspicious activity |
| 8 | Fraud & Identity Management | 0.076 | 7.6% | Operational risk management (Basel II/III) |
| 9 | Data & Technology Infrastructure | 0.076 | 7.6% | Enabler for other controls, increasing importance |
| 10 | Training, Culture & Awareness | 0.0475 | 4.75% | FATF R.18 - Internal controls & training |
| 11 | Monitoring, Audit & Improvement | 0.0475 | 4.75% | Continuous improvement & effectiveness testing |
| 12 | AI Readiness (Integrated) | 0.05 | 5.0% | Emerging risk - EU AI Act, Model Risk Management |
| | **TOTAL** | **1.0000** | **100%** | |

**Key Weighting Principles:**
1. **Governance First** (14.25%) - Without strong governance, all other controls fail
2. **Core Controls Cluster** (11.4% each) - CDD, Sanctions, Transaction Monitoring, Risk Assessment form the compliance "big four"
3. **Supporting Controls** (7.6% each) - Adverse Media, Fraud, Data/Tech enable core controls
4. **Foundational Elements** (4.75% each) - Training and Monitoring ensure sustainability
5. **Risk Factors** (2.85%) - Geographic risk informs but doesn't control
6. **Emerging Risk** (5%) - AI readiness reflects growing regulatory focus

**Regulatory Alignment:**
- ✅ **FATF 40 Recommendations**: Governance (R.1), Risk Assessment (R.1), CDD (R.10), Record Keeping (R.11), Training (R.18)
- ✅ **FFIEC BSA/AML Pillars**: Pillar 1 (Governance - highest weight), Pillar 2 (Risk Assessment)
- ✅ **EU AMLD6**: Customer due diligence (Articles 13-14), Sanctions screening (Article 10)
- ✅ **FCA/FINMA/MAS Standards**: Risk-based approach prioritization

**Comparison to v2.0:**
```
v2.0 (Uniform): All 5 sections @ 20% each
v3.0 (Priority): Top section 14.25%, Core controls 11.4%, Supporting 7.6%

Impact: Organizations with strong governance but weak CDD will see scores
        reflect this imbalance (as regulators expect)
```

#### 2.3.2 Question Weights (Foundational-Priority Approach)

**Strategy:** Within each section, questions are weighted based on whether they are **foundational** (regulatory requirements, critical controls) or **standard** (best practices, maturity indicators).

**Weighting Multipliers:**
- **Foundational Questions**: `weight = 1.5` to `2.0` (50-100% higher than standard)
- **Standard Questions**: `weight = 1.0` (baseline)

**Normalization:** Question weights within each section are normalized to sum to 1.0.

**Example (Governance Section - 8 questions):**

| Q# | Question Summary | Type | Raw Weight | Normalized |
|----|------------------|------|------------|------------|
| 2.1 | MLRO/Compliance Officer designation | **Foundational** | 2.0 | 0.16 (16%) |
| 2.2 | Board oversight and accountability | **Foundational** | 2.0 | 0.16 (16%) |
| 2.3 | AML/CFT policy documentation | **Foundational** | 1.5 | 0.12 (12%) |
| 2.4 | Policy update frequency | Standard | 1.0 | 0.08 (8%) |
| 2.5 | Three lines of defense model | Standard | 1.0 | 0.08 (8%) |
| 2.6 | Whistleblower protections | Standard | 1.0 | 0.08 (8%) |
| 2.7 | Third-party risk management | **Foundational** | 1.5 | 0.12 (12%) |
| 2.8 | Regulatory engagement | Standard | 1.0 | 0.08 (8%) |
| | **Section Total** | | **12.0** | **1.00** (100%) |

**Foundational Question Identification Criteria:**
1. ✅ **Explicit Regulatory Requirement**: Mandated by FATF, FFIEC, EU AMLD, or local regulator
2. ✅ **Control Effectiveness Indicator**: Without this control, program is fundamentally incomplete
3. ✅ **Examination Focus**: High priority in regulatory exams (FFIEC Manual, FCA Dear CEO letters)
4. ✅ **Remediation Urgency**: Deficiency would trigger Matter Requiring Attention (MRA) or enforcement

**Foundational Questions by Section (Examples):**

**Section 2: Governance (3 foundational of 8)**
- Q2.1: MLRO designation (FATF R.1, required)
- Q2.2: Board oversight (FATF R.1, required)
- Q2.7: Third-party due diligence (FATF R.17, required)

**Section 4: Customer Due Diligence (5 foundational of 8)**
- Q4.1: CDD policies and procedures (FATF R.10, required)
- Q4.2: Beneficial ownership identification (FATF R.24, required)
- Q4.3: Enhanced due diligence triggers (FATF R.12, required)
- Q4.5: PEP identification and screening (FATF R.12, required)
- Q4.6: Ongoing monitoring frequency (FATF R.10, required)

**Section 6: Sanctions Screening (7 foundational of 10)**
- Q6.1: Sanctions screening policies (OFAC, EU, required)
- Q6.2: Screening frequency (OFAC requirement)
- Q6.3: Sanctions list coverage (OFAC, UN, EU, required)
- Q6.4: Real-time screening (OFAC best practice)
- Q6.5: False positive management (operational requirement)
- Q6.9: Customer remediation process (OFAC requirement)
- Q6.10: Sanctions training (OFAC requirement)

**Section 7: Transaction Monitoring (6 foundational of 9)**
- Q7.1: Transaction monitoring system (FATF R.11, required)
- Q7.2: Scenarios and thresholds (regulatory expectation)
- Q7.4: Alert disposition tracking (examination focus)
- Q7.6: Investigation quality (examination focus)
- Q7.8: SAR filing process (FinCEN requirement)
- Q7.9: CTR filing process (FinCEN requirement)

**Total Foundational Questions Across All Sections: ~45 of 85 (53%)**

This ensures that compliance "must-haves" carry more weight than "nice-to-haves" in the overall risk score.

#### 2.3.3 Evidence Tier Multipliers (Unchanged)

Evidence quality continues to apply multiplicative penalties to raw AI scores:

```typescript
// From weighted-scoring.service.ts
const EVIDENCE_TIER_MULTIPLIERS = {
  TIER_0: 0.6,  // Self-declared (no supporting documents)
  TIER_1: 0.8,  // Policy documents (screenshots, PDFs)
  TIER_2: 1.0   // System-generated (reports, audit logs, data exports)
};
```

**Scoring Formula:**
```
Level 1 (Question Score):
finalScore = rawAIScore (0-5) × evidenceTier × questionWeight

Level 2 (Section Score):
sectionScore = Σ(finalScore × questionWeight) / Σ(questionWeights)

Level 3 (Overall Assessment Score):
overallScore = Σ(sectionScore × sectionWeight) × 20  // Scale to 0-100
```

**Example Calculation:**
```
Governance Section (weight: 0.1425)
├─ Q2.1 (MLRO - foundational):
│  rawScore=4.5, evidence=TIER_2(1.0), weight=0.16
│  finalScore = 4.5 × 1.0 × 0.16 = 0.72
├─ Q2.2 (Board - foundational):
│  rawScore=3.0, evidence=TIER_1(0.8), weight=0.16
│  finalScore = 3.0 × 0.8 × 0.16 = 0.384
├─ ... (6 more questions)
└─ Section Score: 3.8/5.0 (76%)

Overall Score = (3.8 × 0.1425) + (other sections...) × 20 = 72/100
```

#### 2.3.4 Implementation Approach

**Method:** Hard-code weights in seed file (Option 1 - fastest)

**File:** `backend/prisma/seed-templates-enhanced.ts`

**Section Weight Example:**
```typescript
{
  name: 'Governance & Regulatory Readiness',
  description: 'Assess governance framework and regulatory compliance readiness',
  order: 2,
  weight: 0.1425,  // 14.25% - highest section weight
  regulatoryPriority: 'FATF Pillar 1, FFIEC BSA/AML Core, EU AMLD6 Art. 8',
  questions: [
    {
      question: 'Has your organization designated a Money Laundering Reporting Officer (MLRO) or Chief Compliance Officer responsible for AML/CFT?',
      type: QuestionType.SELECT,
      weight: 2.0,  // Foundational - will be normalized to ~0.16 within section
      isFoundational: true,  // Flag for UI highlighting
      // ... rest of question config
    },
    {
      question: 'How often does senior management review compliance metrics?',
      type: QuestionType.SELECT,
      weight: 1.0,  // Standard - will be normalized to ~0.08 within section
      isFoundational: false,
      // ... rest of question config
    }
  ]
}
```

**Validation at Seed Time:**
```typescript
// Validate section weights sum to 1.0
const sectionWeightSum = template.sections.reduce((sum, s) => sum + s.weight, 0);
if (Math.abs(sectionWeightSum - 1.0) > 0.001) {
  throw new Error(`Section weights sum to ${sectionWeightSum}, must equal 1.0`);
}

// Validate question weights per section (normalized automatically by service)
for (const section of template.sections) {
  const questionWeightSum = section.questions.reduce((sum, q) => sum + q.weight, 0);
  console.log(`Section "${section.name}" raw question weight sum: ${questionWeightSum}`);
}
```

**Database Storage:**
- Section weights stored as decimal (0-1) in `Section.weight` field
- Question weights stored as decimal (0-1) in `Question.weight` field (normalized)
- Foundational flag stored in `Question.isFoundational` boolean field

**Frontend Display:**
```typescript
// frontend/src/components/assessment/results/SectionBreakdownPanel.tsx
<p className="text-xs text-gray-400">
  Weight: {(section.weight * 100).toFixed(1)}% • Evidence: {evidenceQuality.label}
</p>
```

**Admin Adjustment (Future - Story 1.18):**
When admin weight management UI is implemented, admins can adjust these weights via:
```
PUT /admin/templates/:id/weights
{
  sections: [
    { id: "section-2-id", weight: 0.1425 },
    { id: "section-3-id", weight: 0.114 },
    // ...
  ],
  rationale: "Adjusted governance weight based on FCA guidance update"
}
```

#### 2.3.5 Weighting Impact Analysis

**Expected Score Distribution Changes (v2.0 → v3.0):**

| Scenario | v2.0 Score | v3.0 Score | Change | Reason |
|----------|------------|------------|--------|--------|
| **Strong Governance, Weak Tech** | 80/100 | 85/100 | +5 | Governance weight increased (14.25%) |
| **Weak Governance, Strong Tech** | 65/100 | 58/100 | -7 | Governance deficiency penalized more |
| **Balanced Program** | 75/100 | 74/100 | -1 | Minimal change (good controls across board) |
| **Excellent CDD, No Adverse Media** | 82/100 | 78/100 | -4 | New sections expose gaps |
| **Basic Compliance** | 55/100 | 52/100 | -3 | Foundational questions weighed heavier |

**Interpretation:**
- Organizations with **strong foundational controls** (governance, CDD, sanctions) will score **higher** in v3.0
- Organizations with **advanced tech but weak governance** will score **lower** in v3.0 (more aligned with regulatory expectations)
- **More gaps identified**: v3.0 covers 61 additional areas, likely to surface previously unassessed weaknesses

**Vendor Matching Impact:**
With weighted gaps, vendor recommendations will prioritize solutions addressing **high-impact deficiencies**:
- Gap in Governance (14.25% section) → Higher priority vendor matches
- Gap in Geographic Risk (2.85% section) → Lower priority vendor matches

---

## 3. Question Mapping Strategy

### 3.1 Question Mapping Matrix

| v2.0 Section | v2.0 Q# | v3.0 Section | v3.0 Q# | Mapping Type | Notes |
|--------------|---------|--------------|---------|--------------|-------|
| **Geographic Risk** | Q1.1 | Geographic Risk | Q1.1 | **Direct** | Same question, slightly enhanced options |
| Geographic Risk | Q1.2 | Geographic Risk | Q1.2 | **Direct** | Same question, enhanced guidance |
| Geographic Risk | Q1.3 | Geographic Risk | Q1.3 | **Enhanced** | More detailed options |
| Geographic Risk | Q1.4 | Geographic Risk | Q1.4 | **Direct** | Same question |
| — | — | Geographic Risk | Q1.5 | **NEW** | High-risk jurisdiction policy |
| **Product & Service** | Q2.1 | *(Removed)* | — | **REMOVED** | Replaced by CDD section |
| Product & Service | Q2.2 | *(Removed)* | — | **REMOVED** | Replaced by CDD section |
| Product & Service | Q2.3 | *(Removed)* | — | **REMOVED** | Replaced by CDD section |
| Product & Service | Q2.4 | CDD | Q4.1 | **Moved** | Now in Customer Due Diligence |
| Product & Service | Q2.5 | CDD | Q4.2 | **Split** | Split into multiple CDD questions |
| **Transaction Risk** | Q3.1 | Transaction Monitoring | Q7.1 | **Direct** | Same question |
| Transaction Risk | Q3.2 | Transaction Monitoring | Q7.3 | **Direct** | Same question |
| Transaction Risk | Q3.3 | Transaction Monitoring | Q7.5 | **Direct** | Alert volume |
| Transaction Risk | Q3.4 | Transaction Monitoring | Q7.6 | **Direct** | Investigation process |
| Transaction Risk | Q3.5 | Transaction Monitoring | Q7.6 | **Direct** | Investigation tools |
| **Governance** | Q4.1 | Governance | Q2.1 | **Enhanced** | MLRO designation - more options |
| Governance | Q4.2 | Governance | Q2.2 | **Direct** | Board oversight |
| Governance | Q4.3 | Training | Q10.2 | **Moved** | Now in Training section |
| Governance | Q4.4 | Governance | Q2.7 | **Enhanced** | Third-party compliance |
| Governance | Q4.5 | Monitoring & Improvement | Q11.1 | **Moved** | Internal audit |
| **Regulatory** | Q5.1 | Governance | Q2.8 | **Moved** | Policy currency |
| Regulatory | Q5.2 | Transaction Monitoring | Q7.8 | **Direct** | SAR filing |
| Regulatory | Q5.3 | Transaction Monitoring | Q7.9 | **Direct** | CTR filing |
| Regulatory | Q5.4 | Monitoring & Improvement | Q11.2 | **Enhanced** | Record retention |
| Regulatory | Q5.5 | Monitoring & Improvement | Q11.6 | **Enhanced** | Regulatory history |

### 3.2 New Question Categories

**Entirely New Sections (No v2.0 Equivalent):**
1. **Risk Assessment Framework** (7 questions) - NEW
2. **Customer Due Diligence** (8 questions) - NEW (some derived from old Product & Service)
3. **Adverse Media Screening** (6 questions) - NEW
4. **Fraud & Identity Management** (6 questions) - NEW
5. **Data & Technology Infrastructure** (8 questions) - NEW
6. **AI Readiness** (10 questions) - NEW (optional module)

**Total New Questions:** 45 entirely new + 16 enhanced from v2.0

---

## 4. Migration Phases

### Phase 0: Pre-Migration (Week 1)

**Objectives:**
- Finalize v3.0 template specification
- Prepare migration scripts
- Set up testing environment

**Tasks:**
1. ✅ Complete v3.0 template specification document
2. ✅ Define section and question weighting strategy (regulatory-priority)
3. ⬜ Create seed script for v3.0 template with weights
4. ⬜ Set up migration database (copy of production)
5. ⬜ Prepare rollback scripts
6. ⬜ Document API changes
7. ⬜ Prepare user communications

**Deliverables:**
- v3.0 seed script tested on staging
- Migration runbook
- Rollback procedures documented

---

### Phase 1: Soft Launch (Week 2)

**Objectives:**
- Deploy v3.0 template alongside v2.0
- Make v3.0 available for new assessments only
- Monitor adoption and gather feedback

**Deployment Steps:**

**1. Backend Deployment**
```bash
# 1. Add v3.0 template seed script
npm run db:seed:templates-v3

# 2. Deploy backend with version-aware logic
npm run build
npm run deploy

# 3. Verify deployment
curl /api/v1/templates | jq '.data[] | {slug, version}'
```

**2. Database Changes**
```sql
-- No schema migration needed!
-- Just insert new template, sections, questions via seed script

-- Verify v3.0 template created
SELECT id, slug, version, name FROM "Template"
WHERE slug = 'financial-crime-compliance-v3';

-- Check section and question counts
SELECT
  t.slug,
  t.version,
  COUNT(DISTINCT s.id) as sections,
  COUNT(q.id) as questions
FROM "Template" t
LEFT JOIN "Section" s ON s."templateId" = t.id
LEFT JOIN "Question" q ON q."sectionId" = s.id
WHERE t.slug LIKE 'financial-crime-compliance%'
GROUP BY t.id, t.slug, t.version;
```

**3. Frontend Deployment**
```bash
# Deploy frontend with template version selector
npm run build
npm run deploy

# Feature flag (optional)
export REACT_APP_ENABLE_TEMPLATE_V3=true
```

**4. Frontend Changes Required:**

```typescript
// frontend/src/pages/AssessmentTemplates.tsx
// Add version selector/filter

interface TemplateVersion {
  slug: string;
  version: string;
  name: string;
  isRecommended: boolean;
  isNewVersion: boolean;
}

// Show badge for v3.0
{template.version === "3.0" && (
  <Badge variant="success">NEW - Enhanced Coverage</Badge>
)}

// Add version comparison modal
<TemplateComparisonModal
  v2Template={v2Template}
  v3Template={v3Template}
  onSelect={handleTemplateSelect}
/>
```

**5. Configuration:**
```typescript
// backend/src/config/templates.ts
export const TEMPLATE_CONFIG = {
  defaultVersion: '2.0', // Keep v2.0 as default initially
  enableV3: true,        // Enable v3.0 for selection
  v3RecommendedFor: ['ENTERPRISE', 'MIDMARKET'], // Recommend v3 for larger orgs
  autoMigrateStaleThreshold: 30 // Days before suggesting upgrade
};
```

**Success Criteria:**
- ✅ v3.0 template visible in template list
- ✅ Users can create new v3.0 assessments
- ✅ v2.0 assessments remain unaffected
- ✅ No errors in production logs
- ✅ Assessment execution flow works for both versions

**Rollback Trigger:**
- Critical bugs in v3.0 assessment flow
- Data corruption
- Performance degradation > 20%

---

### Phase 2: User Migration Prompts (Week 3-4)

**Objectives:**
- Encourage adoption of v3.0
- Provide migration path for in-progress v2.0 assessments
- Gather user feedback

**User Communication Strategy:**

**1. In-App Notifications:**
```typescript
// Show to users with completed v2.0 assessments
{hasCompletedV2Assessment && (
  <Alert variant="info">
    <AlertTitle>Enhanced Template Available</AlertTitle>
    <AlertDescription>
      Our Financial Crime assessment now includes 61 additional questions
      covering Customer Due Diligence, Fraud Prevention, Data Governance,
      and AI Readiness.
      <Link to="/assessments/new?template=financial-crime-compliance-v3">
        Try the enhanced assessment
      </Link>
    </AlertDescription>
  </Alert>
)}
```

**2. Email Campaign:**
```
Subject: Enhanced Financial Crime Assessment Now Available

Dear [User],

We've significantly enhanced our Financial Crime Compliance Assessment
with industry-leading coverage:

NEW SECTIONS:
✓ Customer Due Diligence (KYC/CDD/EDD) - 8 questions
✓ Adverse Media & Reputational Risk - 6 questions
✓ Fraud & Identity Management - 6 questions
✓ Data & Technology Infrastructure - 8 questions
✓ AI Readiness (optional) - 10 questions

ENHANCED SECTIONS:
✓ More detailed governance questions
✓ Expanded sanctions screening coverage
✓ Advanced transaction monitoring assessment

The v3.0 assessment provides:
- 3x more comprehensive gap analysis
- Better vendor matching precision
- Regulatory alignment with EU AI Act
- Enhanced reporting and recommendations

[Start Enhanced Assessment]

Your existing v2.0 assessments remain available for comparison.

Questions? Contact support@heliolus.com
```

**3. Dashboard Prompts:**
```typescript
// On assessment results page for v2.0
{assessment.template.version === '2.0' && (
  <UpgradeBanner>
    <Icon name="sparkles" />
    <div>
      <strong>Want deeper insights?</strong>
      <p>
        The v3.0 assessment covers 61 additional questions for
        comprehensive compliance analysis.
      </p>
    </div>
    <Button onClick={handleUpgrade}>
      Upgrade to v3.0
    </Button>
  </UpgradeBanner>
)}
```

**4. Draft Assessment Migration:**

For users with DRAFT v2.0 assessments:

```typescript
// Migration service
async function migrateAssessmentToV3(
  assessmentId: string,
  userId: string
): Promise<Assessment> {
  // 1. Load existing v2.0 draft
  const v2Assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { answers: true }
  });

  if (v2Assessment.status !== 'DRAFT') {
    throw new Error('Can only migrate draft assessments');
  }

  // 2. Create new v3.0 assessment
  const v3Template = await prisma.template.findUnique({
    where: { slug: 'financial-crime-compliance-v3' },
    include: { sections: { include: { questions: true } } }
  });

  const v3Assessment = await prisma.assessment.create({
    data: {
      organizationId: v2Assessment.organizationId,
      userId: userId,
      templateId: v3Template.id,
      status: 'DRAFT',
      responses: {},
      riskScore: null
    }
  });

  // 3. Map and copy compatible answers
  const questionMapping = getQuestionMappingV2ToV3();

  for (const v2Answer of v2Assessment.answers) {
    const v3QuestionId = questionMapping[v2Answer.questionId];

    if (v3QuestionId) {
      await prisma.answer.create({
        data: {
          assessmentId: v3Assessment.id,
          questionId: v3QuestionId,
          score: v2Answer.score,
          explanation: v2Answer.explanation,
          sourceReference: v2Answer.sourceReference,
          status: 'IN_PROGRESS' // Mark for review
        }
      });
    }
  }

  // 4. Archive old v2.0 draft
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      status: 'ARCHIVED',
      metadata: { migratedTo: v3Assessment.id }
    }
  });

  return v3Assessment;
}
```

**Success Criteria:**
- ✅ 20% of new assessments use v3.0
- ✅ < 5% user complaints about complexity
- ✅ Average completion rate > 85%
- ✅ No data loss in migrations

---

### Phase 3: V3.0 as Default (Week 5-6)

**Objectives:**
- Make v3.0 the default template for new assessments
- Keep v2.0 available for legacy/comparison
- Monitor long-term adoption

**Configuration Change:**
```typescript
// backend/src/config/templates.ts
export const TEMPLATE_CONFIG = {
  defaultVersion: '3.0', // 👈 Change from '2.0' to '3.0'
  showVersionSelector: true,
  allowV2: true, // Still allow v2.0 selection
  v2DeprecationDate: '2025-12-31'
};
```

**UI Changes:**
```typescript
// Template selector shows v3.0 first
<TemplateCard
  template={v3Template}
  badge="Recommended"
  isDefault={true}
/>
<TemplateCard
  template={v2Template}
  badge="Legacy"
  isDefault={false}
/>
```

**Analytics Tracking:**
```typescript
// Track template version adoption
analytics.track('assessment_started', {
  templateSlug: template.slug,
  templateVersion: template.version,
  userCompanySize: organization.size,
  migrationPath: 'new' | 'upgraded_from_v2'
});
```

**Success Criteria:**
- ✅ 80% of new assessments use v3.0
- ✅ Completion rate similar to v2.0 (85%+)
- ✅ User satisfaction score > 4.0/5.0
- ✅ Average time to complete < 90 minutes

---

### Phase 4: V2.0 Deprecation (3-6 months later)

**Objectives:**
- Retire v2.0 template for new assessments
- Maintain read-only access for completed v2.0 assessments
- Complete migration to v3.0

**Actions:**
```sql
-- Mark v2.0 as inactive (no new assessments)
UPDATE "Template"
SET "isActive" = false,
    "deprecatedAt" = NOW(),
    "deprecationMessage" = 'This template version has been superseded by v3.0. Completed assessments remain accessible.'
WHERE slug = 'financial-crime-compliance' AND version = '2.0';

-- Verify no new v2.0 assessments created
SELECT COUNT(*)
FROM "Assessment" a
JOIN "Template" t ON a."templateId" = t.id
WHERE t.slug = 'financial-crime-compliance'
  AND t.version = '2.0'
  AND a."createdAt" > '2025-XX-XX'; -- Deprecation date
```

**Maintain Backward Compatibility:**
- ✅ v2.0 assessment results remain viewable
- ✅ v2.0 reports can be regenerated
- ✅ v2.0 data included in exports
- ✅ API returns correct template version in responses

---

## 5. Technical Implementation

### 5.1 Seed Script for v3.0

**File:** `backend/prisma/seed-templates-v3.ts`

```typescript
import { seedEnhancedTemplates } from './seed-templates-enhanced';

async function main() {
  console.log('🌱 Seeding Financial Crime Template v3.0...');

  try {
    // Check if v3.0 already exists
    const existing = await prisma.template.findUnique({
      where: { slug: 'financial-crime-compliance-v3' }
    });

    if (existing) {
      console.log('⚠️  v3.0 template already exists. Skipping...');
      console.log('💡 To re-seed, first delete the template:');
      console.log('   DELETE FROM "Template" WHERE slug = \'financial-crime-compliance-v3\';');
      return;
    }

    // Seed v3.0 template
    await seedEnhancedTemplates();

    console.log('✅ v3.0 template seeded successfully');

    // Verification
    const v3Template = await prisma.template.findUnique({
      where: { slug: 'financial-crime-compliance-v3' },
      include: {
        sections: {
          include: {
            questions: true
          }
        }
      }
    });

    const sectionCount = v3Template.sections.length;
    const questionCount = v3Template.sections.reduce(
      (sum, s) => sum + s.questions.length,
      0
    );

    console.log(`📊 Template created:`);
    console.log(`   Sections: ${sectionCount}`);
    console.log(`   Questions: ${questionCount}`);
    console.log(`   Version: ${v3Template.version}`);
    console.log(`   Active: ${v3Template.isActive}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

**Run Command:**
```bash
cd backend
npx tsx prisma/seed-templates-v3.ts
```

### 5.2 Question Mapping Configuration

**File:** `backend/src/config/template-migration-map.ts`

```typescript
/**
 * Mapping from v2.0 question IDs to v3.0 question IDs
 * Used for migrating draft assessments from v2.0 to v3.0
 */
export const V2_TO_V3_QUESTION_MAPPING: Record<string, string | string[] | null> = {
  // Geographic Risk Assessment
  'v2-geo-q1': 'v3-geo-q1',     // Direct mapping
  'v2-geo-q2': 'v3-geo-q2',     // Direct mapping
  'v2-geo-q3': 'v3-geo-q3',     // Enhanced but compatible
  'v2-geo-q4': 'v3-geo-q4',     // Direct mapping

  // Product & Service Risk → Moved to CDD
  'v2-prod-q1': null,           // Removed (replaced by CDD)
  'v2-prod-q2': null,           // Removed (replaced by CDD)
  'v2-prod-q3': null,           // Removed (replaced by CDD)
  'v2-prod-q4': 'v3-cdd-q1',    // Moved to Customer Due Diligence
  'v2-prod-q5': ['v3-cdd-q2', 'v3-cdd-q3'], // Split into multiple CDD questions

  // Transaction Risk & Monitoring
  'v2-trans-q1': 'v3-trans-q1', // Direct mapping
  'v2-trans-q2': 'v3-trans-q3', // Renumbered
  'v2-trans-q3': 'v3-trans-q5', // Alert volume
  'v2-trans-q4': 'v3-trans-q6', // Investigation
  'v2-trans-q5': 'v3-trans-q6', // Investigation tools (merged)

  // Governance & Controls
  'v2-gov-q1': 'v3-gov-q1',     // MLRO
  'v2-gov-q2': 'v3-gov-q2',     // Board oversight
  'v2-gov-q3': 'v3-train-q2',   // Moved to Training section
  'v2-gov-q4': 'v3-gov-q7',     // Third-party
  'v2-gov-q5': 'v3-audit-q1',   // Moved to Monitoring & Improvement

  // Regulatory Alignment
  'v2-reg-q1': 'v3-gov-q8',     // Policy currency
  'v2-reg-q2': 'v3-trans-q8',   // SAR filing
  'v2-reg-q3': 'v3-trans-q9',   // CTR filing
  'v2-reg-q4': 'v3-audit-q2',   // Record retention
  'v2-reg-q5': 'v3-audit-q6',   // Regulatory history
};

/**
 * Get v3.0 question ID(s) for a given v2.0 question ID
 */
export function getV3QuestionIds(v2QuestionId: string): string[] {
  const mapping = V2_TO_V3_QUESTION_MAPPING[v2QuestionId];

  if (!mapping) return [];
  if (typeof mapping === 'string') return [mapping];
  return mapping;
}

/**
 * Check if a v2.0 question has an equivalent in v3.0
 */
export function hasV3Equivalent(v2QuestionId: string): boolean {
  const mapping = V2_TO_V3_QUESTION_MAPPING[v2QuestionId];
  return mapping !== null && mapping !== undefined;
}
```

### 5.3 Backend Service Updates

**File:** `backend/src/services/template.service.ts`

```typescript
/**
 * Get available templates with version filtering
 */
async getTemplates(options?: {
  category?: TemplateCategory;
  includeInactive?: boolean;
  latestVersionOnly?: boolean;
}): Promise<Template[]> {
  const templates = await prisma.template.findMany({
    where: {
      isActive: options?.includeInactive ? undefined : true,
      category: options?.category
    },
    include: {
      sections: {
        include: {
          questions: true
        },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: [
      { category: 'asc' },
      { version: 'desc' }, // Newer versions first
      { createdAt: 'desc' }
    ]
  });

  // Filter to latest version only if requested
  if (options?.latestVersionOnly) {
    const latestBySlugBase = new Map<string, Template>();

    for (const template of templates) {
      // Extract base slug (remove version suffix if present)
      const baseSlug = template.slug.replace(/-v\d+$/, '');

      if (!latestBySlugBase.has(baseSlug)) {
        latestBySlugBase.set(baseSlug, template);
      }
    }

    return Array.from(latestBySlugBase.values());
  }

  return templates;
}

/**
 * Compare two template versions
 */
async compareTemplateVersions(
  slug1: string,
  slug2: string
): Promise<TemplateComparison> {
  const [t1, t2] = await Promise.all([
    this.getTemplateBySlug(slug1),
    this.getTemplateBySlug(slug2)
  ]);

  const q1Count = t1.sections.reduce((sum, s) => sum + s.questions.length, 0);
  const q2Count = t2.sections.reduce((sum, s) => sum + s.questions.length, 0);

  return {
    template1: { slug: t1.slug, version: t1.version, questionCount: q1Count },
    template2: { slug: t2.slug, version: t2.version, questionCount: q2Count },
    newSections: this.findNewSections(t1, t2),
    enhancedSections: this.findEnhancedSections(t1, t2),
    removedSections: this.findRemovedSections(t1, t2),
    questionDelta: q2Count - q1Count,
    estimatedAdditionalTime: Math.ceil((q2Count - q1Count) * 1.5) // 1.5 min per question
  };
}
```

### 5.4 Frontend Components

**File:** `frontend/src/components/TemplateVersionSelector.tsx`

```typescript
interface TemplateVersionSelectorProps {
  baseTemplate: string;
  onSelect: (template: Template) => void;
}

export function TemplateVersionSelector({ baseTemplate, onSelect }: TemplateVersionSelectorProps) {
  const { data: versions } = useQuery({
    queryKey: ['template-versions', baseTemplate],
    queryFn: () => api.templates.getVersions(baseTemplate)
  });

  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {versions?.map(version => (
          <Card
            key={version.slug}
            className={cn(
              'cursor-pointer transition-all',
              version.isRecommended && 'border-blue-500 border-2'
            )}
            onClick={() => onSelect(version)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{version.name}</CardTitle>
                  <CardDescription>Version {version.version}</CardDescription>
                </div>
                {version.isRecommended && (
                  <Badge variant="default">Recommended</Badge>
                )}
                {version.version === '3.0' && (
                  <Badge variant="success">NEW</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{version.estimatedMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileQuestion className="h-4 w-4" />
                  <span>{version.questionCount} questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span>{version.sectionCount} sections</span>
                </div>
              </div>

              {version.version === '3.0' && (
                <div className="mt-4 text-sm text-blue-600">
                  <CheckCircle2 className="inline h-4 w-4 mr-1" />
                  Includes new sections: CDD, Adverse Media, Fraud, Data Infrastructure, AI
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => setShowComparison(true)}
      >
        <GitCompare className="mr-2 h-4 w-4" />
        Compare Versions
      </Button>

      {showComparison && (
        <TemplateComparisonModal
          versions={versions}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
```

---

## 6. Testing Strategy

### 6.1 Test Scenarios

**Scenario 1: New v3.0 Assessment**
```
GIVEN a user starting a new assessment
WHEN they select the v3.0 template
THEN they should see all 85 questions across 12 sections
AND the assessment execution flow should work correctly
AND they can save progress and resume
AND they can complete and generate a report
```

**Scenario 2: Existing v2.0 Assessment**
```
GIVEN a completed v2.0 assessment
WHEN the user views the results
THEN they should see all original 24 questions and answers
AND the report should generate correctly
AND the risk score should display correctly
AND they should see an option to start a v3.0 assessment
```

**Scenario 3: Draft Migration**
```
GIVEN a user with an in-progress v2.0 assessment
WHEN they choose to migrate to v3.0
THEN compatible answers should be preserved
AND they should be prompted to answer new questions
AND no data should be lost
AND the old draft should be archived
```

**Scenario 4: Template Selection**
```
GIVEN a user on the template selection page
WHEN they view available templates
THEN v3.0 should be marked as "Recommended"
AND v2.0 should be marked as "Legacy"
AND they should see a comparison option
AND the question counts should be accurate
```

### 6.2 Test Execution Plan

**Phase 1: Unit Tests**
```bash
# Backend
cd backend
npm run test -- --testPathPattern=template

# Test cases:
# - Question mapping logic
# - Version comparison
# - Migration service
# - Backward compatibility
```

**Phase 2: Integration Tests**
```bash
# Test full assessment flow for v3.0
npm run test:integration -- --grep "v3.0"

# Test cases:
# - Complete v3.0 assessment end-to-end
# - Generate v3.0 report
# - Vendor matching with v3.0 gaps
# - API backward compatibility
```

**Phase 3: Staging Tests**
```bash
# Deploy to staging
npm run deploy:staging

# Manual test checklist:
# ✅ Create new v3.0 assessment
# ✅ Complete all 85 questions
# ✅ Generate report
# ✅ View v2.0 assessment (regression)
# ✅ Migrate draft from v2.0 to v3.0
# ✅ Template comparison modal
# ✅ Mobile responsive
```

**Phase 4: Production Smoke Tests**
```bash
# After production deployment
npm run test:smoke

# Verify:
# ✅ v3.0 template appears in list
# ✅ Can start v3.0 assessment
# ✅ v2.0 assessments still work
# ✅ No 500 errors in logs
# ✅ Performance < 2s for template list
```

### 6.3 Load Testing

```yaml
# k6 load test script
scenarios:
  v3_assessment_creation:
    executor: ramping-vus
    stages:
      - duration: 5m
        target: 50  # 50 concurrent users
      - duration: 10m
        target: 50
      - duration: 5m
        target: 0

    tests:
      - POST /api/v1/assessments (v3.0 template)
      - GET /api/v1/assessments/:id
      - PATCH /api/v1/assessments/:id (answer questions)
      - POST /api/v1/assessments/:id/complete

  acceptance_criteria:
    p95_response_time: < 2s
    error_rate: < 1%
    throughput: > 100 req/s
```

---

## 7. Rollback Procedures

### 7.1 Rollback Decision Criteria

**Trigger rollback if:**
- 🚨 Critical bug prevents v3.0 assessment completion (> 10% failure rate)
- 🚨 Data corruption or loss detected
- 🚨 Performance degradation > 50% (p95 latency)
- 🚨 Error rate > 5% for v3.0 operations
- 🚨 Database integrity issues
- ⚠️ User complaints > 20% of new assessments

**DO NOT rollback for:**
- ✅ Individual user issues (handle via support)
- ✅ Feature requests or enhancements
- ✅ Minor UI bugs (fix forward)
- ✅ Completion rate slightly lower than v2.0 (expected for longer assessment)

### 7.2 Rollback Steps

**Option A: Soft Rollback (Deactivate v3.0)**
```sql
-- Mark v3.0 as inactive
UPDATE "Template"
SET "isActive" = false,
    "metadata" = jsonb_set(
      COALESCE("metadata", '{}'),
      '{rollbackReason}',
      '"Critical bug in production - temporary deactivation"'
    )
WHERE slug = 'financial-crime-compliance-v3';

-- Verify: v3.0 no longer appears in active templates
SELECT slug, version, "isActive" FROM "Template"
WHERE slug LIKE 'financial-crime%';
```

**Effect:**
- ✅ v3.0 immediately hidden from template list
- ✅ v2.0 remains available for new assessments
- ✅ Existing v3.0 assessments remain accessible (read-only)
- ✅ No data loss

**Option B: Hard Rollback (Delete v3.0)**
```sql
-- ⚠️ DANGER: This deletes v3.0 and all associated data

-- 1. Backup first!
pg_dump -t '"Template"' -t '"Section"' -t '"Question"' \
  --data-only > v3_template_backup.sql

-- 2. Check for existing v3.0 assessments
SELECT COUNT(*) FROM "Assessment" a
JOIN "Template" t ON a."templateId" = t.id
WHERE t.slug = 'financial-crime-compliance-v3';

-- 3. If assessments exist, STOP and use Soft Rollback!
-- If no assessments, proceed:

-- 4. Delete v3.0 template (cascade deletes sections/questions)
DELETE FROM "Template"
WHERE slug = 'financial-crime-compliance-v3';

-- 5. Verify deletion
SELECT slug, version FROM "Template";
```

**Effect:**
- ⚠️ v3.0 template completely removed
- ⚠️ Any v3.0 assessments become orphaned (must be handled separately)
- ✅ Clean slate for re-seeding fixed v3.0

### 7.3 Rollback Verification

**Checklist:**
```bash
# 1. Verify v3.0 not visible in UI
curl https://app.heliolus.com/api/v1/templates | jq '.data[] | select(.slug | contains("v3"))'
# Expected: Empty array

# 2. Verify v2.0 still works
curl https://app.heliolus.com/api/v1/templates/financial-crime-compliance
# Expected: v2.0 template data

# 3. Check for orphaned assessments
psql -c "SELECT COUNT(*) FROM \"Assessment\" WHERE \"templateId\" NOT IN (SELECT id FROM \"Template\")"
# Expected: 0

# 4. Monitor error logs
tail -f /var/log/app/error.log | grep -i template
# Expected: No template-related errors

# 5. User experience check
# - Can users create new v2.0 assessments? ✅
# - Can users view old v2.0 results? ✅
# - No broken UI elements? ✅
```

### 7.4 Post-Rollback Actions

1. **Incident Report:** Document what went wrong and why
2. **Fix Root Cause:** Address the issue in development
3. **Re-test:** Verify fix in staging before re-deployment
4. **User Communication:** Notify users of temporary unavailability
5. **Re-deployment Plan:** Schedule v3.0 re-launch with fixes

---

## 8. User Communication

### 8.1 Pre-Launch Announcement

**Email:** 1 week before launch
```
Subject: Coming Soon: Enhanced Financial Crime Assessment

Dear [User],

We're excited to announce a major upgrade to our Financial Crime
Compliance Assessment, launching [DATE].

What's New:
✨ 61 additional questions for comprehensive coverage
✨ 5 new assessment areas (CDD, Adverse Media, Fraud, Data, AI)
✨ Enhanced gap analysis and vendor matching
✨ Regulatory alignment with latest standards

Your existing assessments will remain accessible. The enhanced
assessment will be available as an option alongside our current
version.

Questions? Reply to this email or contact support@heliolus.com

Best regards,
The Heliolus Team
```

### 8.2 Launch Announcement

**Email + In-App Banner:** Day of launch
```
Subject: 🚀 Enhanced Financial Crime Assessment Now Live

Dear [User],

Our enhanced Financial Crime Compliance Assessment (v3.0) is now
available!

[Start Enhanced Assessment]

Key Benefits:
✓ 360° compliance coverage with 85 comprehensive questions
✓ Better vendor matching with detailed gap analysis
✓ Industry-leading assessment framework
✓ Optional AI readiness module

Your existing assessments remain available for reference and
comparison.

Learn more: [Link to documentation]
Watch demo: [Link to video tutorial]

Questions? Visit our help center or contact support.

The Heliolus Team
```

### 8.3 User Guide

**Help Center Article:** "Understanding Template Versions"

```markdown
# Understanding Template Versions

## What's the difference between v2.0 and v3.0?

### Version 2.0 (Legacy)
- 24 questions across 5 sections
- 45 minutes to complete
- Basic compliance coverage
- Launched: 2024-09-01

### Version 3.0 (Enhanced)
- 85 questions across 12 sections
- 75-90 minutes to complete
- Comprehensive compliance coverage
- Includes: CDD, Adverse Media, Fraud, Data Infrastructure, AI
- Launched: 2025-XX-XX

## Which version should I use?

### Choose v3.0 if you want:
✓ Comprehensive gap analysis
✓ Better vendor matching precision
✓ Coverage of emerging risks (AI, crypto)
✓ Detailed reporting for regulators
✓ Enterprise-grade assessment

### Choose v2.0 if you want:
✓ Quick baseline assessment
✓ Faster completion time
✓ Basic compliance overview
✓ Consistency with prior assessments

## Can I migrate from v2.0 to v3.0?

Yes! If you have a draft v2.0 assessment, we can migrate
compatible answers to v3.0. [Contact support] for assistance.

Completed v2.0 assessments remain available for viewing but
cannot be converted to v3.0.

## Will v2.0 be removed?

Not immediately. v2.0 will remain available for several months
to allow time for transition. We'll notify users well in advance
of any deprecation.
```

---

## 9. Success Metrics

### 9.1 Key Performance Indicators (KPIs)

**Adoption Metrics:**
```typescript
interface AdoptionMetrics {
  // Target: 80% within 6 weeks
  v3AdoptionRate: number; // Percentage of new assessments using v3.0

  // Target: 500 within first month
  totalV3Assessments: number;

  // Target: > v2.0 completion rate (85%)
  v3CompletionRate: number;

  // Target: < 90 minutes
  avgCompletionTime: number;

  // Target: < 10%
  dropoffRate: number; // Users who start but don't complete
}
```

**Quality Metrics:**
```typescript
interface QualityMetrics {
  // Target: < 1%
  errorRate: number; // API errors during v3.0 assessments

  // Target: < 2s (p95)
  responseTime: number;

  // Target: 0 critical bugs
  criticalBugs: number;

  // Target: > 4.0/5.0
  userSatisfaction: number;

  // Target: < 5% of assessments
  supportTickets: number; // v3.0-related tickets
}
```

**Business Metrics:**
```typescript
interface BusinessMetrics {
  // Target: +20% vs v2.0
  vendorMatchQuality: number; // Match score improvement

  // Target: +15% vs v2.0
  reportValue: number; // User-perceived value of reports

  // Target: +10% vs v2.0
  premiumConversions: number; // Free → Premium due to v3.0

  // Target: Maintain or improve
  retentionRate: number;
}
```

### 9.2 Monitoring Dashboard

```sql
-- Daily metrics query
SELECT
  DATE(a."createdAt") as date,
  t.version,
  COUNT(a.id) as assessments_started,
  COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as assessments_completed,
  ROUND(AVG(EXTRACT(EPOCH FROM (a."completedAt" - a."createdAt")) / 60), 1) as avg_minutes,
  ROUND(100.0 * COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) / COUNT(a.id), 1) as completion_rate
FROM "Assessment" a
JOIN "Template" t ON a."templateId" = t.id
WHERE t.slug LIKE 'financial-crime%'
  AND a."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(a."createdAt"), t.version
ORDER BY date DESC, t.version;
```

**Grafana Dashboard Panels:**
1. v3.0 Adoption Rate (line chart)
2. Completion Rate Comparison (bar chart)
3. Average Completion Time (histogram)
4. Error Rate (line chart)
5. User Satisfaction (gauge)
6. Support Ticket Volume (line chart)

---

## 10. Risk Mitigation

### 10.1 Identified Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Low adoption of v3.0** | Medium | Medium | - Make v3.0 default<br>- User education<br>- In-app prompts<br>- Email campaigns |
| **High dropout rate (too long)** | Medium | High | - Clear progress indicators<br>- Save progress frequently<br>- Section-by-section completion<br>- Optional AI module |
| **Data migration errors** | Low | Critical | - Extensive testing<br>- Soft launch<br>- Backup before migration<br>- Rollback procedures |
| **Performance degradation** | Low | High | - Load testing before launch<br>- Database indexing<br>- Query optimization<br>- Caching strategy |
| **User confusion (2 versions)** | Medium | Low | - Clear version labeling<br>- Comparison tool<br>- Help documentation<br>- Support training |
| **Vendor matching accuracy drop** | Low | Medium | - Enhanced category mapping<br>- Scoring algorithm tuning<br>- A/B testing results |
| **Backward compatibility issues** | Low | Critical | - Comprehensive regression testing<br>- Version-aware API<br>- Schema design review |

### 10.2 Contingency Plans

**If adoption < 20% after 2 weeks:**
1. Conduct user surveys to understand barriers
2. Simplify onboarding with guided tour
3. Offer incentives (free report for v3.0 completion)
4. A/B test different messaging

**If completion rate < 70%:**
1. Analyze dropout points (which sections?)
2. Shorten or simplify problematic sections
3. Add more help text and examples
4. Consider breaking into multiple shorter assessments

**If performance issues:**
1. Enable query caching for template data
2. Implement database read replicas
3. Add CDN for frontend assets
4. Optimize N+1 queries

**If vendor matching degrades:**
1. Rollback matching algorithm to previous version
2. Retrain ML models with v3.0 data
3. Manual curation of matches temporarily
4. Gradual algorithm rollout with A/B testing

---

## 11. Post-Migration Activities

### 11.1 30-Day Review

**Schedule:** [DATE + 30 days]

**Review Checklist:**
- ✅ Adoption rate meets target (80%)
- ✅ Completion rate acceptable (> 85%)
- ✅ No critical bugs remaining
- ✅ Performance within SLA
- ✅ User satisfaction > 4.0/5.0
- ✅ Support ticket volume manageable

**Action Items:**
1. Review metrics dashboard
2. Analyze user feedback
3. Prioritize enhancement backlog
4. Plan for v2.0 deprecation timeline
5. Update documentation based on learnings

### 11.2 90-Day Review

**Schedule:** [DATE + 90 days]

**Review Checklist:**
- ✅ v3.0 is default template
- ✅ > 90% of new assessments use v3.0
- ✅ Business metrics showing improvement
- ✅ No regression in key features
- ✅ Vendor ecosystem adapted to new gaps

**Decisions:**
- [ ] Set v2.0 deprecation date
- [ ] Plan v3.1 enhancements
- [ ] Evaluate AI module adoption
- [ ] Consider template for other compliance areas

### 11.3 Continuous Improvement

**Feedback Loop:**
```
User Feedback → Analysis → Prioritization → Development → Testing → Deployment
                    ↑                                                    ↓
                    └────────────────────────────────────────────────────┘
```

**Enhancement Ideas:**
1. Add more pre-filled answer suggestions
2. Industry-specific question sets
3. Regulatory template variants (FCA, FINMA, MAS)
4. Collaborative assessment (multi-user)
5. Integration with compliance management systems
6. Real-time regulatory update notifications

---

## 12. Appendices

### Appendix A: Question Mapping Details

[See Section 3.1 for complete question mapping matrix]

### Appendix B: API Changes

**New Endpoints:**
```typescript
// Get all template versions for a base template
GET /api/v1/templates/:baseSlug/versions

// Compare two template versions
GET /api/v1/templates/compare?slug1=X&slug2=Y

// Migrate draft assessment to new template
POST /api/v1/assessments/:id/migrate
Body: { targetTemplateSlug: 'financial-crime-compliance-v3' }
```

**Modified Endpoints:**
```typescript
// Template list now includes version in response
GET /api/v1/templates
Response: {
  data: [{
    id: string,
    slug: string,
    version: string, // ← Added
    name: string,
    questionCount: number,
    estimatedMinutes: number,
    isRecommended: boolean, // ← Added
    isLatestVersion: boolean // ← Added
  }]
}
```

### Appendix C: Database Backup Script

```bash
#!/bin/bash
# backup-before-v3-migration.sh

BACKUP_DIR="/backups/template-v3-migration"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pre-v3-migration_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "🔒 Starting database backup before v3.0 migration..."

# Backup relevant tables
pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  -t '"Template"' \
  -t '"Section"' \
  -t '"Question"' \
  -t '"Assessment"' \
  -t '"Answer"' \
  --clean \
  --if-exists \
  > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "✅ Backup successful: $BACKUP_FILE"

  # Compress backup
  gzip $BACKUP_FILE
  echo "✅ Compressed: ${BACKUP_FILE}.gz"

  # Verify backup
  FILESIZE=$(stat -f%z "${BACKUP_FILE}.gz")
  if [ $FILESIZE -gt 1000 ]; then
    echo "✅ Backup verified (size: $FILESIZE bytes)"
  else
    echo "⚠️  Warning: Backup file seems too small"
    exit 1
  fi
else
  echo "❌ Backup failed!"
  exit 1
fi

# Keep last 10 backups
ls -t $BACKUP_DIR/*.sql.gz | tail -n +11 | xargs rm -f
echo "✅ Cleaned up old backups"

echo "🎉 Backup complete!"
```

### Appendix D: Restore Procedure

```bash
#!/bin/bash
# restore-from-backup.sh

if [ -z "$1" ]; then
  echo "Usage: ./restore-from-backup.sh <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE=$1

echo "⚠️  This will restore the database from: $BACKUP_FILE"
echo "⚠️  Current data will be REPLACED!"
read -p "Are you sure? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
  echo "Restore cancelled."
  exit 1
fi

# Decompress
gunzip -c $BACKUP_FILE > /tmp/restore.sql

# Restore
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < /tmp/restore.sql

if [ $? -eq 0 ]; then
  echo "✅ Restore successful"
  rm /tmp/restore.sql
else
  echo "❌ Restore failed"
  exit 1
fi
```

---

## Document Control

**Version History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-20 | Development Team | Initial migration plan |
| 1.1 | 2025-10-20 | Development Team | Added Section 2.3: Complete weighting strategy (regulatory-priority, 12 sections with AI integrated, foundational question approach) |

**Approvals:**
- [ ] Technical Lead
- [ ] Product Manager
- [ ] DevOps Lead
- [ ] QA Lead

**Related Documents:**
- [Financial Crime Template v3.0 Specification](./FINANCIAL_CRIME_TEMPLATE_V3_SPECIFICATION.md)
- [Database Schema Documentation](../backend/prisma/schema.prisma)
- [API Documentation](../docs/api/README.md)

---

**End of Migration Plan**
