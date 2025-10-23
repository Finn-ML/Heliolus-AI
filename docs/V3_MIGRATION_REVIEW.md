# v3.0 Migration Comprehensive Review
## Issue Analysis & Risk Assessment

**Review Date:** 2025-10-20
**Reviewer:** Development Team
**Status:** 🔴 **CRITICAL ISSUES FOUND** - Migration blocked pending resolution

---

## Executive Summary

Based on comprehensive review of the migration plan, specification, and current implementation, **7 critical issues** and **12 important issues** have been identified that must be resolved before migration proceeds. The good news: no schema changes are required, and the weighted scoring infrastructure is production-ready.

**Risk Level**: 🔴 HIGH - Migration would fail if attempted now

**Estimated Resolution Time**: 2-3 days

---

## 🚨 CRITICAL ISSUES (Migration Blockers)

### Issue #1: Slug Naming Inconsistency ⚠️ **HIGHEST PRIORITY**

**Severity:** 🔴 CRITICAL - Would cause migration failure

**Problem:**
Three different slug values exist across documentation and implementation:

| Location | Slug | Status |
|----------|------|--------|
| Migration Plan (Section 2.2) | `financial-crime-compliance-v3` | ✅ Correct |
| seed-templates-enhanced.ts | `financial-crime-compliance-enhanced` | ❌ Wrong |
| seed.ts (old) | `financial-crime-assessment` | ⚠️ Legacy |
| seed-templates.ts (v2.0) | `financial-crime-compliance` | ✅ Correct |

**Impact:**
- Frontend will look for `financial-crime-compliance-v3` but database will have `financial-crime-compliance-enhanced`
- Template selection will fail
- API queries by slug will return 404
- Migration logic expecting v3 slug won't find template
- Question mapping service will fail to locate v3 questions

**Root Cause:**
Initial development used "enhanced" in naming, but migration plan correctly chose "-v3" suffix for consistency.

**Resolution:**
```typescript
// In seed-templates-enhanced.ts line 65
slug: 'financial-crime-compliance-v3',  // ✅ Change from 'enhanced' to 'v3'
```

**Files to Update:**
- `/backend/prisma/seed-templates-enhanced.ts` (line 65)
- Any test files referencing the slug

**Validation:**
```bash
# After fix, verify no references to old slug
grep -r "financial-crime-compliance-enhanced" backend/
# Should return: No matches found
```

---

### Issue #2: Incomplete Seed File Implementation

**Severity:** 🔴 CRITICAL - Migration cannot proceed

**Problem:**
`seed-templates-enhanced.ts` only has 2 of 12 sections implemented:
- ✅ Section 1: Geographic Risk Assessment (5 questions)
- ✅ Section 2: Governance & Regulatory Readiness (8 questions)
- ❌ Section 3: Risk Assessment Framework (7 questions) - **MISSING**
- ❌ Section 4: Customer Due Diligence (8 questions) - **MISSING**
- ❌ Section 5: Adverse Media Screening (6 questions) - **MISSING**
- ❌ Section 6: Sanctions Screening (10 questions) - **MISSING**
- ❌ Section 7: Transaction Monitoring (9 questions) - **MISSING**
- ❌ Section 8: Fraud & Identity Management (6 questions) - **MISSING**
- ❌ Section 9: Data & Technology Infrastructure (8 questions) - **MISSING**
- ❌ Section 10: Training, Culture & Awareness (7 questions) - **MISSING**
- ❌ Section 11: Monitoring, Audit & Improvement (6 questions) - **MISSING**
- ❌ Section 12: AI Readiness (10 questions) - **MISSING**

**Current State:** 13 of 85 questions implemented (15%)

**Impact:**
- Seeding v3.0 template will only create partial template
- Assessment execution will fail due to missing sections
- API will return incomplete template structure
- Users will see partial assessment experience

**Resolution:**
Complete all 10 remaining sections using specification document as reference. Each section needs:
- Section metadata (title, description, weight, regulatoryPriority, order)
- All questions with full configuration
- Weights applied per migration plan Section 2.3
- isFoundational flags on critical questions

**Estimated Work:** 1-2 days

---

### Issue #3: No Section/Question Weights in Current Implementation

**Severity:** 🔴 CRITICAL - Scoring will fail

**Problem:**
Current seed file uses TypeScript interface that doesn't include weight fields:

```typescript
// Current interface - NO WEIGHTS
export interface SectionData {
  title: string;
  description?: string;
  displayOrder: number;  // ❌ Should be 'order'
  isRequired: boolean;
  instructions?: string;
  questions: QuestionData[];
}

export interface QuestionData {
  question: string;
  type: QuestionType;
  displayOrder: number;  // ❌ Should be 'order'
  isRequired: boolean;
  // ... other fields
  // ❌ MISSING: weight, isFoundational, regulatoryPriority
}
```

**What's Missing:**
- `Section.weight` - Required for weighted scoring
- `Section.regulatoryPriority` - Required for compliance alignment
- `Question.weight` - Required for intra-section weighting
- `Question.isFoundational` - Required for priority identification

