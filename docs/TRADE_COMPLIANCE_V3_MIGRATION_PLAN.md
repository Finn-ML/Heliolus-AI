# Trade Compliance Template v3.0 Migration Plan

**Version:** 1.0
**Date:** 2025-10-21
**Status:** Draft
**Owner:** Development Team

---

## Executive Summary

This document outlines the strategy for migrating from the Trade Compliance Assessment Template v2.0 (25 questions) to v3.0 (105 questions) while maintaining data integrity, user experience, and backward compatibility.

**Migration Scope:**
- **New Sections:** 5 entirely new sections (Trade Risk Assessment, Trade Finance, Data/Tech, Training, Monitoring/Audit)
- **Enhanced Sections:** All 5 existing sections significantly expanded
- **Total New Questions:** 80 (from 25 to 105)
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
Template: trade-compliance-assessment (v2.0)
├── Section 1: Export Controls (5 questions)
├── Section 2: Import Regulations (5 questions)
├── Section 3: Trade Sanctions (5 questions)
├── Section 4: Documentation & Procedures (5 questions)
└── Section 5: Supply Chain Compliance (5 questions)

Total: 5 sections, 25 questions, ~40 minutes
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
WHERE t.slug = 'trade-compliance-assessment'
GROUP BY t.slug, t.version, a.status;

-- Check for in-progress assessments
SELECT COUNT(*)
FROM "Assessment"
WHERE "templateId" = (
  SELECT id FROM "Template"
  WHERE slug = 'trade-compliance-assessment'
)
AND status IN ('DRAFT', 'IN_PROGRESS');
```

### 1.3 Affected Components

**Backend:**
- `backend/prisma/schema.prisma` - No changes needed (schema supports versioning)
- `backend/prisma/seed-templates-trade-v3.ts` - Add v3.0 template
- `backend/src/services/assessment.service.ts` - Version-aware logic
- `backend/src/services/report-generator.service.ts` - Version-specific reporting
- `backend/src/routes/template.routes.ts` - Version filtering

**Frontend:**
- `frontend/src/pages/AssessmentTemplates.tsx` - Show v2.0 and v3.0 options
- `frontend/src/pages/assessment/execute/` - Handle variable question counts
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

**Recommendation:** Use version suffix approach

```
- trade-compliance-assessment        (v2.0 - keep as-is)
- trade-compliance-assessment-v3     (v3.0 - new template)
```

**Rationale:**
- Unique slug constraint prevents conflicts
- Clearer differentiation in queries
- Easier rollback (just deactivate v3)
- Better frontend routing (can have different URLs)
- Consistent with financial-crime-compliance-v3 pattern

### 2.2 Data Relationships

```
Template (v2.0)                    Template (v3.0)
    |                                  |
    ├── Section 1 (5 questions)       ├── Section 1: Governance (10 questions) ← NEW
    ├── Section 2 (5 questions)       ├── Section 2: Risk Assessment (10 questions) ← NEW
    ├── Section 3 (5 questions)       ├── Section 3: Sanctions & Export (10 questions) ← Enhanced
    ├── Section 4 (5 questions)       ├── Section 4: Trade Finance (10 questions) ← NEW
    ├── Section 5 (5 questions)       ├── Section 5: Customs & Docs (10 questions) ← Enhanced
    |                                  ├── Section 6: Supply Chain (10 questions) ← Enhanced
    |                                  ├── Section 7: Data & Technology (10 questions) ← NEW
    |                                  ├── Section 8: Training & Culture (10 questions) ← NEW
    |                                  ├── Section 9: Monitoring & Audit (10 questions) ← NEW
    |                                  └── Section 10: AI Readiness (10 questions) ← NEW
    |
    ├── Assessment A (COMPLETED)
    ├── Assessment B (IN_PROGRESS)
    └── Assessment C (DRAFT)
