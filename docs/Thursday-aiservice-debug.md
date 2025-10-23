# Thursday AI Service Debug Session

**Date**: 2025-10-22 (Thursday)
**Status**: Scoring algorithm fixed, AI document analysis failing
**Current Score**: 35/100 (Expected: 65/100)

---

## Executive Summary

We've successfully fixed the scoring algorithm bugs (control effectiveness + risk severity), but discovered a more fundamental issue: **our AI document analysis is failing to extract compliance evidence from uploaded documents**.

### Scoring Algorithm Status: ✅ FIXED
- Control effectiveness field added and working
- Risk severity calculations balanced (no more CRITICAL/CATASTROPHIC overkill)
- Score calculation formula working correctly

### AI Document Extraction Status: ❌ BROKEN
- 71.9% of answers scoring 0/5 (no evidence found)
- Should be finding strong evidence in NovaPay documents
- AI not matching document content to assessment questions

---

## Current Assessment Analysis

### Latest Assessment Details
- **ID**: cmh29brci0001naklxd8qlq50
- **Organization**: ExpertChatSolutions
- **Template**: Financial Crime Compliance Assessment (Enhanced)
- **Created**: 2025-10-22T17:18:27.378Z
- **Overall Score**: 35/100

### Answer Distribution
```
Score 5/5: 17 answers (19.1%)  ← Only finding evidence 19% of the time
Score 4/5:  1 answers (1.1%)
Score 3/5:  1 answers (1.1%)
Score 2/5:  6 answers (6.7%)
Score 0/5: 64 answers (71.9%)  ← Missing evidence 72% of the time!
Average: 1.17/5 (23.4%)
```

### Risk Distribution
```
Total Risks: 66
- HIGH: 58 risks
- MEDIUM: 6 risks
- LOW: 2 risks
Average Control Effectiveness: 5.2%
```

### Sample Risks
All risks show same pattern:
- **Severity**: HIGH (was CRITICAL before fix ✅)
- **Likelihood**: LIKELY (was CERTAIN before fix ✅)
- **Impact**: MAJOR (was CATASTROPHIC before fix ✅)
- **Control Effectiveness**: 0% (AI not finding controls ❌)

---

## Expected vs Actual Comparison

### NovaPay Document 13: Expected Results

**Overall Score**: 65/100 (Medium Risk)

**Section Scores**:
```
1.  Geographic Risk: 62/100 (outdated assessments, manual tracking)
2.  Governance: 72/100 (sound structure; reporting cadence gaps)
3.  EWRA: 67/100 (annual only; weak scenarios/stress tests)
4.  CDD: 67/100 (UBO gaps; backlog; manual share)
5.  Adverse Media: 57/100 (periodic, not continuous; backlog)
6.  Sanctions: 77/100 (strong coverage; alert fatigue)
7.  Transaction Monitoring: 62/100 (tuning delays; backlog)
8.  Fraud: 72/100 (good tools; limited AML integration)
9.  Technology: 67/100 (data silos; legacy components)
10. Training: 62/100 (completion gap; generic content)
11. Monitoring/Audit/QA: 58/100 (audit overdue; open findings)
12. AI Readiness: 45/100 (governance not in place)
```

**Expected Risk Profile**:
- 10 risks total
- Mix of HIGH and MEDIUM severity
- Specific, actionable risks with clear mitigation strategies

### Our System's Actual Results

**Overall Score**: 35/100 (30 points below expected)

**Key Differences**:

| Metric | Expected | Actual | Delta |
|--------|----------|--------|-------|
| Overall Score | 65/100 | 35/100 | -30 points |
| Risks Generated | 10 risks | 66 risks | +56 risks |
| Answer Quality | 62-77% per section | 23.4% overall | -40 points avg |
| Risk Severity | HIGH/MEDIUM mix | 58 HIGH, 6 MED, 2 LOW | Too many HIGH |
| Control Effectiveness | Strong (60-80%) | 5.2% | -60 points |

---

## Root Cause Analysis

### The Problem: AI Document Analysis Failure

**Evidence from Documents vs System Response**:

