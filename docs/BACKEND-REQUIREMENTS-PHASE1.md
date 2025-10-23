# Backend Requirements for Phase 1 Implementation

**Document:** Backend endpoint requirements and priorities for Phase 1
**Audience:** Backend Development Team
**Priority:** URGENT - Required to unblock Phase 1 frontend development
**Date:** October 9, 2025

---

## 🚨 Executive Summary

Phase 1 frontend implementation requires **1 NEW critical backend endpoint** to be created. This endpoint is a **blocker** for Week 3 of Phase 1.

### Status Overview

| Endpoint | Status | Required By | Priority |
|----------|--------|-------------|----------|
| `GET /api/templates` | ✅ EXISTS | Phase 1 Week 1 | P0 |
| `GET /api/templates/:id` | ✅ EXISTS | Phase 1 Week 1 | P0 |
| `GET /api/assessments/:id/answers` | ✅ EXISTS | Phase 1 Week 1 | P0 |
| `POST /api/assessments/:id/answers` | ✅ EXISTS | Phase 1 Week 1 | P0 |
| `POST /api/assessments/:id/complete` | ✅ EXISTS | Phase 1 Week 2 | P0 |
| **`GET /api/assessments/:id/enhanced-results`** | **⚠️ MUST CREATE** | **Phase 1 Week 3** | **P0** |

---

## 🔥 Critical: New Endpoint Required

### GET /api/assessments/:id/enhanced-results

**Status:** ⚠️ DOES NOT EXIST - MUST BE CREATED
**Priority:** P0 (Critical Blocker)
**Required By:** End of Phase 1 Week 2 (October 23, 2025)
**Estimated Effort:** 1-2 days
**Story Reference:** Story 1.15 - Enhanced Results Dashboard
**Frontend Usage:** Step 7 (Results Overview)

---

## 📋 Endpoint Specification

### Request

```http
GET /api/assessments/:assessmentId/enhanced-results
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Parameters:**
- `assessmentId` (string, required): UUID of the completed assessment

**Authentication:**
- Requires valid JWT token
- User must own the assessment or be an admin
- Assessment must have status `COMPLETED`

---

### Response Schema

```typescript
interface EnhancedResultsResponse {
  assessmentId: string;
  overallScore: number; // 0-100, calculated using evidence-weighted methodology
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH'; // Based on evidence tier distribution
  totalAnswers: number; // Total number of questions answered

  evidenceDistribution: {
    tier0Count: number; // Number of TIER_0 (self-declared) answers
    tier1Count: number; // Number of TIER_1 (claimed with evidence) answers
    tier2Count: number; // Number of TIER_2 (pre-filled from docs) answers
    tier0Percentage: number; // 0-100, percentage of answers that are TIER_0
    tier1Percentage: number; // 0-100, percentage of answers that are TIER_1
    tier2Percentage: number; // 0-100, percentage of answers that are TIER_2
  };

  sectionBreakdown: Array<{
    sectionId: string;
    sectionName: string;
    score: number; // 0-100, section score
    weight: number; // Section weight percentage (0-100)
    weightedContribution: number; // How much this section contributed to overall score
    evidenceCounts: {
      tier0: number; // Number of TIER_0 answers in this section
      tier1: number; // Number of TIER_1 answers in this section
      tier2: number; // Number of TIER_2 answers in this section
    };
  }>;

  methodology: {
    scoringApproach: string; // Description of evidence-weighted scoring
    weightingExplanation: string; // How questions and sections are weighted
    evidenceImpact: string; // How evidence tiers affect scores
  };