```

**Key Insight:** No data migration needed for completed assessments. They remain linked to v2.0 template.

### 2.3 Template Weighting Strategy

**Status:** ✅ DEFINED - Regulatory-Priority Weighting with AI Integration

#### 2.3.1 Section Weights (v3.0)

The v3.0 template uses **regulatory-priority weighting** based on WCO Framework, OFAC, BIS, EU Customs, and international trade compliance standards.

**10 Sections (AI Module Integrated):**

| Section # | Section Name | Weight | % | Regulatory Rationale |
|-----------|--------------|--------|---|---------------------|
| 1 | Governance & Regulatory Readiness | 0.14 | 14% | **HIGHEST** - Foundation for trade compliance program |
| 2 | Trade Risk Assessment Framework | 0.11 | 11% | WCO Risk Management Framework - Risk-based approach mandatory |
| 3 | Sanctions & Export Control Management | 0.13 | 13% | OFAC/BIS/ITAR - Critical regulatory priority, severe penalties |
| 4 | Trade Finance (Banks) | 0.10 | 10% | ICC/Wolfsberg - TBML detection critical for financial institutions |
| 5 | Customs & Documentation (Corporates) | 0.12 | 12% | WCO compliance - Import/export accuracy essential |
| 6 | Supply Chain & End-Use Controls | 0.11 | 11% | BIS/ITAR end-use requirements, supply chain transparency |
| 7 | Data, Technology & Recordkeeping | 0.08 | 8% | Enabler for other controls, increasing importance |
| 8 | Training & Culture | 0.05 | 5% | Foundational - ensures program awareness and execution |
| 9 | Monitoring, Audit & Continuous Improvement | 0.08 | 8% | Continuous improvement & effectiveness testing |
| 10 | AI Readiness (Integrated) | 0.08 | 8% | Emerging risk - EU AI Act, automation, model risk |
| | **TOTAL** | **1.0000** | **100%** | |

**Key Weighting Principles:**
1. **Governance First** (14%) - Without strong governance, all other controls fail
2. **Core Compliance Cluster** (12-13%) - Sanctions/Export, Customs form the compliance foundation
3. **Supporting Controls** (10-11%) - Risk Assessment, Supply Chain, Trade Finance enable core controls
4. **Foundational Elements** (8%) - Data/Tech, Monitoring ensure sustainability
5. **Cultural Foundation** (5%) - Training ensures awareness and execution
6. **Emerging Risk** (8%) - AI readiness reflects growing regulatory focus and automation

**Regulatory Alignment:**
- ✅ **OFAC/BIS/ITAR**: Sanctions and export controls (13% - high priority)
- ✅ **WCO Framework**: Risk management, customs compliance, documentation
- ✅ **ICC/Wolfsberg**: Trade finance controls, TBML prevention
- ✅ **EU Customs Code**: Documentation, valuation, classification compliance
- ✅ **UFLPA/Forced Labor**: Supply chain due diligence and transparency

**Comparison to v2.0:**
```
v2.0 (Uniform): All 5 sections @ 20% each
v3.0 (Priority): Top section 14%, Core controls 12-13%, Supporting 10-11%

Impact: Organizations with strong governance but weak sanctions screening will see scores
        reflect this imbalance (as regulators expect)