#### Example 1: Sanctions (Expected 77/100)
**Document Evidence** (NovaPay Doc 6):
- Automated screening across OFAC, EU, UN, UK HMT lists
- Daily automated updates
- Real-time and batch screening
- Comprehensive match resolution procedures
- Alert management with SLA tracking

**System Response**: 0/5 (No evidence found) ❌

---

#### Example 2: Governance (Expected 72/100)
**Document Evidence** (NovaPay Doc 2):
- Three Lines of Defense model
- Quarterly board compliance reviews
- Dedicated MLRO with direct board access
- Independent compliance function
- Risk appetite framework

**System Response**: 0/5 (No evidence found) ❌

---

#### Example 3: Training (Expected 62/100)
**Document Evidence** (NovaPay Doc 10):
- 94% completion rate (vs 98% target)
- Role-based training modules
- Annual AML refresher requirements
- Senior management training
- New hire onboarding program

**System Response**: 0/5 (No evidence found) ❌

---

#### Example 4: AI Readiness (Expected 45/100 - Lowest Score)
**Document Evidence** (NovaPay Doc 12):
- Limited AI governance framework
- No formal AI inventory
- EU AI Act compliance gap
- Bias testing not implemented

**System Response**: 0/5 (No evidence found) ❌

**Note**: Even the WEAKEST area (AI Readiness at 45/100) should score higher than 0/5!

---

## Why The Scoring Algorithm is Now Correct

### Before Our Fixes Today:
```
Score: 2/100 with following issues:
1. Missing controlEffectiveness field → All risks 100% unmitigated
2. CERTAIN + CATASTROPHIC + CRITICAL for score=0 → 65 CRITICAL risks
3. Risk impact calculation: 65 × 75 = 4,875 total impact
4. Result: Catastrophically low score
```

### After Our Fixes:
```
Score: 35/100 with correct logic:
1. controlEffectiveness field exists (averages 5.2% based on answer scores)
2. LIKELY + MAJOR + HIGH for score=0 → 58 HIGH risks
3. Risk impact calculation: 58 × 27 = 1,566 total impact
4. Result: Low but reasonable score given poor input data
```

**The scoring formula is working correctly!** The problem is:
```
Low answer scores (72% at 0/5) → Low control effectiveness (5%) → Low overall score (35%)
```

This is the **correct behavior** when the AI can't find evidence. The issue is that **evidence exists but AI isn't finding it**.

---

## Technical Investigation Path

### Step 1: Verify Document Parsing ✅

Let's confirm documents are being parsed:

```bash
# Check parsed content exists
SELECT id, filename, LENGTH(parsedContent) as content_length
FROM Document
WHERE organizationId = 'cmh1noavm0001na6d3amx9j6m'
ORDER BY createdAt DESC;
```

**Expected**: parsedContent should contain actual document text (5-20KB per document)
**If NULL/empty**: Document parsing is broken
**If populated**: Parsing works, AI matching is broken

---

### Step 2: Check AI Service Configuration

**File**: `/backend/src/services/ai-analysis.service.ts`

**Questions to answer**:
1. Is OpenAI API key configured correctly?
2. Are we using real AI or mock responses?
3. What prompts are we sending to OpenAI?
4. How are we matching document content to questions?

**Check for**:
```typescript
// Look for these patterns:
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey || apiKey.includes('your-api-key')) {
  // Using mock/fallback - BAD!
}

// Should be using real OpenAI:
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [/* question + document context */],
});
```

---

### Step 3: Test Single Question Analysis

Create a minimal test case:

```javascript
// test-single-question.mjs
import { AIAnalysisService } from './src/services/ai-analysis.service.ts';

const aiService = new AIAnalysisService();

const question = {
  text: "Does your organization have automated sanctions screening?",
  category: "Sanctions Screening"
};

const documentText = `
NovaPay Sanctions Screening Program:
- Automated screening across OFAC, EU, UN, UK HMT lists
- Daily automated updates from authoritative sources
- Real-time screening for all new customers
- Batch screening of existing customer base weekly
`;

const result = await aiService.analyzeAnswer({
  question,
  documentText,
  organizationProfile: {}
});

console.log('Expected Score: 4-5/5');
console.log('Actual Score:', result.score);
console.log('Reasoning:', result.reasoning);
```