  hasPriorities: boolean; // Whether user completed priorities questionnaire
}
```

---

### Response Example

```json
{
  "assessmentId": "550e8400-e29b-41d4-a716-446655440000",
  "overallScore": 67,
  "confidenceLevel": "MEDIUM",
  "totalAnswers": 42,

  "evidenceDistribution": {
    "tier0Count": 8,
    "tier1Count": 12,
    "tier2Count": 22,
    "tier0Percentage": 19,
    "tier1Percentage": 29,
    "tier2Percentage": 52
  },

  "sectionBreakdown": [
    {
      "sectionId": "section-1",
      "sectionName": "Customer Due Diligence",
      "score": 72,
      "weight": 22,
      "weightedContribution": 15.84,
      "evidenceCounts": {
        "tier0": 2,
        "tier1": 4,
        "tier2": 6
      }
    },
    {
      "sectionId": "section-2",
      "sectionName": "Transaction Monitoring",
      "score": 58,
      "weight": 18,
      "weightedContribution": 10.44,
      "evidenceCounts": {
        "tier0": 3,
        "tier1": 3,
        "tier2": 2
      }
    },
    {
      "sectionId": "section-3",
      "sectionName": "Sanctions Screening",
      "score": 81,
      "weight": 25,
      "weightedContribution": 20.25,
      "evidenceCounts": {
        "tier0": 1,
        "tier1": 2,
        "tier2": 7
      }
    }
  ],

  "methodology": {
    "scoringApproach": "Evidence-weighted scoring applies multipliers (0.6, 0.8, 1.0) to answer points based on evidence quality.",
    "weightingExplanation": "Questions are weighted within sections (foundational questions have higher weight), and sections are weighted based on compliance importance.",
    "evidenceImpact": "Higher evidence tiers (TIER_2 > TIER_1 > TIER_0) result in higher scores. Providing documentation significantly improves your assessment score."
  },

  "hasPriorities": false
}
```

---

## 🧮 Calculation Algorithm

### Step-by-Step Scoring Logic

```typescript
/**
 * Calculate enhanced assessment results with evidence-weighted scoring
 */