```

#### 2.3.2 Question Weights (Foundational-Priority Approach)

**Strategy:** Within each section, questions are weighted based on whether they are **foundational** (regulatory requirements, critical controls) or **standard** (best practices, maturity indicators).

**Weighting Multipliers:**
- **Foundational Questions**: `weight = 1.5` to `2.0` (50-100% higher than standard)
- **Standard Questions**: `weight = 1.0` (baseline)

**Normalization:** Question weights within each section are normalized to sum to 1.0.

**Example (Governance Section - 10 questions):**

| Q# | Question Summary | Type | Raw Weight | Normalized |
|----|------------------|------|------------|------------|
| 1.1 | Trade Compliance Officer designation | **Foundational** | 2.0 | 0.13 (13%) |
| 1.2 | Responsibilities across teams | **Foundational** | 2.0 | 0.13 (13%) |
| 1.3 | Policy alignment with regimes | **Foundational** | 2.0 | 0.13 (13%) |
| 1.4 | Regulatory change monitoring | **Foundational** | 1.5 | 0.10 (10%) |
| 1.5 | Compliance clauses in contracts | Standard | 1.0 | 0.07 (7%) |
| 1.6 | Escalation procedures | Standard | 1.0 | 0.07 (7%) |
| 1.7 | Risk committee representation | Standard | 1.0 | 0.07 (7%) |
| 1.8 | Resources and budgets | Standard | 1.0 | 0.07 (7%) |
| 1.9 | Trade controls harmonization | Standard | 1.0 | 0.07 (7%) |
| 1.10 | Independent audits | **Foundational** | 1.5 | 0.10 (10%) |
| | **Section Total** | | **14.0** | **1.00** (100%) |

**Foundational Question Identification Criteria:**
1. ✅ **Explicit Regulatory Requirement**: Mandated by OFAC, BIS, EU Customs, or local regulator
2. ✅ **Control Effectiveness Indicator**: Without this control, program is fundamentally incomplete
3. ✅ **Examination Focus**: High priority in regulatory exams (CBP, BIS, OFAC)
4. ✅ **Remediation Urgency**: Deficiency would trigger enforcement action or penalties

**Foundational Questions by Section (Examples):**

**Section 1: Governance (4 foundational of 10)**
- Q1.1: Trade Compliance Officer designation (required)
- Q1.2: Cross-functional responsibilities (required)
- Q1.3: Policy alignment with OFAC/BIS/EU/ITAR (required)
- Q1.10: Independent audits/reviews (required)

**Section 3: Sanctions & Export Control (6 foundational of 10)**
- Q3.1: Restricted party screening (OFAC/BIS requirement)
- Q3.2: Export license management (BIS requirement)
- Q3.3: HS/ECCN classification (required)
- Q3.4: End-use declarations (BIS requirement)
- Q3.9: Escalation for sanctions breaches (required)
- Q3.10: Export control training (required)

**Section 5: Customs & Documentation (5 foundational of 10)**
- Q5.1: Customs declaration accuracy (WCO requirement)
- Q5.2: HS code review (required)
- Q5.3: Invoice/BoL consistency (required)
- Q5.6: Proof of origin documents (required)
- Q5.9: Document retention periods (required)

**Total Foundational Questions Across All Sections: 33 of 105 (31.4%)**

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
Governance Section (weight: 0.14)
├─ Q1.1 (TCO designation - foundational):
│  rawScore=4.5, evidence=TIER_2(1.0), weight=0.13
│  finalScore = 4.5 × 1.0 × 0.13 = 0.585
├─ Q1.2 (Responsibilities - foundational):
│  rawScore=3.0, evidence=TIER_1(0.8), weight=0.13
│  finalScore = 3.0 × 0.8 × 0.13 = 0.312
├─ ... (8 more questions)
└─ Section Score: 3.7/5.0 (74%)

Overall Score = (3.7 × 0.14) + (other sections...) × 20 = 71/100
```

#### 2.3.4 Implementation Approach

**Method:** Hard-code weights in seed file (Option 1 - fastest)

**File:** `backend/prisma/seed-templates-trade-v3.ts`