**Expected**: Score of 4-5/5 with explanation finding the evidence
**If 0/5**: AI prompt is wrong or AI service is broken

---

### Step 4: Check Answer Service

**File**: `/backend/src/services/answer.service.ts`

The answer service orchestrates the AI analysis. Check:

1. How are documents passed to AI analysis?
2. Is document content being truncated?
3. Are we sending the right context to OpenAI?
4. What's the actual prompt structure?

**Key method to inspect**:
```typescript
// Look for how answers are generated
async generateAnswerWithAI(questionId, documents, organizationProfile) {
  // This should:
  // 1. Get question details
  // 2. Get parsed document content
  // 3. Send to AI for analysis
  // 4. Return score + explanation
}
```

---

### Step 5: Review OpenAI Prompts

**Critical**: The prompts we send to OpenAI determine answer quality.

**Good prompt structure**:
```
You are a compliance expert analyzing documents.

Question: Does your organization have automated sanctions screening?

Document Evidence:
<actual parsed content from all documents>

Task:
- Search for evidence related to the question
- Score 0-5 based on evidence quality:
  * 5 = Comprehensive evidence, best practices
  * 4 = Strong evidence, minor gaps
  * 3 = Adequate evidence, some gaps
  * 2 = Minimal evidence, significant gaps
  * 1 = Very weak evidence
  * 0 = No evidence found
- Provide detailed reasoning
- Cite specific document sections

Return JSON: { score: number, reasoning: string, evidence: string[] }
```

**Bad prompt structure** (likely current issue):
```
Analyze this: <generic prompt>
<maybe no document content?>
<unclear scoring criteria?>
```

---

## Diagnostic Scripts to Run

### 1. Check Document Parsing Status

```bash
node check-document-parsing.mjs
```

```javascript
// check-document-parsing.mjs
import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

const docs = await prisma.document.findMany({
  where: { organizationId: 'cmh1noavm0001na6d3amx9j6m' },
  select: {
    id: true,
    filename: true,
    parsedContent: true,
  }
});

docs.forEach(doc => {
  const hasContent = doc.parsedContent && doc.parsedContent.length > 0;
  const contentLength = doc.parsedContent?.length || 0;

  console.log(`${doc.filename}:`);
  console.log(`  Parsed: ${hasContent ? 'YES' : 'NO'}`);
  console.log(`  Length: ${contentLength} chars`);

  if (hasContent) {
    // Show first 200 chars
    console.log(`  Preview: ${doc.parsedContent.substring(0, 200)}...`);
  }
  console.log();
});

await prisma.$disconnect();
```

---

### 2. Check AI Service Configuration

```bash
node check-ai-config.mjs
```

```javascript
// check-ai-config.mjs
import { AIAnalysisService } from './src/services/ai-analysis.service.js';

const service = new AIAnalysisService();

console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ?
  `Set (${process.env.OPENAI_API_KEY.substring(0, 10)}...)` :
  'NOT SET');

console.log('OpenAI Model:', process.env.OPENAI_MODEL || 'gpt-4o-mini (default)');

// Try to call service
try {
  const testResult = await service.analyzeAnswer({
    questionText: 'Test question',
    documentContent: 'Test content',
    organizationProfile: {}
  });

  console.log('\nAI Service Status: WORKING');
  console.log('Test Response:', testResult);
} catch (error) {
  console.log('\nAI Service Status: FAILED');
  console.log('Error:', error.message);
}
```

---

### 3. Check Answer Generation

```bash
node check-answer-generation.mjs
```