**Impact:**
- All sections will default to weight 1.0 (uniform weighting)
- Weighted scoring service won't apply regulatory-priority weighting
- Scores won't reflect regulatory importance
- Foundational questions won't be highlighted in UI

**Resolution:**
```typescript
export interface SectionData {
  title: string;
  description?: string;
  weight: number;  // ✅ ADD THIS
  regulatoryPriority?: string;  // ✅ ADD THIS
  order: number;  // ✅ RENAME from displayOrder
  isRequired: boolean;
  instructions?: string;
  questions: QuestionData[];
}

export interface QuestionData {
  question: string;
  type: QuestionType;
  weight: number;  // ✅ ADD THIS
  isFoundational: boolean;  // ✅ ADD THIS
  order: number;  // ✅ RENAME from displayOrder
  isRequired: boolean;
  // ... rest of fields
}
```

**Validation Required:**
After seed, run:
```sql
-- Verify section weights sum to 1.0
SELECT SUM(weight) FROM "Section"
WHERE "templateId" = (SELECT id FROM "Template" WHERE slug = 'financial-crime-compliance-v3');
-- Expected: 1.0000

-- Verify foundational questions flagged
SELECT COUNT(*) FROM "Question" q
JOIN "Section" s ON q."sectionId" = s.id
JOIN "Template" t ON s."templateId" = t.id
WHERE t.slug = 'financial-crime-compliance-v3' AND q."isFoundational" = true;
-- Expected: ~45 questions
```

---

### Issue #4: Field Name Mismatch (displayOrder vs order)

**Severity:** 🔴 CRITICAL - Seed will fail

**Problem:**
Seed interface uses `displayOrder` but schema uses `order`:

**Schema (Actual Database):**
```prisma
model Section {
  order       Int  // ✅ Schema field
  // ...
}

model Question {
  order      Int  // ✅ Schema field
  // ...
}
```

**Seed Interface (Current Implementation):**
```typescript
interface SectionData {
  displayOrder: number;  // ❌ Wrong field name
}

interface QuestionData {
  displayOrder: number;  // ❌ Wrong field name
}
```

**Impact:**
- Prisma will not recognize `displayOrder` field
- Seed operation will fail with error: "Unknown field 'displayOrder'"
- Template creation will be rejected by database

**Resolution:**
```typescript
// Change ALL instances of displayOrder to order
interface SectionData {
  order: number;  // ✅ Matches schema
}

interface QuestionData {
  order: number;  // ✅ Matches schema
}
```

**Files to Update:**
- `/backend/prisma/seed-templates-enhanced.ts` - Interface definitions
- All section/question definitions using displayOrder

---

### Issue #5: Seed Function Not Implemented

**Severity:** 🔴 CRITICAL - Cannot deploy

**Problem:**
`seedEnhancedTemplates()` and `clearEnhancedTemplates()` are placeholder functions:

```typescript
export async function seedEnhancedTemplates() {
  console.log('🌱 Starting enhanced template seeding...');
  // Implementation similar to existing seed-templates.ts
  // ❌ NO ACTUAL IMPLEMENTATION
}
```

**Impact:**
- Running seed script will output message but not create template
- Database will have no v3.0 template
- Migration cannot proceed

**Resolution:**
Implement functions following pattern from existing `seed-templates.ts`:

```typescript
export async function seedEnhancedTemplates() {
  console.log('🌱 Starting Financial Crime Template v3.0 seeding...');

  try {
    // 1. Check if v3.0 already exists
    const existing = await prisma.template.findUnique({
      where: { slug: 'financial-crime-compliance-v3' }
    });

    if (existing) {
      console.log('⚠️  v3.0 template already exists. Skipping...');
      return;
    }

    // 2. Create template with sections and questions
    const template = await prisma.template.create({
      data: {
        name: FINANCIAL_CRIME_ENHANCED_TEMPLATE.name,
        slug: FINANCIAL_CRIME_ENHANCED_TEMPLATE.slug,
        // ... rest of template data
        sections: {
          create: FINANCIAL_CRIME_ENHANCED_TEMPLATE.sections.map(sectionData => ({
            title: sectionData.title,
            description: sectionData.description,
            weight: sectionData.weight,  // ✅ Include weight
            regulatoryPriority: sectionData.regulatoryPriority,
            order: sectionData.order,
            questions: {
              create: sectionData.questions.map(questionData => ({
                text: questionData.question,
                type: questionData.type,
                weight: questionData.weight,  // ✅ Include weight
                isFoundational: questionData.isFoundational,
                order: questionData.order,
                // ... rest of fields
              }))
            }
          }))
        }
      }
    });

    // 3. Validate weights
    const sectionWeightSum = FINANCIAL_CRIME_ENHANCED_TEMPLATE.sections
      .reduce((sum, s) => sum + s.weight, 0);

    if (Math.abs(sectionWeightSum - 1.0) > 0.001) {
      throw new Error(`Section weights sum to ${sectionWeightSum}, must equal 1.0`);
    }

    console.log('✅ v3.0 template seeded successfully');
    console.log(`   Sections: ${template.sections.length}`);
    console.log(`   Questions: ${/* count */}`);

    return template;

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}
```