**Section Weight Example:**
```typescript
{
  name: 'Governance & Regulatory Readiness',
  description: 'Assess governance framework and regulatory compliance readiness for trade operations',
  order: 1,
  weight: 0.14,  // 14% - highest section weight
  regulatoryPriority: 'WCO Framework, OFAC/BIS/ITAR Compliance, EU Customs Code',
  questions: [
    {
      question: 'Is there a Trade Compliance Officer or equivalent role?',
      type: QuestionType.SELECT,
      weight: 2.0,  // Foundational - will be normalized to ~0.13 within section
      isFoundational: true,  // Flag for UI highlighting
      // ... rest of question config
    },
    {
      question: 'Are compliance clauses included in contracts with freight forwarders?',
      type: QuestionType.SELECT,
      weight: 1.0,  // Standard - will be normalized to ~0.07 within section
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

#### 2.3.5 Weighting Impact Analysis

**Expected Score Distribution Changes (v2.0 → v3.0):**

| Scenario | v2.0 Score | v3.0 Score | Change | Reason |
|----------|------------|------------|--------|--------|
| **Strong Governance, Weak Tech** | 75/100 | 79/100 | +4 | Governance weight increased (14%) |
| **Weak Governance, Strong Tech** | 70/100 | 63/100 | -7 | Governance deficiency penalized more |
| **Balanced Program** | 80/100 | 79/100 | -1 | Minimal change (good controls across board) |
| **Excellent Sanctions, No AI** | 85/100 | 81/100 | -4 | New sections expose gaps |
| **Basic Compliance** | 60/100 | 56/100 | -4 | Foundational questions weighed heavier |

**Interpretation:**
- Organizations with **strong foundational controls** (governance, sanctions, customs) will score **higher** in v3.0
- Organizations with **advanced tech but weak governance** will score **lower** in v3.0 (more aligned with regulatory expectations)
- **More gaps identified**: v3.0 covers 95 additional areas, likely to surface previously unassessed weaknesses

---

## 3. Question Mapping Strategy

### 3.1 Question Mapping Matrix

| v2.0 Section | v2.0 Q# | v3.0 Section | v3.0 Q# | Mapping Type | Notes |
|--------------|---------|--------------|---------|--------------|-------|
| **Export Controls** | Q1.1 | Sanctions & Export Control | Q3.1-3.4 | **Split** | Product types split into classification/licensing questions |
| Export Controls | Q1.2 | Sanctions & Export Control | Q3.3 | **Direct** | Classification process |
| Export Controls | Q1.3 | Sanctions & Export Control | Q3.2 | **Direct** | Export licensing |
| Export Controls | Q1.4 | Sanctions & Export Control | Q3.1, Q3.4 | **Split** | Screening + end-user validation |
| Export Controls | Q1.5 | Sanctions & Export Control | Q3.5 | **Enhanced** | Deemed exports - more detailed |
| **Import Regulations** | Q2.1 | Customs & Documentation | Q5.1 | **Enhanced** | Goods classification expanded |
| Import Regulations | Q2.2 | Customs & Documentation | Q5.2, Q5.3 | **Split** | Classification + valuation separated |
| Import Regulations | Q2.3 | Customs & Documentation | Q5.6 | **Enhanced** | Country of origin + marking |
| Import Regulations | Q2.4 | Customs & Documentation | Q5.7 | **Direct** | Trade preferences |
| Import Regulations | Q2.5 | Monitoring & Audit | Q9.3 | **Moved** | Compliance monitoring moved to audit section |
| **Trade Sanctions** | Q3.1 | Sanctions & Export Control | Q3.1 | **Direct** | Sanctions regimes |
| Trade Sanctions | Q3.2 | Sanctions & Export Control | Q3.1 | **Enhanced** | Screening procedures expanded |
| Trade Sanctions | Q3.3 | Sanctions & Export Control | Q3.9 | **Direct** | Match resolution/escalation |
| Trade Sanctions | Q3.4 | Governance | Q1.4 | **Moved** | Regulatory updates moved to governance |
| Trade Sanctions | Q3.5 | Governance | Q1.6 | **Moved** | Violation response moved to governance |
| **Documentation** | Q4.1 | Customs & Documentation | Q5.3 | **Direct** | Trade documents maintained |
| Documentation | Q4.2 | Customs & Documentation | Q5.3, Q5.10 | **Split** | Accuracy verification + non-conformities |
| Documentation | Q4.3 | Data & Technology | Q7.1 | **Enhanced** | Record retention + data management |
| Documentation | Q4.4 | Customs & Documentation | Q5.8 | **Direct** | Amendments/corrections |
| Documentation | Q4.5 | Monitoring & Audit | Q9.1, Q9.4 | **Split** | Quality assurance + KPIs |
| **Supply Chain** | Q5.1 | Supply Chain & End-Use | Q6.1 | **Direct** | Supplier due diligence |
| Supply Chain | Q5.2 | Supply Chain & End-Use | Q6.10 | **Enhanced** | Supply chain visibility + mapping |
| Supply Chain | Q5.3 | Supply Chain & End-Use | Q6.6 | **Enhanced** | Forced labor/human rights expanded |
| Supply Chain | Q5.4 | Supply Chain & End-Use | Q6.5 | **Direct** | Logistics partners compliance |
| Supply Chain | Q5.5 | Supply Chain & End-Use | Q6.3, Q6.9 | **Split** | Shipping routes + escalation paths |

### 3.2 New Question Categories

**Entirely New Sections (No v2.0 Equivalent):**
1. **Governance & Regulatory Readiness** (9 questions) - NEW
2. **Trade Risk Assessment Framework** (10 questions) - NEW
3. **Trade Finance (Banks)** (10 questions) - NEW
4. **Data, Technology & Recordkeeping** (10 questions) - NEW (partial from old Documentation)
5. **Training & Culture** (10 questions) - NEW
6. **Monitoring, Audit & Continuous Improvement** (10 questions) - NEW (partial from old Documentation/Supply Chain)
7. **AI Readiness** (10 questions) - NEW

**Total New Questions:** 69 entirely new + 36 enhanced/refined from v2.0 = 105 total

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
npm run db:seed:templates-trade-v3

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
WHERE slug = 'trade-compliance-assessment-v3';

-- Check section and question counts
SELECT
  t.slug,
  t.version,
  COUNT(DISTINCT s.id) as sections,
  COUNT(q.id) as questions
FROM "Template" t
LEFT JOIN "Section" s ON s."templateId" = t.id
LEFT JOIN "Question" q ON q."sectionId" = s.id
WHERE t.slug LIKE 'trade-compliance%'
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
  <Badge variant="success">NEW - Comprehensive Coverage</Badge>
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
{hasCompletedV2 && (
  <Alert variant="info">
    <AlertTitle>Enhanced Trade Compliance Assessment Available</AlertTitle>
    <AlertDescription>
      Our Trade Compliance assessment now includes 95 additional questions
      covering Trade Risk Assessment, Trade Finance, Data Governance, Training,
      and AI Readiness.
      <Link to="/assessments/new?template=trade-compliance-assessment-v3">
        Try the enhanced assessment
      </Link>
    </AlertDescription>
  </Alert>
)}
```