async function calculateEnhancedResults(assessmentId: string): Promise<EnhancedResultsResponse> {

  // 1. Fetch assessment with all answers and evidence tiers
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      answers: {
        include: {
          question: {
            include: {
              section: true,
              options: true
            }
          }
        }
      },
      template: {
        include: {
          sections: {
            include: {
              questions: {
                include: {
                  options: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!assessment || assessment.status !== 'COMPLETED') {
    throw new Error('Assessment not found or not completed');
  }

  // 2. Calculate evidence distribution
  const evidenceDistribution = calculateEvidenceDistribution(assessment.answers);

  // 3. Calculate section scores
  const sectionBreakdown = assessment.template.sections.map(section => {
    return calculateSectionScore(section, assessment.answers);
  });

  // 4. Calculate overall score (weighted sum of section scores)
  const overallScore = sectionBreakdown.reduce((sum, section) => {
    return sum + (section.score * section.weight / 100);
  }, 0);

  // 5. Determine confidence level based on evidence distribution
  const confidenceLevel = determineConfidenceLevel(evidenceDistribution);

  // 6. Check if priorities questionnaire completed
  const hasPriorities = await prisma.priorities.findUnique({
    where: { assessmentId }
  }) !== null;

  return {
    assessmentId: assessment.id,
    overallScore: Math.round(overallScore),
    confidenceLevel,
    totalAnswers: assessment.answers.length,
    evidenceDistribution,
    sectionBreakdown,
    methodology: getMethodologyText(),
    hasPriorities
  };
}

/**
 * Calculate evidence tier distribution
 */
function calculateEvidenceDistribution(answers: Answer[]) {
  const tier0Count = answers.filter(a => a.evidenceTier === 'TIER_0').length;
  const tier1Count = answers.filter(a => a.evidenceTier === 'TIER_1').length;
  const tier2Count = answers.filter(a => a.evidenceTier === 'TIER_2').length;
  const total = answers.length;

  return {
    tier0Count,
    tier1Count,
    tier2Count,
    tier0Percentage: Math.round((tier0Count / total) * 100),
    tier1Percentage: Math.round((tier1Count / total) * 100),
    tier2Percentage: Math.round((tier2Count / total) * 100)
  };
}

/**
 * Calculate score for a single section
 */
function calculateSectionScore(section: Section, answers: Answer[]) {
  const sectionAnswers = answers.filter(a => a.question.sectionId === section.id);

  let totalWeightedScore = 0;
  let totalWeight = 0;

  const evidenceCounts = { tier0: 0, tier1: 0, tier2: 0 };

  sectionAnswers.forEach(answer => {
    const question = answer.question;
    const selectedOption = question.options.find(o => o.id === answer.selectedOptionId);

    if (!selectedOption) return;

    // Get answer points
    const answerPoints = selectedOption.points; // 0-10

    // Apply evidence tier multiplier
    const evidenceMultiplier = getEvidenceMultiplier(answer.evidenceTier);

    // Apply question weight
    const questionWeight = question.weight; // 0.6-1.0 for foundational/standard

    // Calculate weighted question score (0-100 scale)
    const questionScore = (answerPoints * evidenceMultiplier * 10); // Scale to 0-100
    const weightedQuestionScore = questionScore * questionWeight;

    totalWeightedScore += weightedQuestionScore;
    totalWeight += questionWeight;

    // Count evidence tiers
    if (answer.evidenceTier === 'TIER_0') evidenceCounts.tier0++;
    else if (answer.evidenceTier === 'TIER_1') evidenceCounts.tier1++;
    else if (answer.evidenceTier === 'TIER_2') evidenceCounts.tier2++;
  });

  // Calculate section score (0-100)
  const sectionScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  return {
    sectionId: section.id,
    sectionName: section.title,
    score: Math.round(sectionScore),
    weight: section.weight, // Percentage (0-100)
    weightedContribution: Math.round((sectionScore * section.weight) / 100 * 100) / 100,
    evidenceCounts
  };
}

/**
 * Get evidence tier multiplier
 */
function getEvidenceMultiplier(evidenceTier: EvidenceTier | null): number {
  switch (evidenceTier) {
    case 'TIER_0': return 0.6;
    case 'TIER_1': return 0.8;
    case 'TIER_2': return 1.0;
    default: return 0.6; // Default to TIER_0 if null
  }
}

/**
 * Determine confidence level based on evidence distribution
 */
function determineConfidenceLevel(distribution: EvidenceDistribution): ConfidenceLevel {
  const { tier2Percentage } = distribution;

  if (tier2Percentage >= 60) return 'HIGH';
  if (tier2Percentage >= 30) return 'MEDIUM';
  return 'LOW';
}

/**
 * Get methodology text for transparency
 */
function getMethodologyText() {
  return {
    scoringApproach: 'Evidence-weighted scoring applies multipliers (0.6, 0.8, 1.0) to answer points based on evidence quality.',
    weightingExplanation: 'Questions are weighted within sections (foundational questions have higher weight), and sections are weighted based on compliance importance.',
    evidenceImpact: 'Higher evidence tiers (TIER_2 > TIER_1 > TIER_0) result in higher scores. Providing documentation significantly improves your assessment score.'
  };
}
```

---

## 🗄️ Database Schema Requirements

### Existing Schema (No Changes Needed)

The endpoint uses existing database tables:

**Assessment Table:**
- `id` (UUID)
- `status` (enum: COMPLETED required)
- `templateId` (FK to Template)

**Answer Table:**
- `id` (UUID)
- `assessmentId` (FK to Assessment)
- `questionId` (FK to Question)
- `selectedOptionId` (FK to QuestionOption)
- `evidenceTier` (enum: TIER_0, TIER_1, TIER_2)
- `notes` (text, optional)

**Template/Section/Question Tables:**
- Existing structure with `weight` fields

**Priorities Table:**
- `assessmentId` (FK to Assessment, unique)
- Used to check `hasPriorities` field

---

## 🧪 Testing Requirements

### Unit Tests

```typescript
describe('GET /assessments/:id/enhanced-results', () => {
  it('returns 401 when not authenticated', async () => {
    const response = await request(app)
      .get('/api/assessments/test-id/enhanced-results')
      .expect(401);
  });

  it('returns 404 when assessment not found', async () => {
    const response = await request(app)
      .get('/api/assessments/invalid-id/enhanced-results')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('returns 400 when assessment not completed', async () => {
    const response = await request(app)
      .get(`/api/assessments/${incompleteAssessmentId}/enhanced-results`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('calculates overall score correctly', async () => {
    const response = await request(app)
      .get(`/api/assessments/${completedAssessmentId}/enhanced-results`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.overallScore).toBeGreaterThanOrEqual(0);
    expect(response.body.overallScore).toBeLessThanOrEqual(100);
  });

  it('calculates evidence distribution correctly', async () => {
    const response = await request(app)
      .get(`/api/assessments/${completedAssessmentId}/enhanced-results`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const { evidenceDistribution } = response.body;
    const totalCount = evidenceDistribution.tier0Count +
                       evidenceDistribution.tier1Count +
                       evidenceDistribution.tier2Count;

    expect(totalCount).toBe(response.body.totalAnswers);

    const totalPercentage = evidenceDistribution.tier0Percentage +
                           evidenceDistribution.tier1Percentage +
                           evidenceDistribution.tier2Percentage;

    expect(totalPercentage).toBeCloseTo(100, 1);
  });

  it('applies evidence tier multipliers correctly', async () => {
    // Create assessment with known answers
    const tier0Score = calculateExpectedScore(tier0Answers);
    const tier2Score = calculateExpectedScore(tier2Answers);

    // TIER_2 score should be higher than TIER_0 for same answers
    expect(tier2Score).toBeGreaterThan(tier0Score);
  });

  it('determines confidence level correctly', async () => {
    // Test HIGH confidence (>60% TIER_2)
    const highConfidenceResult = await calculateResults(highTier2Assessment);
    expect(highConfidenceResult.confidenceLevel).toBe('HIGH');

    // Test MEDIUM confidence (30-60% TIER_2)
    const mediumConfidenceResult = await calculateResults(mediumTier2Assessment);
    expect(mediumConfidenceResult.confidenceLevel).toBe('MEDIUM');

    // Test LOW confidence (<30% TIER_2)
    const lowConfidenceResult = await calculateResults(lowTier2Assessment);
    expect(lowConfidenceResult.confidenceLevel).toBe('LOW');
  });

  it('includes correct section breakdown', async () => {
    const response = await request(app)
      .get(`/api/assessments/${completedAssessmentId}/enhanced-results`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const { sectionBreakdown } = response.body;

    // Should have all template sections
    expect(sectionBreakdown).toHaveLength(3);

    // Each section should have required fields
    sectionBreakdown.forEach(section => {
      expect(section).toHaveProperty('sectionId');
      expect(section).toHaveProperty('sectionName');
      expect(section).toHaveProperty('score');
      expect(section).toHaveProperty('weight');
      expect(section).toHaveProperty('weightedContribution');
      expect(section).toHaveProperty('evidenceCounts');

      expect(section.score).toBeGreaterThanOrEqual(0);
      expect(section.score).toBeLessThanOrEqual(100);
    });

    // Weighted contributions should sum to overall score
    const sumWeightedContributions = sectionBreakdown.reduce(
      (sum, s) => sum + s.weightedContribution,
      0
    );
    expect(sumWeightedContributions).toBeCloseTo(response.body.overallScore, 1);
  });

  it('checks priorities questionnaire correctly', async () => {
    // Assessment without priorities
    const noPrioritiesResponse = await request(app)
      .get(`/api/assessments/${assessmentWithoutPriorities}/enhanced-results`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(noPrioritiesResponse.body.hasPriorities).toBe(false);

    // Assessment with priorities
    const withPrioritiesResponse = await request(app)
      .get(`/api/assessments/${assessmentWithPriorities}/enhanced-results`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(withPrioritiesResponse.body.hasPriorities).toBe(true);
  });
});
```

---

## ⚡ Performance Requirements

### Response Time Targets

| Scenario | Target | Maximum |
|----------|--------|---------|
| Small assessment (20 questions) | <200ms | <500ms |
| Medium assessment (50 questions) | <400ms | <1s |
| Large assessment (100+ questions) | <800ms | <2s |

### Optimization Strategies

1. **Database Query Optimization**
   ```typescript
   // Use single query with all includes instead of N+1 queries
   const assessment = await prisma.assessment.findUnique({
     where: { id: assessmentId },
     include: {
       answers: {
         include: {
           question: {
             include: { section: true, options: true }
           }
         }
       },
       template: {
         include: {
           sections: {
             include: {
               questions: {
                 include: { options: true }
               }
             }
           }
         }
       }
     }
   });
   ```

2. **Caching (Optional but Recommended)**
   ```typescript
   // Cache results for 5 minutes (assessment is immutable after completion)
   const cacheKey = `enhanced-results:${assessmentId}`;
   const cached = await redis.get(cacheKey);

   if (cached) {
     return JSON.parse(cached);
   }

   const results = await calculateEnhancedResults(assessmentId);
   await redis.setex(cacheKey, 300, JSON.stringify(results)); // 5 min TTL

   return results;
   ```

3. **Parallel Calculations**
   ```typescript
   // Calculate sections in parallel
   const sectionBreakdown = await Promise.all(
     assessment.template.sections.map(section =>
       calculateSectionScore(section, assessment.answers)
     )
   );
   ```

---

## 🔒 Security Requirements

### Authentication & Authorization

```typescript
// Middleware to check assessment ownership
async function checkAssessmentAccess(req, res, next) {
  const { assessmentId } = req.params;
  const userId = req.user.id;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { userId: true, organizationId: true }
  });

  if (!assessment) {
    return res.status(404).json({ error: 'Assessment not found' });
  }

  // Allow if user owns assessment or is admin
  const hasAccess =
    assessment.userId === userId ||
    req.user.role === 'ADMIN';

  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
}

// Route with middleware
fastify.get(
  '/assessments/:assessmentId/enhanced-results',
  { preHandler: [authenticateJWT, checkAssessmentAccess] },
  async (req, reply) => {
    // Handler implementation
  }
);
```

### Data Validation

```typescript
// Request validation schema (Zod)
const enhancedResultsSchema = z.object({
  params: z.object({
    assessmentId: z.string().uuid('Invalid assessment ID format')
  })
});
```

---

## 📊 Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Assessment not completed. Cannot calculate results for incomplete assessments."
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You do not have permission to access this assessment"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Assessment not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Failed to calculate assessment results"
}
```

---

## 📝 Implementation Checklist

### Week 1-2 Tasks (Required by October 23)

- [ ] Create endpoint route handler in `backend/src/routes/assessment.routes.ts`
- [ ] Implement calculation logic in `backend/src/services/assessment.service.ts`
- [ ] Add evidence tier multiplier logic (`getEvidenceMultiplier`)
- [ ] Add section score calculation (`calculateSectionScore`)
- [ ] Add overall score calculation (weighted sum of sections)
- [ ] Add confidence level determination (`determineConfidenceLevel`)
- [ ] Add evidence distribution calculation (`calculateEvidenceDistribution`)
- [ ] Add priorities check (`hasPriorities` field)
- [ ] Implement authentication middleware
- [ ] Implement authorization (ownership check)
- [ ] Add request validation (Zod schema)
- [ ] Add error handling for all edge cases
- [ ] Write unit tests (>85% coverage)
- [ ] Write integration tests (API contract)
- [ ] Test with real assessment data
- [ ] Add OpenAPI/Swagger documentation
- [ ] Performance test with 100+ question assessments
- [ ] Optional: Add Redis caching for results
- [ ] Code review and merge
- [ ] Deploy to staging environment
- [ ] Notify frontend team endpoint is ready

---

## 🤝 Coordination with Frontend

### Communication Plan

1. **Week 1 (Oct 9-15):** Backend team starts endpoint development
2. **Week 2 (Oct 16-22):**
   - Backend completes endpoint
   - Frontend builds UI with mock data
   - Backend provides OpenAPI spec for frontend integration
3. **Week 3 (Oct 23-29):**
   - Backend endpoint deployed to staging
   - Frontend swaps mock for real endpoint
   - Joint testing of integration

### Testing Coordination

**Backend provides:**
- OpenAPI/Swagger spec for endpoint
- Sample request/response examples
- Staging environment URL
- Test assessment IDs for frontend testing

**Frontend provides:**
- UI flow testing feedback
- Edge case scenarios discovered in testing
- Performance feedback (if response times too slow)

---

## 📞 Questions or Issues?

**Backend Team Contacts:**
- Lead: [Backend Lead Name]
- Email: backend-team@heliolus.com
- Slack: #backend-dev

**Frontend Team Contacts:**
- Lead: James (Dev Agent)
- UX: Sally (UX Expert)
- Slack: #frontend-dev

**Cross-Team Sync:**
- Daily standups: 9:30 AM
- Backend/Frontend sync: Monday/Thursday 2 PM

---

## ✅ Definition of Done

Endpoint is complete when:

- [x] Route handler implemented
- [x] Calculation logic tested and accurate
- [x] Authentication/authorization working
- [x] Error handling for all cases
- [x] Unit tests passing (>85% coverage)
- [x] Integration tests passing
- [x] OpenAPI documentation added
- [x] Performance targets met (<1s for medium assessments)
- [x] Code reviewed and approved
- [x] Deployed to staging
- [x] Frontend team notified and integrated successfully

---

**URGENT: Start implementation in Week 1 (Oct 9-15) to avoid blocking Phase 1 Week 3.** ⚠️

*Backend Requirements Document v1.0 - Created October 9, 2025*