---

### Issue #6: No Question Weight Normalization Logic

**Severity:** 🟠 HIGH - Scores may be incorrect

**Problem:**
Migration plan states question weights should be normalized to sum to 1.0 within each section, but:
1. No normalization function exists in seed file
2. Weighted scoring service expects normalized weights
3. Example shows raw weights (2.0, 1.5, 1.0) but normalized values in table

**Current Specification Example:**
```
Q2.1: weight = 2.0 (foundational)
Q2.2: weight = 2.0 (foundational)
Q2.3: weight = 1.5 (foundational)
Q2.4: weight = 1.0 (standard)
...
Total raw: 12.0
```

**Expected Normalized:**
```
Q2.1: weight = 0.16 (2.0 / 12.0)
Q2.2: weight = 0.16 (2.0 / 12.0)
Q2.3: weight = 0.12 (1.5 / 12.0)
Q2.4: weight = 0.08 (1.0 / 12.0)
...
Total normalized: 1.00
```

**Impact:**
- If raw weights stored: Weighted scoring service will fail validation (expects sum=1.0)
- Scores will be calculated incorrectly
- Section scores won't scale properly

**Resolution Option A (Recommended): Normalize at Seed Time**
```typescript
function normalizeQuestionWeights(questions: QuestionData[]): QuestionData[] {
  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);

  return questions.map(q => ({
    ...q,
    weight: q.weight / totalWeight  // Normalize to sum=1.0
  }));
}

// Apply before creating section
const normalizedQuestions = normalizeQuestionWeights(sectionData.questions);
```

**Resolution Option B: Store Raw, Normalize at Runtime**
Weighted scoring service already has normalization capability via `weight-calculator.ts`, but this adds runtime overhead.

**Recommendation:** Use Option A for performance and validation at seed time.

---

### Issue #7: Missing Integration Test for v3.0 Template

**Severity:** 🟠 HIGH - Cannot verify migration works

**Problem:**
No test exists to verify:
- v3.0 template seeds correctly
- All 85 questions are present
- Weights sum to 1.0
- Assessment execution works with v3.0
- Scoring calculates correctly

**Impact:**
- No way to verify migration success
- Bugs will only be discovered in production
- Rollback will be reactive, not proactive

**Resolution:**
Create integration test:

```typescript
// backend/tests/integration/template-v3-seed.spec.ts
describe('Financial Crime Template v3.0', () => {

  test('should seed v3.0 template with correct structure', async () => {
    await seedEnhancedTemplates();

    const template = await prisma.template.findUnique({
      where: { slug: 'financial-crime-compliance-v3' },
      include: {
        sections: {
          include: { questions: true }
        }
      }
    });

    expect(template).toBeDefined();
    expect(template.version).toBe('3.0');
    expect(template.sections.length).toBe(12);

    const totalQuestions = template.sections.reduce(
      (sum, s) => sum + s.questions.length, 0
    );
    expect(totalQuestions).toBe(85);
  });

  test('should have section weights summing to 1.0', async () => {
    const template = await prisma.template.findUnique({
      where: { slug: 'financial-crime-compliance-v3' },
      include: { sections: true }
    });

    const weightSum = template.sections.reduce((sum, s) => sum + s.weight, 0);
    expect(weightSum).toBeCloseTo(1.0, 3);
  });

  test('should have ~45 foundational questions', async () => {
    const foundationalCount = await prisma.question.count({
      where: {
        section: {
          template: {
            slug: 'financial-crime-compliance-v3'
          }
        },
        isFoundational: true
      }
    });

    expect(foundationalCount).toBeGreaterThanOrEqual(40);
    expect(foundationalCount).toBeLessThanOrEqual(50);
  });

  test('should complete v3.0 assessment end-to-end', async () => {
    // Full assessment flow test
    const assessment = await createAssessment({
      templateSlug: 'financial-crime-compliance-v3',
      // ... test data
    });

    // Answer all questions
    // Complete assessment
    // Verify scoring
    // Verify report generation

    expect(assessment.status).toBe('COMPLETED');
    expect(assessment.riskScore).toBeGreaterThan(0);
  });
});
```

---

## ⚠️ IMPORTANT ISSUES (Should Fix Before Migration)

### Issue #8: No "Optional Section" Support in Schema

**Severity:** 🟠 IMPORTANT - Feature incomplete

**Problem:**
Migration plan describes Section 12 (AI Readiness) as "integrated" but optional. However:
- No `Section.isOptional` field in schema
- No way to mark section as optional
- No frontend UI to toggle optional sections
- Assessment execution assumes all sections required

**Impact:**
- Cannot implement true "optional AI module" functionality
- All users must complete AI section (even if not relevant)
- Cannot track which users opted in/out of AI module
- Scoring will include AI section for all assessments

