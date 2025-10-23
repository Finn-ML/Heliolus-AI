/**
 * Integration Tests for Weighted Scoring Service
 * Tests with real database interactions
 * Includes performance test (<500ms for 50-question assessment)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '../../src/generated/prisma/index.js';
import { WeightedScoringService } from '../../src/services/weighted-scoring.service.js';

const prisma = new PrismaClient();
const service = new WeightedScoringService();

describe('WeightedScoringService - Integration Tests', () => {
  let testOrganizationId: string;
  let testUserId: string;
  let testTemplateId: string;
  let testAssessmentId: string;

  beforeAll(async () => {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Test Org for Scoring',
        companySize: 'SMB',
        annualRevenue: 'FROM_1M_10M',
        geography: 'EU',
        complianceTeamSize: 'ONE_TWO',
        riskProfile: 'MEDIUM',
      },
    });
    testOrganizationId = org.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'scoring-test@example.com',
        password: 'hashed_password',
        name: 'Scoring Test User',
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: true,
        organizationId: testOrganizationId,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.answer.deleteMany({ where: { assessment: { userId: testUserId } } });
    await prisma.assessment.deleteMany({ where: { userId: testUserId } });
    await prisma.question.deleteMany({ where: { section: { template: { id: testTemplateId } } } });
    await prisma.section.deleteMany({ where: { templateId: testTemplateId } });
    await prisma.template.deleteMany({ where: { id: testTemplateId } });
    await prisma.document.deleteMany({ where: { organizationId: testOrganizationId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.organization.deleteMany({ where: { id: testOrganizationId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up previous test data
    if (testAssessmentId) {
      await prisma.answer.deleteMany({ where: { assessmentId: testAssessmentId } });
      await prisma.assessment.deleteMany({ where: { id: testAssessmentId } });
    }
  });

  describe('Complete 10-Question Assessment', () => {
    it('should calculate scores end-to-end for 10-question assessment', async () => {
      // Create template with 2 sections
      const template = await prisma.template.create({
        data: {
          name: 'Integration Test Template',
          description: 'Template for integration testing',
          category: 'GDPR',
        },
      });
      testTemplateId = template.id;

      // Create Section 1 (weight 0.6) with 6 questions
      const section1 = await prisma.section.create({
        data: {
          templateId: template.id,
          name: 'Data Protection',
          description: 'Data protection controls',
          weight: 0.6,
          order: 1,
          regulatoryPriority: 'CRITICAL',
        },
      });

      const section1Questions = [];
      for (let i = 0; i < 6; i++) {
        const q = await prisma.question.create({
          data: {
            sectionId: section1.id,
            text: `Section 1 Question ${i + 1}`,
            description: 'Test question',
            weight: 1.0 / 6, // Equal weights
            order: i + 1,
            questionType: 'MULTIPLE_CHOICE',
            aiPrompt: 'Analyze compliance',
            scoringCriteria: {},
          },
        });
        section1Questions.push(q);
      }

      // Create Section 2 (weight 0.4) with 4 questions
      const section2 = await prisma.section.create({
        data: {
          templateId: template.id,
          name: 'Access Controls',
          description: 'Access control measures',
          weight: 0.4,
          order: 2,
          regulatoryPriority: 'HIGH',
        },
      });

      const section2Questions = [];
      for (let i = 0; i < 4; i++) {
        const q = await prisma.question.create({
          data: {
            sectionId: section2.id,
            text: `Section 2 Question ${i + 1}`,
            description: 'Test question',
            weight: 0.25, // Equal weights (4 questions * 0.25 = 1.0)
            order: i + 1,
            questionType: 'MULTIPLE_CHOICE',
            aiPrompt: 'Analyze compliance',
            scoringCriteria: {},
          },
        });
        section2Questions.push(q);
      }

      // Create assessment
      const assessment = await prisma.assessment.create({
        data: {
          userId: testUserId,
          organizationId: testOrganizationId,
          templateId: template.id,
          status: 'IN_PROGRESS',
        },
      });
      testAssessmentId = assessment.id;

      // Create documents with different tiers
      const doc_tier2 = await prisma.document.create({
        data: {
          name: 'System Generated Report',
          s3Key: 'test/tier2.pdf',
          s3Bucket: 'test-bucket',
          size: 1024,
          mimeType: 'application/pdf',
          organizationId: testOrganizationId,
          uploadedById: testUserId,
          documentType: 'AUDIT_REPORT',
          evidenceTier: 'TIER_2',
        },
      });

      const doc_tier1 = await prisma.document.create({
        data: {
          name: 'Policy Document',
          s3Key: 'test/tier1.pdf',
          s3Bucket: 'test-bucket',
          size: 2048,
          mimeType: 'application/pdf',
          organizationId: testOrganizationId,
          uploadedById: testUserId,
          documentType: 'POLICY',
          evidenceTier: 'TIER_1',
        },
      });

      const doc_tier0 = await prisma.document.create({
        data: {
          name: 'Self Declaration',
          s3Key: 'test/tier0.pdf',
          s3Bucket: 'test-bucket',
          size: 512,
          mimeType: 'application/pdf',
          organizationId: testOrganizationId,
          uploadedById: testUserId,
          documentType: 'OTHER',
          evidenceTier: 'TIER_0',
        },
      });

      // Create answers with varying scores and evidence tiers
      // Section 1: Mix of scores and tiers
      await prisma.answer.create({
        data: {
          assessmentId: assessment.id,
          questionId: section1Questions[0].id,
          rawQualityScore: 5.0,
          answerData: { text: 'Perfect answer' },
          linkedDocuments: {
            create: [{ documentId: doc_tier2.id }],
          },
        },
      });

      await prisma.answer.create({
        data: {
          assessmentId: assessment.id,
          questionId: section1Questions[1].id,
          rawQualityScore: 4.0,
          answerData: { text: 'Good answer' },
          linkedDocuments: {
            create: [{ documentId: doc_tier1.id }],
          },
        },
      });

      await prisma.answer.create({
        data: {
          assessmentId: assessment.id,
          questionId: section1Questions[2].id,
          rawQualityScore: 3.0,
          answerData: { text: 'Average answer' },
          linkedDocuments: {
            create: [{ documentId: doc_tier0.id }],
          },
        },
      });

      await prisma.answer.create({
        data: {
          assessmentId: assessment.id,
          questionId: section1Questions[3].id,
          rawQualityScore: 4.5,
          answerData: { text: 'Very good answer' },
          linkedDocuments: {
            create: [{ documentId: doc_tier2.id }],
          },
        },
      });

      await prisma.answer.create({
        data: {
          assessmentId: assessment.id,
          questionId: section1Questions[4].id,
          rawQualityScore: 3.5,
          answerData: { text: 'Decent answer' },
          linkedDocuments: {
            create: [{ documentId: doc_tier1.id }],
          },
        },
      });

      await prisma.answer.create({
        data: {
          assessmentId: assessment.id,
          questionId: section1Questions[5].id,
          rawQualityScore: 4.0,
          answerData: { text: 'Good answer' },
          linkedDocuments: {
            create: [{ documentId: doc_tier2.id }],
          },
        },
      });

      // Section 2: All good scores with TIER_2
      for (let i = 0; i < 4; i++) {
        await prisma.answer.create({
          data: {
            assessmentId: assessment.id,
            questionId: section2Questions[i].id,
            rawQualityScore: 4.5,
            answerData: { text: 'Excellent answer' },
            linkedDocuments: {
              create: [{ documentId: doc_tier2.id }],
            },
          },
        });
      }

      // Calculate overall score
      const result = await service.calculateOverallScore(assessment.id);

      // Assertions
      expect(result).toBeDefined();
      expect(result.assessmentId).toBe(assessment.id);
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.sectionScores).toHaveLength(2);
      expect(['Low', 'Medium', 'High', 'Critical']).toContain(result.riskBand);
      expect(result.methodology).toBe('complete');

      // Section 1 should have lower score due to mixed tiers
      const sec1Score = result.sectionScores.find(s => s.sectionId === section1.id);
      expect(sec1Score).toBeDefined();
      expect(sec1Score!.questionScores).toHaveLength(6);

      // Section 2 should have higher score (all TIER_2)
      const sec2Score = result.sectionScores.find(s => s.sectionId === section2.id);
      expect(sec2Score).toBeDefined();
      expect(sec2Score!.questionScores).toHaveLength(4);
      expect(sec2Score!.score).toBeGreaterThan(sec1Score!.score);

      console.log('Overall Score:', result.overallScore);
      console.log('Risk Band:', result.riskBand);
      console.log('Section 1 Score:', sec1Score?.scaledScore);
      console.log('Section 2 Score:', sec2Score?.scaledScore);
    });
  });

  describe('Performance Test - 50 Questions', () => {
    it('should calculate overall score in <500ms for 50-question assessment', async () => {
      // Create template
      const template = await prisma.template.create({
        data: {
          name: 'Performance Test Template',
          description: 'Large template for performance testing',
          category: 'ISO27001',
        },
      });
      testTemplateId = template.id;

      // Create 5 sections with 10 questions each (50 total)
      const sections = [];
      for (let s = 0; s < 5; s++) {
        const section = await prisma.section.create({
          data: {
            templateId: template.id,
            name: `Section ${s + 1}`,
            description: `Test section ${s + 1}`,
            weight: 0.2, // Equal weights (5 sections * 0.2 = 1.0)
            order: s + 1,
            regulatoryPriority: 'MEDIUM',
          },
        });

        const questions = [];
        for (let q = 0; q < 10; q++) {
          const question = await prisma.question.create({
            data: {
              sectionId: section.id,
              text: `Section ${s + 1} Question ${q + 1}`,
              description: 'Performance test question',
              weight: 0.1, // Equal weights (10 questions * 0.1 = 1.0)
              order: q + 1,
              questionType: 'MULTIPLE_CHOICE',
              aiPrompt: 'Analyze',
              scoringCriteria: {},
            },
          });
          questions.push(question);
        }

        sections.push({ section, questions });
      }

      // Create assessment
      const assessment = await prisma.assessment.create({
        data: {
          userId: testUserId,
          organizationId: testOrganizationId,
          templateId: template.id,
          status: 'IN_PROGRESS',
        },
      });
      testAssessmentId = assessment.id;

      // Create document
      const document = await prisma.document.create({
        data: {
          name: 'Performance Test Document',
          s3Key: 'test/perf.pdf',
          s3Bucket: 'test-bucket',
          size: 1024,
          mimeType: 'application/pdf',
          organizationId: testOrganizationId,
          uploadedById: testUserId,
          documentType: 'POLICY',
          evidenceTier: 'TIER_2',
        },
      });

      // Create 50 answers
      for (const { questions } of sections) {
        for (const question of questions) {
          await prisma.answer.create({
            data: {
              assessmentId: assessment.id,
              questionId: question.id,
              rawQualityScore: 4.0,
              answerData: { text: 'Test answer' },
              linkedDocuments: {
                create: [{ documentId: document.id }],
              },
            },
          });
        }
      }

      // Performance test
      const startTime = Date.now();
      const result = await service.calculateOverallScore(assessment.id);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      console.log(`Performance Test - Execution Time: ${executionTime}ms`);

      // Assertions
      expect(result).toBeDefined();
      expect(result.sectionScores).toHaveLength(5);
      expect(executionTime).toBeLessThan(500); // Must complete in <500ms

      // Verify all questions were scored
      let totalQuestions = 0;
      for (const sectionScore of result.sectionScores) {
        totalQuestions += sectionScore.questionScores.length;
      }
      expect(totalQuestions).toBe(50);
    });
  });
});