**2. Email Campaign:**
```
Subject: Enhanced Trade Compliance Assessment Now Available

Dear [User],

We've significantly enhanced our Trade Compliance Assessment
with industry-leading coverage:

NEW SECTIONS:
✓ Governance & Regulatory Readiness - 9 questions
✓ Trade Risk Assessment Framework - 10 questions
✓ Trade Finance (TBML Detection) - 10 questions
✓ Data & Technology Infrastructure - 10 questions
✓ Training & Culture - 10 questions
✓ Monitoring, Audit & Continuous Improvement - 10 questions
✓ AI Readiness - 10 questions

ENHANCED SECTIONS:
✓ Comprehensive sanctions & export control coverage
✓ Expanded customs & documentation assessment
✓ Advanced supply chain & end-use controls

The v3.0 assessment provides:
- 4× more comprehensive gap analysis (105 vs 25 questions)
- Better vendor matching precision
- Regulatory alignment with OFAC, BIS, ITAR, EU Customs, WCO Framework
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
        The v3.0 assessment covers 80 additional questions for
        comprehensive trade compliance analysis.
      </p>
    </div>
    <Button onClick={handleUpgrade}>
      Upgrade to v3.0
    </Button>
  </UpgradeBanner>
)}
```

**Success Criteria:**
- ✅ 20% of new assessments use v3.0
- ✅ < 5% user complaints about complexity
- ✅ Average completion rate > 80%
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
  v2DeprecationDate: '2026-03-31'
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

**Success Criteria:**
- ✅ 80% of new assessments use v3.0
- ✅ Completion rate similar to v2.0 (80%+)
- ✅ User satisfaction score > 4.0/5.0
- ✅ Average time to complete < 105 minutes

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
WHERE slug = 'trade-compliance-assessment' AND version = '2.0';
```

**Maintain Backward Compatibility:**
- ✅ v2.0 assessment results remain viewable
- ✅ v2.0 reports can be regenerated
- ✅ v2.0 data included in exports
- ✅ API returns correct template version in responses

---

## 5. Technical Implementation

### 5.1 Seed Script for v3.0

**File:** `backend/prisma/seed-templates-trade-v3.ts`

Create comprehensive seed file following the pattern from `seed-templates-enhanced.ts` (financial crime v3.0).

**Structure:**
```typescript
import { PrismaClient, TemplateCategory, QuestionType } from '../src/generated/prisma';