**Current Workaround:**
Migration plan treats AI as "integrated" (weight: 0.05), so it's not truly optional. Users must answer all questions.

**Resolution Options:**

**Option A: Keep AI Integrated (Current Plan)**
✅ No schema changes needed
✅ Simpler implementation
✅ AI section always included in score
❌ Not truly "optional" as originally conceived
❌ Forces all users to answer AI questions

**Option B: Implement True Optional Sections (Future Enhancement)**
Add schema field:
```prisma
model Section {
  // ... existing fields
  isOptional Boolean @default(false)  // ✅ ADD THIS
}
```

Frontend changes:
- Add checkbox "Include AI Readiness Module?" before assessment
- Store choice in Assessment.metadata
- Skip optional sections if not selected
- Adjust scoring to exclude optional section weight

**Recommendation:**
- **For v3.0 MVP:** Use Option A (integrated AI, not optional)
- **For v3.1:** Implement Option B if user feedback requests true optional sections

**Update Migration Plan:**
Change Section 2.3 to clarify AI is "integrated" not "optional":
```
Section 12: AI Readiness (Integrated) - 0.05 (5.0%)
Note: While called "AI Readiness," this section is integrated into
the v3.0 scoring model, not optional. Organizations should answer
all questions even if AI usage is limited.
```

---

### Issue #9: Section Count Inconsistency in Documentation

**Severity:** 🟡 MEDIUM - Confusing but not blocking

**Problem:**
Documentation uses inconsistent language about section count:

**seed-templates-enhanced.ts (line 5-6):**
```typescript
// Coverage: 11 core sections + 1 optional AI module
// Questions: 75 core + 10 optional AI = 85 total
```

**Migration Plan Section 2.3:**
```markdown
**12 Sections (AI Module Integrated):**
| 12 | AI Readiness (Integrated) | 0.05 | 5.0% |
```

**FINANCIAL_CRIME_TEMPLATE_V3_SPECIFICATION.md (line 7):**
```markdown
**Sections:** 12 (11 core + 1 optional)
```

**Confusion:**
- Is AI "optional" or "integrated"?
- Are there 11 or 12 sections?

**Impact:**
- User confusion about what to expect
- Developer confusion about implementation
- Documentation inconsistency erodes trust

**Resolution:**
**Decision:** AI section is INTEGRATED (as per weighting), not optional.

Update all documentation to consistently state:
```
✅ "12 sections (all integrated, including AI Readiness)"
✅ "85 questions across 12 sections"
❌ "11 core + 1 optional" (remove this language)
❌ "75 core + 10 optional" (remove this language)
```

**Files to Update:**
- `/backend/prisma/seed-templates-enhanced.ts` (line 5-6)
- `/docs/FINANCIAL_CRIME_TEMPLATE_V3_SPECIFICATION.md` (line 7)
- `/docs/TEMPLATE_V3_MIGRATION_PLAN.md` (ensure consistency)

---

### Issue #10: Estimated Minutes Mismatch

**Severity:** 🟡 MEDIUM - User expectation issue

**Problem:**
Different time estimates in different places:

| Location | Estimate |
|----------|----------|
| seed-templates-enhanced.ts | 90 minutes |
| FINANCIAL_CRIME_TEMPLATE_V3_SPECIFICATION.md | 75-90 minutes |
| Migration Plan Section 9.1 | < 90 minutes (success criteria) |

**Impact:**
- Users see "90 minutes" but spec says "75-90"
- Unclear which is authoritative
- May under/over-estimate time commitment

**Resolution:**
Standardize on **75-90 minutes** range:

```typescript
// seed-templates-enhanced.ts
estimatedMinutes: 90,  // ✅ Keep as upper bound
estimatedRange: "75-90 minutes",  // ✅ Add this field for UI display
```

Frontend display:
```jsx
<span>Estimated time: 75-90 minutes</span>
```

---

### Issue #11: No "isRequired" Logic for Questions

**Severity:** 🟡 MEDIUM - UX issue

**Problem:**
Seed interface has `isRequired: boolean` field, but:
- All questions in current seed have `isRequired: true`
- No validation enforces required questions
- Users cannot skip any questions

**Questions:**
1. Should foundational questions be automatically required?
2. Can any questions be optional?
3. How does this affect scoring (skip = 0 score)?

**Impact:**
- Assessment becomes very long (85 required questions)
- No flexibility for organizations to skip non-applicable questions
- May reduce completion rate

**Resolution:**
Define required question policy:

**Option A: All Foundational Required, Others Optional**
```typescript
{
  question: "...",
  weight: 2.0,
  isFoundational: true,
  isRequired: true,  // ✅ Auto-require foundational
}

{
  question: "...",
  weight: 1.0,
  isFoundational: false,
  isRequired: false,  // ✅ Standard questions optional
}
```

**Option B: All Required (Current)**
Keep all 85 questions required for comprehensive assessment.

**Option C: Section-Level Required**
Mark entire sections as required/optional.