```javascript
// check-answer-generation.mjs
import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();

const assessment = await prisma.assessment.findFirst({
  where: { id: 'cmh29brci0001naklxd8qlq50' },
  include: {
    answers: {
      include: {
        question: { select: { text: true, categoryTag: true } }
      },
      orderBy: { score: 'desc' },
      take: 10
    }
  }
});

console.log('=== TOP 10 ANSWERS ===\n');
assessment.answers.forEach((answer, i) => {
  console.log(`[${i+1}] Score: ${answer.score}/5`);
  console.log(`Question: ${answer.question.text.substring(0, 100)}...`);
  console.log(`Category: ${answer.question.categoryTag}`);
  console.log(`Explanation: ${answer.explanation.substring(0, 200)}...`);
  console.log();
});

console.log('\n=== BOTTOM 10 ANSWERS (0 scores) ===\n');
const zeroScores = await prisma.answer.findMany({
  where: {
    assessmentId: 'cmh29brci0001naklxd8qlq50',
    score: 0
  },
  include: {
    question: { select: { text: true, categoryTag: true } }
  },
  take: 10
});

zeroScores.forEach((answer, i) => {
  console.log(`[${i+1}] Score: 0/5`);
  console.log(`Question: ${answer.question.text.substring(0, 100)}...`);
  console.log(`Category: ${answer.question.categoryTag}`);
  console.log(`Explanation: ${answer.explanation.substring(0, 200)}...`);
  console.log();
});

await prisma.$disconnect();
```

---

## Hypotheses to Test

### Hypothesis 1: Documents Not Being Parsed
**Test**: Run `check-document-parsing.mjs`
**Expected**: parsedContent is NULL or empty
**Fix**: Investigate DocumentParserService, check S3 access

### Hypothesis 2: AI Service Using Mock Data
**Test**: Check `/backend/src/services/ai-analysis.service.ts`
**Expected**: Using mock/fallback instead of real OpenAI
**Fix**: Configure OpenAI API key, remove mock fallbacks

### Hypothesis 3: Documents Not Passed to AI
**Test**: Run `check-answer-generation.mjs`, look at explanations
**Expected**: Explanations say "no documents provided" or generic responses
**Fix**: Update answer generation to include parsed document content

### Hypothesis 4: AI Prompts Are Wrong
**Test**: Inspect actual prompts sent to OpenAI
**Expected**: Prompts don't include document content or unclear scoring criteria
**Fix**: Rewrite prompts to include full context and clear scoring rubric

### Hypothesis 5: Token Limits Truncating Documents
**Test**: Check if large documents are being truncated
**Expected**: Only first paragraph of documents sent to AI
**Fix**: Implement chunking or summarization strategy

---

## Success Criteria

When AI document analysis is working, we should see:

1. **Answer Distribution**:
   ```
   Score 5/5: ~25% (excellent evidence found)
   Score 4/5: ~20% (strong evidence)
   Score 3/5: ~20% (adequate evidence)
   Score 2/5: ~15% (weak evidence)
   Score 1/5: ~10% (very weak evidence)
   Score 0/5: ~10% (no evidence - legitimate gaps)
   Average: 3.3/5 (66%)
   ```

2. **Overall Score**: 60-70/100 (matching NovaPay expected 65/100)

3. **Risk Distribution**:
   ```
   Total Risks: 10-15 (not 66!)
   CRITICAL: 2-3 risks
   HIGH: 3-5 risks
   MEDIUM: 3-5 risks
   LOW: 2-3 risks
   ```

4. **Control Effectiveness**: Average 60-70% (not 5%!)

5. **Explanations**: Should cite specific document sections:
   ```
   Example:
   "Evidence found in Sanctions Screening Program (Doc 6):
   Automated screening across OFAC, EU, UN, UK HMT. Daily updates
   from authoritative sources. Score: 4/5 - Strong program with
   minor alert fatigue issues noted."
   ```

---

## Current Status Summary

### ✅ FIXED - Scoring Algorithm
1. Added controlEffectiveness field to Risk model
2. Database migration completed successfully
3. Balanced risk severity calculations (no more CATASTROPHIC/CERTAIN overkill)
4. Risk scoring formula working correctly
5. Comprehensive documentation created

### ❌ BROKEN - AI Document Analysis
1. 72% of answers scoring 0/5 (should be ~10%)
2. Average score 23.4% (should be ~66%)
3. Control effectiveness 5% (should be 60-70%)
4. Overall score 35/100 (should be 65/100)
5. 66 risks generated (should be 10-15)