const prisma = new PrismaClient();

export const TRADE_COMPLIANCE_V3_TEMPLATE: TemplateData = {
  name: 'Trade Compliance Assessment - Enhanced',
  slug: 'trade-compliance-assessment-v3',
  category: TemplateCategory.TRADE_COMPLIANCE,
  description: 'Comprehensive trade compliance evaluation covering governance, risk assessment, sanctions/export controls, trade finance, customs documentation, supply chain management, data infrastructure, training, monitoring, and AI readiness.',
  version: '3.0',
  estimatedMinutes: 105,
  instructions: `...`,
  isActive: true,
  tags: ['trade-compliance', 'export-control', 'sanctions', 'customs', 'supply-chain', 'trade-finance', 'ai-readiness'],
  sections: [
    // Section 1: Governance & Regulatory Readiness (10 questions)
    {
      name: 'Governance & Regulatory Readiness',
      description: 'Assess governance framework and regulatory compliance readiness',
      order: 1,
      weight: 0.14,
      regulatoryPriority: 'WCO Framework, OFAC/BIS/ITAR, EU Customs Code',
      questions: [
        {
          question: 'Is there a Trade Compliance Officer or equivalent role?',
          type: QuestionType.SELECT,
          weight: 2.0,
          isFoundational: true,
          order: 1,
          isRequired: true,
          options: ['Yes - dedicated TCO', 'Yes - shared role', 'No designated role'],
          helpText: 'The TCO should have appropriate authority and resources',
          aiPromptHint: 'Assess TCO designation considering regulatory requirements...',
          scoringRules: { /* ... */ },
          tags: ['governance', 'tco', 'organization']
        },
        // ... 9 more questions
      ]
    },
    // Section 2-10 follow same pattern
  ]
};

export async function seedTradeComplianceV3() {
  // Implementation following seed-templates-enhanced.ts pattern
}
```

### 5.2 Question Mapping Configuration

**File:** `backend/src/config/trade-template-migration-map.ts`

```typescript
/**
 * Mapping from v2.0 question IDs to v3.0 question IDs
 * Used for migrating draft assessments from v2.0 to v3.0
 */