**Recommendation:**
- **For MVP:** Option B (all required) for data completeness
- **For v3.1:** Option A (foundational required) based on user feedback

---

### Issue #12: Missing Tags Field in Seed Interface

**Severity:** 🟡 MEDIUM - Metadata incomplete

**Problem:**
Schema has `Question.categoryTag` but seed interface uses different structure:

**Schema:**
```prisma
model Question {
  categoryTag String? // Single tag
}
```

**Seed Interface:**
```typescript
interface QuestionData {
  tags: string[];  // Array of tags
}
```

**Mismatch:**
- Interface expects array: `['sanctions', 'kyc', 'ofac']`
- Schema expects single string: `'sanctions'`

**Impact:**
- Seed will fail to map tags correctly
- Questions won't be properly categorized
- Search/filter by category will fail

**Resolution:**

**Option A: Use First Tag Only**
```typescript
categoryTag: questionData.tags[0]  // Take first tag
```

**Option B: Join Tags**
```typescript
categoryTag: questionData.tags.join(',')  // 'sanctions,kyc,ofac'
```

**Option C: Update Schema to Support Array**
```prisma
model Question {
  categoryTags String[] @default([])  // Array support
}
```

**Recommendation:** Option A for v3.0 (simplest), Option C for v3.1 (better)

---

### Issue #13: No Validation Script for Weights

**Severity:** 🟡 MEDIUM - Quality assurance

**Problem:**
No automated script to verify:
- Section weights sum to 1.0
- Question weights per section sum to 1.0
- All foundational questions flagged correctly
- Regulatory priorities populated

**Impact:**
- Manual verification required
- High risk of human error
- No CI/CD validation

**Resolution:**
Create validation script:

```typescript
// backend/scripts/validate-template-weights.ts
async function validateTemplateWeights(templateSlug: string) {
  const template = await prisma.template.findUnique({
    where: { slug: templateSlug },
    include: {
      sections: {
        include: { questions: true }
      }
    }
  });

  const errors: string[] = [];

  // 1. Validate section weights
  const sectionWeightSum = template.sections.reduce((sum, s) => sum + s.weight, 0);
  if (Math.abs(sectionWeightSum - 1.0) > 0.001) {
    errors.push(`Section weights sum to ${sectionWeightSum}, must equal 1.0`);
  }

  // 2. Validate question weights per section
  for (const section of template.sections) {
    const questionWeightSum = section.questions.reduce((sum, q) => sum + q.weight, 0);
    if (Math.abs(questionWeightSum - 1.0) > 0.001) {
      errors.push(`Section "${section.title}" question weights sum to ${questionWeightSum}, must equal 1.0`);
    }
  }

  // 3. Validate foundational question count
  const foundationalCount = template.sections
    .flatMap(s => s.questions)
    .filter(q => q.isFoundational).length;

  if (foundationalCount < 40 || foundationalCount > 50) {
    errors.push(`Expected ~45 foundational questions, found ${foundationalCount}`);
  }

  // 4. Validate regulatory priorities
  const sectionsWithoutPriority = template.sections.filter(s => !s.regulatoryPriority);
  if (sectionsWithoutPriority.length > 0) {
    errors.push(`${sectionsWithoutPriority.length} sections missing regulatoryPriority`);
  }

  if (errors.length > 0) {
    console.error('❌ Validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  } else {
    console.log('✅ All validations passed');
  }
}
```

Add to CI/CD:
```yaml
# .github/workflows/ci.yml
- name: Validate Template Weights
  run: npx tsx backend/scripts/validate-template-weights.ts financial-crime-compliance-v3
```

---

### Issue #14: No Rollback Test

**Severity:** 🟡 MEDIUM - Risk management

**Problem:**
Migration plan documents rollback procedures (Section 7) but:
- No rollback has been tested
- No staging environment verification
- Rollback SQL scripts not created

**Impact:**
- Rollback may fail when needed
- Production downtime risk if issues discovered
- No confidence in recovery procedures

**Resolution:**
1. Create rollback SQL scripts:

```sql
-- rollback-v3-soft.sql
-- Soft rollback: Deactivate v3.0
UPDATE "Template"
SET "isActive" = false
WHERE slug = 'financial-crime-compliance-v3';
```

```sql
-- rollback-v3-hard.sql
-- Hard rollback: Delete v3.0 (USE WITH CAUTION)
-- First verify no assessments exist
DO $$
DECLARE
  assessment_count INT;
BEGIN
  SELECT COUNT(*) INTO assessment_count
  FROM "Assessment" a
  JOIN "Template" t ON a."templateId" = t.id
  WHERE t.slug = 'financial-crime-compliance-v3';

  IF assessment_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete v3.0: % assessments exist. Use soft rollback.', assessment_count;
  END IF;

  DELETE FROM "Template"
  WHERE slug = 'financial-crime-compliance-v3';
END $$;
```

