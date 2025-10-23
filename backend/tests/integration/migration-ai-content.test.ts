import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '../../src/generated/prisma';

describe('AI Content Migration', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should add AI content fields to Assessment', async () => {
    // Find or create a test user and organization
    const testUser = await prisma.user.upsert({
      where: { email: 'test-ai-migration@example.com' },
      update: {},
      create: {
        email: 'test-ai-migration@example.com',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User'
      }
    });

    const testOrg = await prisma.organization.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        name: 'Test Organization',
        size: 'STARTUP',
        industry: 'Technology',
        country: 'USA'
      }
    });

    // Find a template
    const template = await prisma.template.findFirst();

    if (!template) {
      console.warn('No template found, skipping assessment creation test');
      return;
    }

    // Create assessment with AI fields
    const assessment = await prisma.assessment.create({
      data: {
        organizationId: testOrg.id,
        userId: testUser.id,
        templateId: template.id,
        aiRiskAnalysis: { test: 'data' },
        aiStrategyMatrix: [{ priority: 1 }],
        aiGeneratedAt: new Date()
      }
    });

    expect(assessment.aiRiskAnalysis).toBeDefined();
    expect(assessment.aiStrategyMatrix).toBeDefined();
    expect(assessment.aiGeneratedAt).toBeDefined();

    // Clean up
    await prisma.assessment.delete({ where: { id: assessment.id } });
  });

  it('should handle null AI fields for existing assessments', async () => {
    const existing = await prisma.assessment.findFirst();

    if (!existing) {
      console.warn('No existing assessment found, skipping null check');
      return;
    }

    // AI fields should be nullable
    expect(existing.aiRiskAnalysis === null || existing.aiRiskAnalysis !== undefined).toBeTruthy();
    expect(existing.aiStrategyMatrix === null || existing.aiStrategyMatrix !== undefined).toBeTruthy();
    expect(existing.aiGeneratedAt === null || existing.aiGeneratedAt !== undefined).toBeTruthy();
  });

  it('should store large JSON data in AI fields', async () => {
    const testUser = await prisma.user.findFirst();
    const testOrg = await prisma.organization.findFirst();
    const template = await prisma.template.findFirst();

    if (!testUser || !testOrg || !template) {
      console.warn('Missing test data, skipping large JSON test');
      return;
    }

    // Create large test data (simulate real AI response)
    const largeRiskAnalysis = {};
    const categories = ['KYC_AML', 'DATA_PROTECTION', 'REGULATORY_REPORTING', 'GOVERNANCE'];

    for (const category of categories) {
      largeRiskAnalysis[category] = {
        score: Math.random() * 10,
        totalGaps: Math.floor(Math.random() * 20),
        criticalGaps: Math.floor(Math.random() * 5),
        keyFindings: Array(5).fill(null).map((_, i) => ({
          finding: `Finding ${i + 1} for ${category}`,
          severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 4)],
          description: 'A'.repeat(500) // 500 chars per finding
        })),
        mitigationStrategies: Array(4).fill(null).map((_, i) => ({
          strategy: `Strategy ${i + 1} for ${category}`,
          priority: ['immediate', 'short-term', 'medium-term', 'long-term'][i],
          impact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
          rationale: 'B'.repeat(300)
        }))
      };
    }

    const largeStrategyMatrix = Array(20).fill(null).map((_, i) => ({
      priority: i + 1,
      riskArea: categories[i % categories.length],
      adjustedRisk: ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)],
      urgency: 'IMMEDIATE',
      impact: Math.random() * 10,
      primaryMitigation: 'C'.repeat(200),
      timeline: '1-3 months',
      budget: `$${Math.floor(Math.random() * 100000)}`,
      businessOwner: 'Test Owner',
      gapCount: Math.floor(Math.random() * 10),
      criticalGaps: Math.floor(Math.random() * 3)
    }));

    const assessment = await prisma.assessment.create({
      data: {
        organizationId: testOrg.id,
        userId: testUser.id,
        templateId: template.id,
        aiRiskAnalysis: largeRiskAnalysis,
        aiStrategyMatrix: largeStrategyMatrix,
        aiGeneratedAt: new Date()
      }
    });

    expect(assessment.aiRiskAnalysis).toBeDefined();
    expect(Object.keys(assessment.aiRiskAnalysis as any).length).toBe(categories.length);
    expect(assessment.aiStrategyMatrix).toBeDefined();
    expect((assessment.aiStrategyMatrix as any[]).length).toBe(20);

    // Clean up
    await prisma.assessment.delete({ where: { id: assessment.id } });
  });

  it('should not affect existing assessment CRUD operations', async () => {
    const testUser = await prisma.user.findFirst();
    const testOrg = await prisma.organization.findFirst();
    const template = await prisma.template.findFirst();

    if (!testUser || !testOrg || !template) {
      console.warn('Missing test data, skipping CRUD test');
      return;
    }

    // Create assessment without AI fields (backward compatibility)
    const assessment = await prisma.assessment.create({
      data: {
        organizationId: testOrg.id,
        userId: testUser.id,
        templateId: template.id,
        status: 'DRAFT'
      }
    });

    expect(assessment.id).toBeDefined();
    expect(assessment.aiRiskAnalysis).toBeNull();
    expect(assessment.aiStrategyMatrix).toBeNull();
    expect(assessment.aiGeneratedAt).toBeNull();

    // Update assessment (without touching AI fields)
    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        status: 'IN_PROGRESS',
        riskScore: 75
      }
    });

    expect(updated.status).toBe('IN_PROGRESS');
    expect(updated.riskScore).toBe(75);
    expect(updated.aiRiskAnalysis).toBeNull();

    // Read assessment
    const read = await prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: {
        gaps: true,
        risks: true
      }
    });

    expect(read).toBeDefined();
    expect(read?.id).toBe(assessment.id);

    // Delete assessment
    await prisma.assessment.delete({
      where: { id: assessment.id }
    });

    const deleted = await prisma.assessment.findUnique({
      where: { id: assessment.id }
    });

    expect(deleted).toBeNull();
  });
});