### 🔍 NEXT STEPS - Debug Session
1. Run diagnostic scripts (document parsing, AI config, answer generation)
2. Test hypothesis about where AI analysis is failing
3. Fix the broken component (likely AI service configuration or prompts)
4. Re-test with NovaPay documents
5. Verify score improves to expected 65/100

---

## Files to Investigate

### Primary Suspects:
1. `/backend/src/services/ai-analysis.service.ts` - AI answer generation
2. `/backend/src/services/answer.service.ts` - Answer orchestration
3. `/backend/src/services/document-parser.service.ts` - Document parsing
4. `/backend/src/lib/ai/mock.ts` - Check if using mock data

### Supporting Files:
5. `/backend/src/services/assessment.service.ts` - Assessment completion logic
6. `/backend/src/lib/ai/index.ts` - AI module configuration
7. `/backend/prisma/schema.prisma` - Document model definition

---

## Timeline of Today's Session

**15:00-16:00**: Discovered control effectiveness bug
- Added controlEffectiveness field to Risk model
- Created database migration
- Updated risk creation code

**16:00-16:30**: Discovered Bug #7 side effect
- Score went from 5% → 2% with control effectiveness
- Found CERTAIN/CATASTROPHIC/CRITICAL was too aggressive
- Fixed risk severity calculations

**16:30-17:00**: Score improved but still wrong
- Score went from 2% → 35% (better but still low)
- Created diagnostic scripts
- Compared against NovaPay expected results

**17:00-17:30**: Root cause identified
- Scoring algorithm is CORRECT ✅
- AI document analysis is BROKEN ❌
- 72% of answers finding no evidence when evidence clearly exists
- Need to debug AI service next

---

## Expected Behavior When Fixed

**Sample Good Answer (Score: 4/5)**:
```json
{
  "score": 4,
  "explanation": "Strong sanctions screening program identified. Evidence from Document 6 (Sanctions Screening Program): Automated screening across OFAC, EU, UN, UK HMT lists with daily updates. Real-time screening for new customers and weekly batch screening for existing customers. Comprehensive alert management with defined SLAs. Minor gap: some alert fatigue noted, but overall robust program.",
  "sourceReference": "NovaPay - Document 06 - Sanctions Screening Program.pdf, pages 1-3",
  "evidenceTier": "TIER_1",
  "confidence": 0.95
}
```

**Sample Weak Answer (Score: 2/5)**:
```json
{
  "score": 2,
  "explanation": "Limited evidence of AI governance. Document 12 mentions AI/ML use in transaction monitoring but lacks formal governance framework. No AI inventory maintained, no bias testing procedures, EU AI Act compliance gap identified. Requires significant improvement.",
  "sourceReference": "NovaPay - Document 12 - AI & Machine Learning Governance.pdf, page 1",
  "evidenceTier": "TIER_2",
  "confidence": 0.85
}
```

**Sample No Evidence Answer (Score: 0/5)**:
```json
{
  "score": 0,
  "explanation": "No evidence found in provided documents regarding cryptocurrency due diligence procedures. Documents focus on traditional payment services. If cryptocurrency services are offered, additional documentation required.",
  "sourceReference": null,
  "evidenceTier": "TIER_0",
  "confidence": 0.9
}
```

---

## Conclusion

We've made excellent progress on the scoring algorithm today. The control effectiveness implementation is solid and the risk severity calculations are now balanced. However, we've uncovered a more fundamental issue: **our AI isn't successfully extracting compliance evidence from documents**.

**The good news**: When we fix the AI analysis, the scoring algorithm will correctly reward strong controls. Our formula is now:
```
Strong evidence (4/5) → Good controls (80%) → Higher score (65/100) ✓
Weak evidence (1/5) → Poor controls (20%) → Lower score (35/100) ✓
```

**Next session priorities**:
1. Run diagnostic scripts to pinpoint AI failure
2. Fix AI document analysis (likely prompt or configuration issue)
3. Re-test with NovaPay documents
4. Verify 65/100 score achievement

**Status**: Ready for next debugging session 🔧