2. Test rollback in staging:
```bash
# Test soft rollback
psql < rollback-v3-soft.sql
# Verify v3.0 not visible
curl /api/v1/templates | grep "financial-crime-compliance-v3"
# Should return empty

# Reactivate
psql -c "UPDATE \"Template\" SET \"isActive\" = true WHERE slug = 'financial-crime-compliance-v3';"
```

---

### Issue #15: Frontend Changes Not Documented

**Severity:** 🟡 MEDIUM - Incomplete plan

**Problem:**
Migration plan shows backend implementation but doesn't detail frontend changes needed:

**Missing Frontend Specifications:**
- How to display section weights in UI?
- How to highlight foundational questions?
- How to show regulatory priority references?
- Updated assessment progress bar (90 min estimate)?
- Version comparison modal implementation?

**Impact:**
- Frontend developers don't know what to build
- UI may not leverage new weighting metadata
- Inconsistent user experience

**Resolution:**
Create frontend implementation spec:

```markdown
## Frontend Changes for v3.0

### Template Selection Page
- [ ] Add version badge ("v3.0 - Enhanced")
- [ ] Show "85 questions, 75-90 minutes"
- [ ] Add "Compare Versions" button
- [ ] Create TemplateComparisonModal component

### Assessment Execution
- [ ] Progress bar updated for 85 questions
- [ ] Display section weights in section headers
- [ ] Highlight foundational questions with icon
- [ ] Show regulatory priority in help text
- [ ] Update save/resume logic for larger assessment

### Results Page
- [ ] Display weighted section scores
- [ ] Show "This section accounts for X% of overall score"
- [ ] Highlight foundational questions in section breakdown
- [ ] Link regulatory priorities to documentation

### Components to Create/Update
1. TemplateVersionSelector.tsx (new)
2. TemplateComparisonModal.tsx (new)
3. SectionHeader.tsx (update to show weight %)
4. QuestionView.tsx (update to show foundational badge)
5. SectionBreakdownPanel.tsx (already shows weights ✅)
```

---

### Issue #16: No Performance Testing for 85-Question Assessment

**Severity:** 🟡 MEDIUM - Performance unknown

**Problem:**
v2.0 has 24 questions, v3.0 has 85 questions (3.5× increase). No testing of:
- Page load time with 85 questions
- Save/autosave performance
- Database query performance (more joins)
- AI analysis time (3.5× more questions)
- Report generation time

**Impact:**
- Potential performance degradation
- User frustration with slow responses
- Database query timeout risk
- Higher AI API costs

**Resolution:**
Create performance test suite:

```typescript
// backend/tests/performance/v3-assessment.perf.ts
describe('v3.0 Assessment Performance', () => {

  test('should load template with 85 questions in < 2s', async () => {
    const start = Date.now();
    const template = await api.getTemplate('financial-crime-compliance-v3');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(2000);
    expect(template.sections.length).toBe(12);
  });

  test('should save progress for 85 questions in < 1s', async () => {
    const assessment = await createTestAssessment('v3');
    const answers = generateTestAnswers(85);

    const start = Date.now();
    await api.saveAssessmentProgress(assessment.id, answers);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);
  });

  test('should complete AI analysis in < 5 minutes', async () => {
    // Test AI analysis time for 85 questions
  });

  test('should generate report in < 30 seconds', async () => {
    // Test report generation performance
  });
});
```

Run performance benchmarks:
```bash
# Baseline v2.0
npm run test:perf -- --grep "v2.0"

# Compare v3.0
npm run test:perf -- --grep "v3.0"

# Check for regressions
```

---

### Issue #17: Credit Cost Not Defined for v3.0

**Severity:** 🟡 MEDIUM - Business logic incomplete

**Problem:**
v2.0 assessment costs 50 credits (documented in `TemplateCosts.tsx`). v3.0 credit cost not defined:
- Is it 50 credits (same as v2.0)?
- More credits due to 3.5× more questions?
- More credits due to AI analysis time?

**Impact:**
- Cannot configure subscription limits
- Users don't know cost before starting
- Revenue model unclear

**Resolution:**
Define v3.0 credit cost based on:

**Factors to Consider:**
1. **Question Count:** 3.5× more questions
2. **AI Analysis Time:** ~3.5× more API calls to OpenAI
3. **Report Complexity:** More comprehensive report
4. **Value Proposition:** 3× better coverage

**Recommendation:**
```typescript
// Option A: Same price (increase value, same cost)
v3CreditCost: 50  // ✅ Good for adoption

// Option B: Proportional increase
v3CreditCost: 75  // 50% increase (less than 3.5× to encourage upgrades)

// Option C: Premium pricing
v3CreditCost: 100  // 2× increase (enterprise-grade assessment)
```

**Update Required:**
```typescript
// frontend/src/pages/admin/TemplateCosts.tsx
const TEMPLATE_COSTS = {
  'financial-crime-compliance': 50,      // v2.0
  'financial-crime-compliance-v3': 75,  // v3.0 - ADD THIS
};
```

**Also Update:**
- Migration plan Section 1.3 (affected components)
- Freemium limits (do free users get v3.0?)
- Pricing page documentation