export const V2_TO_V3_TRADE_QUESTION_MAPPING: Record<string, string | string[] | null> = {
  // Export Controls
  'v2-export-q1': ['v3-sanctions-q1', 'v3-sanctions-q3'],  // Product types split
  'v2-export-q2': 'v3-sanctions-q3',  // Classification
  'v2-export-q3': 'v3-sanctions-q2',  // Licensing
  'v2-export-q4': ['v3-sanctions-q1', 'v3-sanctions-q4'],  // Screening + end-user
  'v2-export-q5': 'v3-sanctions-q5',  // Deemed exports

  // Import Regulations
  'v2-import-q1': 'v3-customs-q1',  // Goods classification
  'v2-import-q2': ['v3-customs-q2', 'v3-customs-q3'],  // Classification + valuation
  'v2-import-q3': 'v3-customs-q6',  // Country of origin
  'v2-import-q4': 'v3-customs-q7',  // Trade preferences
  'v2-import-q5': 'v3-monitoring-q3',  // Compliance monitoring

  // ... rest of mapping
};
```

---

## 6. Testing Strategy

### 6.1 Test Scenarios

**Scenario 1: New v3.0 Assessment**
```
GIVEN a user starting a new trade compliance assessment
WHEN they select the v3.0 template
THEN they should see all 105 questions across 10 sections
AND the assessment execution flow should work correctly
AND they can save progress and resume
AND they can complete and generate a report
```

**Scenario 2: Existing v2.0 Assessment**
```
GIVEN a completed v2.0 assessment
WHEN the user views the results
THEN they should see all original 25 questions and answers
AND the report should generate correctly
AND the risk score should display correctly
AND they should see an option to start a v3.0 assessment
```

### 6.2 Integration Tests

```typescript
// backend/tests/integration/trade-template-v3.spec.ts
describe('Trade Compliance Template v3.0', () => {

  test('should seed v3.0 template with correct structure', async () => {
    await seedTradeComplianceV3();

    const template = await prisma.template.findUnique({
      where: { slug: 'trade-compliance-assessment-v3' },
      include: {
        sections: {
          include: { questions: true }
        }
      }
    });

    expect(template).toBeDefined();
    expect(template.version).toBe('3.0');
    expect(template.sections.length).toBe(10);

    const totalQuestions = template.sections.reduce(
      (sum, s) => sum + s.questions.length, 0
    );
    expect(totalQuestions).toBe(105);
  });

  test('should have section weights summing to 1.0', async () => {
    const template = await prisma.template.findUnique({
      where: { slug: 'trade-compliance-assessment-v3' },
      include: { sections: true }
    });

    const weightSum = template.sections.reduce((sum, s) => sum + s.weight, 0);
    expect(weightSum).toBeCloseTo(1.0, 3);
  });
});
```

---

## 7. Rollback Procedures

### 7.1 Rollback Decision Criteria

**Trigger rollback if:**
- 🚨 Critical bug prevents v3.0 assessment completion (> 10% failure rate)
- 🚨 Data corruption or loss detected
- 🚨 Performance degradation > 50% (p95 latency)
- 🚨 Error rate > 5% for v3.0 operations

### 7.2 Rollback Steps

**Soft Rollback (Deactivate v3.0):**
```sql
UPDATE "Template"
SET "isActive" = false,
    "metadata" = jsonb_set(
      COALESCE("metadata", '{}'),
      '{rollbackReason}',
      '"Critical bug in production - temporary deactivation"'
    )
WHERE slug = 'trade-compliance-assessment-v3';
```

---

## 8. User Communication

### 8.1 Launch Announcement

**Email + In-App Banner:**
```
Subject: 🚀 Enhanced Trade Compliance Assessment Now Live

Our enhanced Trade Compliance Assessment (v3.0) is now available!

Key Benefits:
✓ 4× more comprehensive coverage with 105 detailed questions
✓ New sections: Governance, Risk Assessment, Trade Finance, Training, AI Readiness
✓ Better vendor matching with detailed gap analysis
✓ Regulatory alignment: OFAC, BIS, ITAR, EU Customs, WCO Framework

[Start Enhanced Assessment]

Your existing assessments remain available for reference.
```

---

## 9. Success Metrics

### 9.1 Key Performance Indicators (KPIs)

**Adoption Metrics:**
- v3AdoptionRate: Target 80% within 6 weeks
- totalV3Assessments: Target 200 within first month
- v3CompletionRate: Target > 80%
- avgCompletionTime: Target < 120 minutes

**Quality Metrics:**
- errorRate: Target < 1%
- responseTime: Target < 2s (p95)
- userSatisfaction: Target > 4.0/5.0

---

## 10. Risk Mitigation

### 10.1 Identified Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Low adoption of v3.0** | Medium | Medium | Make v3.0 default, user education, in-app prompts |
| **High dropout rate (too long)** | Medium | High | Clear progress indicators, save frequently, section-by-section |
| **Data migration errors** | Low | Critical | Extensive testing, soft launch, rollback procedures |
| **Performance degradation** | Low | High | Load testing, database indexing, query optimization |

---

## Document Control

**Version History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-21 | Development Team | Initial migration plan for Trade Compliance v3.0 |

**Related Documents:**
- [Trade Compliance Template v3.0 Specification](./TRADE_COMPLIANCE_V3_SPECIFICATION.md) - TO BE CREATED
- [Financial Crime Migration Plan](./TEMPLATE_V3_MIGRATION_PLAN.md) - Reference
- [Database Schema Documentation](../backend/prisma/schema.prisma)

---

**End of Migration Plan**
