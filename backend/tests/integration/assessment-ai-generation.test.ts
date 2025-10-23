import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '../../src/generated/prisma';
import { assessmentService } from '../../src/services/assessment.service';

describe('AssessmentService AI Generation Integration', () => {
  let prisma: PrismaClient;
  let testAssessmentId: string;
  let testUserId: string;
  let testOrgId: string;
  let testTemplateId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Create test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test-ai-gen@example.com' },
      update: {},
      create: {
        email: 'test-ai-gen@example.com',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User'
      }
    });
    testUserId = testUser.id;

    // Create test organization
    const testOrg = await prisma.organization.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        name: 'Test AI Generation Org',
        size: 'MIDMARKET',
        industry: 'Financial Services',
        country: 'USA',
        geography: 'US',
        riskProfile: 'MEDIUM'
      }
    });
    testOrgId = testOrg.id;

    // Get a template (should exist from seed data)
    const template = await prisma.template.findFirst();
    if (template) {
      testTemplateId = template.id;
    } else {
      // Skip tests if no template exists
      console.warn('No template found - skipping tests');
      return;
    }

    // Create test assessment with gaps and risks
    const assessment = await prisma.assessment.create({
      data: {
        organizationId: testOrgId,
        userId: testUserId,
        templateId: testTemplateId,
        status: 'COMPLETED',
        riskScore: 75,
        gaps: {
          create: [
            {
              category: 'KYC_AML',
              title: 'Missing KYC procedures',
              description: 'No formal KYC procedures in place',
              severity: 'CRITICAL',
              priority: 'IMMEDIATE'
            },
            {
              category: 'KYC_AML',
              title: 'Incomplete customer verification',
              description: 'Customer verification process is incomplete',
              severity: 'HIGH',
              priority: 'SHORT_TERM'
            },
            {
              category: 'DATA_PROTECTION',
              title: 'Inadequate data encryption',
              description: 'Data encryption is not sufficient',
              severity: 'HIGH',
              priority: 'SHORT_TERM'
            }
          ]
        },
        risks: {
          create: [
            {
              category: 'REGULATORY',
              title: 'Regulatory fines',
              description: 'Risk of regulatory fines',
              likelihood: 'LIKELY',
              impact: 'CATASTROPHIC',
              riskLevel: 'CRITICAL',
              mitigationStrategy: 'Implement controls'
            }
          ]
        }
      }
    });
    testAssessmentId = assessment.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testAssessmentId) {
      await prisma.assessment.delete({ where: { id: testAssessmentId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('should generate AI content on first call', async () => {
    const result = await assessmentService.generateAndStoreAIAnalysis(testAssessmentId);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.riskAnalysis).toBeDefined();
    expect(result.data.strategyMatrix).toBeInstanceOf(Array);
    expect(result.data.generatedAt).toBeDefined();

    // Check risk analysis structure
    const riskAnalysis = result.data.riskAnalysis;
    expect(riskAnalysis.KYC_AML).toBeDefined();
    expect(riskAnalysis.KYC_AML.score).toBeGreaterThan(0);
    expect(riskAnalysis.KYC_AML.totalGaps).toBe(2);
    expect(riskAnalysis.KYC_AML.criticalGaps).toBe(1);
    expect(riskAnalysis.KYC_AML.keyFindings).toBeInstanceOf(Array);
    expect(riskAnalysis.KYC_AML.mitigationStrategies).toBeInstanceOf(Array);

    // Check strategy matrix
    expect(result.data.strategyMatrix.length).toBeGreaterThan(0);
    const firstStrategy = result.data.strategyMatrix[0];
    expect(firstStrategy.priority).toBeDefined();
    expect(firstStrategy.riskArea).toBeDefined();
    expect(firstStrategy.adjustedRisk).toBeDefined();
    expect(firstStrategy.primaryMitigation).toBeDefined();
    expect(firstStrategy.timeline).toBeDefined();
    expect(firstStrategy.budget).toBeDefined();
    expect(firstStrategy.businessOwner).toBeDefined();

    // Verify stored in database
    const assessment = await prisma.assessment.findUnique({
      where: { id: testAssessmentId }
    });
    expect(assessment?.aiRiskAnalysis).toBeDefined();
    expect(assessment?.aiStrategyMatrix).toBeDefined();
    expect(assessment?.aiGeneratedAt).toBeInstanceOf(Date);
  }, 30000); // Longer timeout for AI generation

  it('should return existing content on second call (idempotent)', async () => {
    const firstCall = await assessmentService.generateAndStoreAIAnalysis(testAssessmentId);
    const secondCall = await assessmentService.generateAndStoreAIAnalysis(testAssessmentId);

    expect(firstCall.success).toBe(true);
    expect(secondCall.success).toBe(true);

    // Should return same generatedAt timestamp (not regenerated)
    expect(secondCall.data.generatedAt).toEqual(firstCall.data.generatedAt);

    // Content should be identical
    expect(JSON.stringify(secondCall.data.riskAnalysis)).toEqual(
      JSON.stringify(firstCall.data.riskAnalysis)
    );
    expect(JSON.stringify(secondCall.data.strategyMatrix)).toEqual(
      JSON.stringify(firstCall.data.strategyMatrix)
    );
  });

  it('should handle non-existent assessment', async () => {
    const result = await assessmentService.generateAndStoreAIAnalysis('invalid-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Assessment not found');
  });

  it('should handle assessment with no gaps', async () => {
    // Create assessment without gaps
    const emptyAssessment = await prisma.assessment.create({
      data: {
        organizationId: testOrgId,
        userId: testUserId,
        templateId: testTemplateId,
        status: 'COMPLETED'
      }
    });

    const result = await assessmentService.generateAndStoreAIAnalysis(emptyAssessment.id);

    expect(result.success).toBe(false);
    expect(result.error).toContain('No gaps');

    // Clean up
    await prisma.assessment.delete({ where: { id: emptyAssessment.id } });
  });

  it('should support force regeneration', async () => {
    // First generation
    const firstResult = await assessmentService.generateAndStoreAIAnalysis(testAssessmentId);
    const firstGeneratedAt = firstResult.data.generatedAt;

    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 100));

    // Force regenerate
    const regenerateResult = await assessmentService.generateAndStoreAIAnalysis(
      testAssessmentId,
      undefined,
      { forceRegenerate: true }
    );

    expect(regenerateResult.success).toBe(true);
    expect(regenerateResult.data.generatedAt).not.toEqual(firstGeneratedAt);

    // Verify database was updated
    const assessment = await prisma.assessment.findUnique({
      where: { id: testAssessmentId }
    });
    expect(assessment?.aiGeneratedAt).not.toEqual(firstGeneratedAt);
  }, 30000);

  it('should calculate risk scores correctly', async () => {
    const result = await assessmentService.generateAndStoreAIAnalysis(testAssessmentId);

    expect(result.success).toBe(true);

    const kycAnalysis = result.data.riskAnalysis.KYC_AML;

    // KYC_AML has 1 CRITICAL + 1 HIGH = weighted score should be high
    expect(kycAnalysis.score).toBeGreaterThanOrEqual(7.5);
    expect(kycAnalysis.score).toBeLessThanOrEqual(10);
  });

  it('should include proper business owners in strategy matrix', async () => {
    const result = await assessmentService.generateAndStoreAIAnalysis(testAssessmentId);

    expect(result.success).toBe(true);

    const kycStrategy = result.data.strategyMatrix.find(
      (s: any) => s.riskArea.includes('KYC') || s.riskArea.includes('AML')
    );

    if (kycStrategy) {
      expect(kycStrategy.businessOwner).toBe('Chief Compliance Officer');
    }
  });

  it('should handle multiple categories', async () => {
    const result = await assessmentService.generateAndStoreAIAnalysis(testAssessmentId);

    expect(result.success).toBe(true);

    // Should have analysis for both KYC_AML and DATA_PROTECTION
    expect(result.data.riskAnalysis.KYC_AML).toBeDefined();
    expect(result.data.riskAnalysis.DATA_PROTECTION).toBeDefined();

    // Each category should have findings and strategies
    expect(result.data.riskAnalysis.KYC_AML.keyFindings.length).toBeGreaterThan(0);
    expect(result.data.riskAnalysis.KYC_AML.mitigationStrategies.length).toBe(4);
    expect(result.data.riskAnalysis.DATA_PROTECTION.keyFindings.length).toBeGreaterThan(0);
    expect(result.data.riskAnalysis.DATA_PROTECTION.mitigationStrategies.length).toBe(4);
  }, 30000);
});