---

### Issue #18: No Migration from Draft v2.0 to v3.0

**Severity:** 🟡 MEDIUM - User experience gap

**Problem:**
Migration plan describes draft migration (Section 4, Phase 2) but:
- No implementation of `migrateAssessmentToV3()` function
- No UI prompt for users with in-progress v2.0 assessments
- Question mapping not implemented in code (only documented)

**Impact:**
- Users with draft v2.0 assessments must start over
- Lost work and frustration
- Lower v3.0 adoption

**Resolution:**
Implement migration service:

```typescript
// backend/src/services/assessment-migration.service.ts
export class AssessmentMigrationService {

  async migrateToV3(v2AssessmentId: string, userId: string): Promise<Assessment> {
    // 1. Verify v2 assessment is draft
    const v2Assessment = await this.prisma.assessment.findUnique({
      where: { id: v2AssessmentId },
      include: { answers: true }
    });

    if (v2Assessment.status !== 'DRAFT') {
      throw new Error('Can only migrate draft assessments');
    }

    // 2. Load v3 template
    const v3Template = await this.prisma.template.findUnique({
      where: { slug: 'financial-crime-compliance-v3' },
      include: { sections: { include: { questions: true } } }
    });

    // 3. Create v3 assessment
    const v3Assessment = await this.prisma.assessment.create({
      data: {
        organizationId: v2Assessment.organizationId,
        userId,
        templateId: v3Template.id,
        status: 'DRAFT',
      }
    });

    // 4. Map compatible answers
    const questionMapping = this.getV2ToV3QuestionMapping();
    for (const v2Answer of v2Assessment.answers) {
      const v3QuestionId = questionMapping[v2Answer.questionId];
      if (v3QuestionId) {
        await this.prisma.answer.create({
          data: {
            assessmentId: v3Assessment.id,
            questionId: v3QuestionId,
            score: v2Answer.score,
            explanation: v2Answer.explanation,
            status: 'IN_PROGRESS',  // Mark for review
          }
        });
      }
    }

    // 5. Archive v2 draft
    await this.prisma.assessment.update({
      where: { id: v2AssessmentId },
      data: {
        status: 'ARCHIVED',
        metadata: { migratedToV3: v3Assessment.id }
      }
    });

    return v3Assessment;
  }

  private getV2ToV3QuestionMapping(): Record<string, string> {
    // Implement question ID mapping from migration plan Section 3.1
    return {
      // v2.0 question ID => v3.0 question ID
    };
  }
}
```

Frontend component:
```tsx
// Show to users with draft v2.0 assessments
{hasDraftV2 && (
  <Alert>
    <AlertTitle>Upgrade to Enhanced Assessment</AlertTitle>
    <AlertDescription>
      You have an in-progress v2.0 assessment. Upgrade to v3.0 to
      get 3× better coverage. Compatible answers will be migrated.
      <Button onClick={handleMigrate}>Upgrade to v3.0</Button>
    </AlertDescription>
  </Alert>
)}
```

---

### Issue #19: AI Module Weight Edge Case Not Handled

**Severity:** 🟟 LOW - Edge case

**Problem:**
If AI section (weight 0.05) has all questions answered with score=0:
- Section score = 0
- Contributes 0 to overall score
- But weight still counted in denominator

**Question:** Is this the intended behavior?

**Example:**
```
Governance: 80/100 × 0.1425 = 11.4
CDD: 70/100 × 0.114 = 7.98
...
AI: 0/100 × 0.05 = 0  ← Zero contribution
---
Overall: (11.4 + 7.98 + ... + 0) / 1.0 = X
```

vs.

```
If AI skipped entirely, would overall score be higher?
```

**Impact:**
- Minimal (only 5% weight)
- Edge case: organization has no AI usage
- Penalizes honest "N/A" answers

**Resolution:**
**Option A: Keep as-is** (current behavior)
- Zero score for AI section is legitimate
- 5% penalty motivates AI readiness

**Option B: Adjust denominator if section scored 0**
- If section score = 0, exclude from weighting
- Redistribute weight proportionally to other sections

**Recommendation:** Option A (simpler, clearer)

---

## 📋 ISSUES SUMMARY TABLE

| # | Issue | Severity | Category | Blocker? | Est. Time |
|---|-------|----------|----------|----------|-----------|
| 1 | Slug naming inconsistency | 🔴 CRITICAL | Data | ✅ YES | 15 min |
| 2 | Incomplete seed file (10/12 sections missing) | 🔴 CRITICAL | Implementation | ✅ YES | 1-2 days |
| 3 | No weights in current implementation | 🔴 CRITICAL | Data | ✅ YES | 2 hours |
| 4 | Field name mismatch (displayOrder vs order) | 🔴 CRITICAL | Schema | ✅ YES | 30 min |
| 5 | Seed functions not implemented | 🔴 CRITICAL | Implementation | ✅ YES | 2 hours |
| 6 | No question weight normalization | 🟠 HIGH | Logic | ✅ YES | 1 hour |
| 7 | Missing integration test | 🟠 HIGH | Quality | ⚠️ SHOULD | 2 hours |
| 8 | No optional section support in schema | 🟠 IMPORTANT | Feature | ❌ NO | N/A (defer) |
| 9 | Section count inconsistency in docs | 🟡 MEDIUM | Documentation | ❌ NO | 30 min |
| 10 | Estimated minutes mismatch | 🟡 MEDIUM | Documentation | ❌ NO | 15 min |
| 11 | No isRequired logic | 🟡 MEDIUM | UX | ❌ NO | N/A (defer) |
| 12 | Missing tags field mapping | 🟡 MEDIUM | Data | ❌ NO | 30 min |
| 13 | No validation script | 🟡 MEDIUM | Quality | ❌ NO | 1 hour |
| 14 | No rollback test | 🟡 MEDIUM | Risk | ❌ NO | 1 hour |
| 15 | Frontend changes not documented | 🟡 MEDIUM | Documentation | ❌ NO | 2 hours |
| 16 | No performance testing | 🟡 MEDIUM | Performance | ❌ NO | 2 hours |
| 17 | Credit cost not defined | 🟡 MEDIUM | Business | ❌ NO | 30 min |
| 18 | No draft migration implementation | 🟡 MEDIUM | Feature | ❌ NO | 4 hours |
| 19 | AI weight edge case | 🟟 LOW | Edge case | ❌ NO | N/A |

**Total Issues:** 19
**Critical Blockers:** 7
**High Priority:** 2
**Must Fix Before Migration:** 9 issues

---

## ✅ WHAT'S WORKING WELL

### 1. Database Schema ✅
- Schema supports all required fields (weight, isFoundational, regulatoryPriority)
- No migrations needed
- Indexes properly configured
- Backward compatible

### 2. Weighted Scoring Service ✅
- Fully implemented and tested (90% coverage)
- Supports two-level weighting
- Evidence tier multipliers working
- Validation built-in
- Located at: `backend/src/services/weighted-scoring.service.ts`

### 3. Migration Strategy ✅
- Parallel deployment approach sound
- Version suffix slug strategy correct
- Rollback procedures documented
- Phased rollout plan comprehensive

### 4. Specification Quality ✅
- v3.0 specification complete and detailed
- All 85 questions documented
- Scoring rules defined
- AI prompts provided

### 5. Frontend Display Ready ✅
- `SectionBreakdownPanel.tsx` already displays weights
- Components can render weighted scores
- No frontend breaking changes required

---

## 🎯 RECOMMENDED FIX PRIORITY

### Phase 1: Blocking Issues (DO THESE FIRST)
**Estimated Time: 2-3 days**

1. **Fix slug** (15 min) - Change to `financial-crime-compliance-v3`
2. **Fix field names** (30 min) - Change `displayOrder` → `order`
3. **Update interfaces** (2 hours) - Add weight, isFoundational fields
4. **Implement seed functions** (2 hours) - Complete seeding logic
5. **Add weight normalization** (1 hour) - Normalize question weights
6. **Complete remaining 10 sections** (1-2 days) - Implement all questions with weights
7. **Create integration test** (2 hours) - Verify seeding works

### Phase 2: Important Issues (DO BEFORE PRODUCTION)
**Estimated Time: 1 day**

8. **Create validation script** (1 hour)
9. **Test rollback procedures** (1 hour)
10. **Fix documentation inconsistencies** (1 hour)
11. **Define credit cost** (30 min)
12. **Fix tags field mapping** (30 min)
13. **Document frontend changes** (2 hours)
14. **Add performance tests** (2 hours)

### Phase 3: Nice to Have (POST-MVP)
**Estimated Time: 1-2 days**

15. **Implement draft migration** (4 hours)
16. **Add optional section support** (future v3.1)
17. **Implement isRequired logic** (future v3.1)
18. **Handle AI weight edge case** (if needed)

---

## 🚦 GO/NO-GO DECISION CRITERIA

### ✅ GO (Safe to Migrate) When:
- [ ] All 7 critical issues resolved
- [ ] Integration test passing
- [ ] Validation script confirms weights = 1.0
- [ ] Staging environment tested
- [ ] Rollback tested successfully
- [ ] Frontend changes documented
- [ ] Credit cost defined

### 🔴 NO-GO (Block Migration) If:
- [ ] Any critical issue unresolved
- [ ] Weights don't sum to 1.0
- [ ] Seed fails in staging
- [ ] No rollback plan tested
- [ ] Performance regression > 50%

---

## 📞 SUPPORT & ESCALATION

**For Critical Issues:**
Contact: Development Team Lead
Action: Daily standup to track resolution

**For Important Issues:**
Contact: Product Manager
Action: Include in sprint planning

**For Nice-to-Have:**
Contact: Product Backlog
Action: Schedule for v3.1 release

---

**Review Complete: 2025-10-20**
**Next Review: After Phase 1 fixes completed**
