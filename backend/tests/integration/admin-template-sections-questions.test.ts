import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server';
import { PrismaClient, UserRole, TemplateCategory, QuestionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Admin Section & Question Routes', () => {
  let server: FastifyInstance;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;
  let testOrgId: string;
  let testTemplateId: string;
  let createdSectionId: string;
  let createdQuestionId: string;

  beforeAll(async () => {
    // Build server
    server = await buildServer();
    await server.ready();

    // Initialize Prisma client
    prisma = new PrismaClient();

    // Create test organization
    const testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: 'test-org-sections',
        industry: 'FINANCIAL_SERVICES',
        size: 'ENTERPRISE',
        address: '123 Test St',
        city: 'Test City',
        country: 'US',
        status: 'ACTIVE',
      },
    });
    testOrgId = testOrg.id;

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-sections-${Date.now()}@test.com`,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        password: adminPassword,
        organizationId: testOrgId,
        emailVerified: true,
      },
    });
    adminUserId = adminUser.id;

    // Create regular user
    const userPassword = await bcrypt.hash('User123!', 10);
    const regularUser = await prisma.user.create({
      data: {
        email: `user-sections-${Date.now()}@test.com`,
        firstName: 'Regular',
        lastName: 'User',
        role: UserRole.USER,
        password: userPassword,
        organizationId: testOrgId,
        emailVerified: true,
      },
    });
    regularUserId = regularUser.id;

    // Get admin JWT token
    const adminLoginResponse = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: adminUser.email,
        password: 'Admin123!',
      },
    });
    adminToken = adminLoginResponse.json().data.token;

    // Get regular user JWT token
    const userLoginResponse = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: regularUser.email,
        password: 'User123!',
      },
    });
    userToken = userLoginResponse.json().data.token;

    // Create test template
    const template = await prisma.template.create({
      data: {
        name: 'Test Template for Sections',
        slug: `test-template-sections-${Date.now()}`,
        category: TemplateCategory.FINANCIAL_CRIME,
        description: 'Template for testing sections and questions',
        version: '1.0',
        isActive: true,
        creditCost: 50,
        createdBy: adminUserId,
      },
    });
    testTemplateId = template.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.question.deleteMany({
      where: {
        section: {
          templateId: testTemplateId,
        },
      },
    });

    await prisma.section.deleteMany({
      where: {
        templateId: testTemplateId,
      },
    });

    await prisma.template.deleteMany({
      where: {
        id: testTemplateId,
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [adminUserId, regularUserId],
        },
      },
    });

    await prisma.organization.deleteMany({
      where: {
        id: testOrgId,
      },
    });

    await prisma.$disconnect();
    await server.close();
  });

  describe('POST /admin/templates/:templateId/sections', () => {
    it('should create section with valid data and return 201', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/admin/templates/${testTemplateId}/sections`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          title: 'Test Section',
          description: 'Test section description',
          order: 1,
          weight: 25.0,
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Test Section');
      expect(json.data.weight).toBe(25.0);
      expect(json.data.templateId).toBe(testTemplateId);

      // Store for later tests
      createdSectionId = json.data.id;

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'TEMPLATE_SECTION_CREATED',
          entityId: json.data.id,
          userId: adminUserId,
        },
      });
      expect(auditLog).toBeTruthy();
    });

    it('should return 403 error when non-admin user tries to create section', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/admin/templates/${testTemplateId}/sections`,
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          title: 'Unauthorized Section',
          order: 2,
        },
      });

      expect(response.statusCode).toBe(403);
      const json = response.json();
      expect(json.success).toBe(false);
    });

    it('should return 404 error when template not found', async () => {
      const fakeTemplateId = 'clxxxxxxxxxxxxxxxxx';

      const response = await server.inject({
        method: 'POST',
        url: `/admin/templates/${fakeTemplateId}/sections`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          title: 'Section for Fake Template',
          order: 1,
        },
      });

      expect(response.statusCode).toBe(404);
      const json = response.json();
      expect(json.success).toBe(false);
    });
  });

  describe('PUT /admin/sections/:id', () => {
    let updateSectionId: string;

    beforeEach(async () => {
      // Create a section to update
      const section = await prisma.section.create({
        data: {
          templateId: testTemplateId,
          title: 'Section to Update',
          description: 'Original description',
          order: 5,
          weight: 10.0,
        },
      });
      updateSectionId = section.id;
    });

    it('should update section with valid data and return 200', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: `/admin/sections/${updateSectionId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          title: 'Updated Section Title',
          weight: 50.0,
          order: 2,
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Updated Section Title');
      expect(json.data.weight).toBe(50.0);
      expect(json.data.order).toBe(2);

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'TEMPLATE_SECTION_UPDATED',
          entityId: updateSectionId,
          userId: adminUserId,
        },
      });
      expect(auditLog).toBeTruthy();
    });

    it('should reject weight > 100 with 400 error', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: `/admin/sections/${updateSectionId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          weight: 150.0,
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.success).toBe(false);
    });

    it('should return 404 error when section not found', async () => {
      const fakeSectionId = 'clxxxxxxxxxxxxxxxxx';

      const response = await server.inject({
        method: 'PUT',
        url: `/admin/sections/${fakeSectionId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          title: 'Updated Title',
        },
      });

      expect(response.statusCode).toBe(404);
      const json = response.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('SECTION_NOT_FOUND');
    });

    it('should return 403 error when non-admin user tries to update section', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: `/admin/sections/${updateSectionId}`,
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          title: 'Unauthorized Update',
        },
      });

      expect(response.statusCode).toBe(403);
      const json = response.json();
      expect(json.success).toBe(false);
    });

    it('should prevent section modification on inactive template', async () => {
      // Create inactive template
      const inactiveTemplate = await prisma.template.create({
        data: {
          name: 'Inactive Template',
          slug: `test-inactive-${Date.now()}`,
          category: TemplateCategory.CYBERSECURITY,
          description: 'Inactive template',
          version: '1.0',
          isActive: false,
          createdBy: adminUserId,
        },
      });

      // Create section in inactive template
      const section = await prisma.section.create({
        data: {
          templateId: inactiveTemplate.id,
          title: 'Section in Inactive Template',
          order: 1,
        },
      });

      const response = await server.inject({
        method: 'PUT',
        url: `/admin/sections/${section.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          title: 'Should Fail',
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.code).toBe('TEMPLATE_INACTIVE');

      // Cleanup
      await prisma.section.delete({ where: { id: section.id } });
      await prisma.template.delete({ where: { id: inactiveTemplate.id } });
    });
  });

  describe('DELETE /admin/sections/:id', () => {
    it('should cascade delete questions when section deleted', async () => {
      // Create section
      const section = await prisma.section.create({
        data: {
          templateId: testTemplateId,
          title: 'Section to Delete with Questions',
          order: 10,
        },
      });

      // Create 3 questions in section
      const question1 = await prisma.question.create({
        data: {
          sectionId: section.id,
          text: 'Question 1',
          type: QuestionType.TEXT,
          order: 1,
        },
      });

      const question2 = await prisma.question.create({
        data: {
          sectionId: section.id,
          text: 'Question 2',
          type: QuestionType.BOOLEAN,
          order: 2,
        },
      });

      const question3 = await prisma.question.create({
        data: {
          sectionId: section.id,
          text: 'Question 3',
          type: QuestionType.NUMBER,
          order: 3,
        },
      });

      // Delete section
      const response = await server.inject({
        method: 'DELETE',
        url: `/admin/sections/${section.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.message).toContain('3 questions');

      // Verify section is deleted
      const deletedSection = await prisma.section.findUnique({
        where: { id: section.id },
      });
      expect(deletedSection).toBeNull();

      // Verify questions are also deleted (cascade)
      const remainingQuestions = await prisma.question.findMany({
        where: {
          id: {
            in: [question1.id, question2.id, question3.id],
          },
        },
      });
      expect(remainingQuestions).toHaveLength(0);

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'TEMPLATE_SECTION_DELETED',
          entityId: section.id,
          userId: adminUserId,
        },
      });
      expect(auditLog).toBeTruthy();
    });

    it('should return 403 error when non-admin user tries to delete section', async () => {
      const section = await prisma.section.create({
        data: {
          templateId: testTemplateId,
          title: 'Section for Delete Test',
          order: 11,
        },
      });

      const response = await server.inject({
        method: 'DELETE',
        url: `/admin/sections/${section.id}`,
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(403);
      const json = response.json();
      expect(json.success).toBe(false);

      // Cleanup
      await prisma.section.delete({ where: { id: section.id } });
    });
  });

  describe('POST /admin/sections/:sectionId/questions', () => {
    let questionSectionId: string;

    beforeEach(async () => {
      // Create a section for question tests
      const section = await prisma.section.create({
        data: {
          templateId: testTemplateId,
          title: 'Section for Question Tests',
          order: 20,
        },
      });
      questionSectionId = section.id;
    });

    it('should create question with aiPromptHint and return 201', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/admin/sections/${questionSectionId}/questions`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          text: 'What is your data retention policy?',
          type: 'TEXT',
          order: 1,
          required: true,
          weight: 15.0,
          aiPromptHint: 'Look for specific timelines and compliance references',
          helpText: 'Describe your organization data retention practices',
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.text).toBe('What is your data retention policy?');
      expect(json.data.type).toBe('TEXT');
      expect(json.data.weight).toBe(15.0);
      expect(json.data.sectionId).toBe(questionSectionId);

      // Store for later tests
      createdQuestionId = json.data.id;

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'TEMPLATE_QUESTION_CREATED',
          entityId: json.data.id,
          userId: adminUserId,
        },
      });
      expect(auditLog).toBeTruthy();
    });

    it('should validate QuestionType enum with 400 error', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/admin/sections/${questionSectionId}/questions`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          text: 'Invalid Question',
          type: 'INVALID_TYPE',
          order: 2,
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.success).toBe(false);
    });

    it('should return 403 error when non-admin user tries to create question', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/admin/sections/${questionSectionId}/questions`,
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          text: 'Unauthorized Question',
          type: 'TEXT',
          order: 3,
        },
      });

      expect(response.statusCode).toBe(403);
      const json = response.json();
      expect(json.success).toBe(false);
    });
  });

  describe('PUT /admin/questions/:id', () => {
    let updateQuestionId: string;
    let updateQuestionSectionId: string;

    beforeEach(async () => {
      // Create section
      const section = await prisma.section.create({
        data: {
          templateId: testTemplateId,
          title: 'Section for Question Update',
          order: 30,
        },
      });
      updateQuestionSectionId = section.id;

      // Create question to update
      const question = await prisma.question.create({
        data: {
          sectionId: updateQuestionSectionId,
          text: 'Original Question Text',
          type: QuestionType.TEXT,
          order: 1,
          weight: 5.0,
        },
      });
      updateQuestionId = question.id;
    });

    it('should update question weight and return 200', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: `/admin/questions/${updateQuestionId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          text: 'Updated Question Text',
          weight: 75.0,
          aiPromptHint: 'New AI prompt hint',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.text).toBe('Updated Question Text');
      expect(json.data.weight).toBe(75.0);

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'TEMPLATE_QUESTION_UPDATED',
          entityId: updateQuestionId,
          userId: adminUserId,
        },
      });
      expect(auditLog).toBeTruthy();
    });

    it('should reject weight > 100 with 400 error', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: `/admin/questions/${updateQuestionId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          weight: 150.0,
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.success).toBe(false);
    });

    it('should return 404 error when question not found', async () => {
      const fakeQuestionId = 'clxxxxxxxxxxxxxxxxx';

      const response = await server.inject({
        method: 'PUT',
        url: `/admin/questions/${fakeQuestionId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          text: 'Updated Text',
        },
      });

      expect(response.statusCode).toBe(404);
      const json = response.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('QUESTION_NOT_FOUND');
    });
  });

  describe('DELETE /admin/questions/:id', () => {
    let deleteQuestionId: string;
    let deleteQuestionSectionId: string;

    beforeEach(async () => {
      // Create section
      const section = await prisma.section.create({
        data: {
          templateId: testTemplateId,
          title: 'Section for Question Delete',
          order: 40,
        },
      });
      deleteQuestionSectionId = section.id;

      // Create question to delete
      const question = await prisma.question.create({
        data: {
          sectionId: deleteQuestionSectionId,
          text: 'Question to Delete',
          type: QuestionType.BOOLEAN,
          order: 1,
        },
      });
      deleteQuestionId = question.id;
    });

    it('should delete question and return 200', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/admin/questions/${deleteQuestionId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);

      // Verify question is deleted
      const deletedQuestion = await prisma.question.findUnique({
        where: { id: deleteQuestionId },
      });
      expect(deletedQuestion).toBeNull();

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'TEMPLATE_QUESTION_DELETED',
          entityId: deleteQuestionId,
          userId: adminUserId,
        },
      });
      expect(auditLog).toBeTruthy();
    });

    it('should return 403 error when non-admin user tries to delete question', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/admin/questions/${deleteQuestionId}`,
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(403);
      const json = response.json();
      expect(json.success).toBe(false);
    });
  });

  describe('POST /admin/sections/:sectionId/questions/bulk', () => {
    let bulkSectionId: string;

    beforeEach(async () => {
      // Create section for bulk tests
      const section = await prisma.section.create({
        data: {
          templateId: testTemplateId,
          title: 'Section for Bulk Questions',
          order: 50,
        },
      });
      bulkSectionId = section.id;
    });

    it('should bulk create 10 questions in transaction and return 201', async () => {
      const questions = Array.from({ length: 10 }, (_, i) => ({
        text: `Bulk Question ${i + 1}`,
        type: 'TEXT',
        order: i + 1,
        weight: (i + 1) * 5,
        required: i % 2 === 0,
      }));

      const response = await server.inject({
        method: 'POST',
        url: `/admin/sections/${bulkSectionId}/questions/bulk`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          questions,
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(10);
      expect(json.message).toContain('10 questions');

      // Verify all questions were created
      const createdQuestions = await prisma.question.findMany({
        where: {
          sectionId: bulkSectionId,
        },
      });
      expect(createdQuestions).toHaveLength(10);

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'TEMPLATE_QUESTIONS_BULK_CREATED',
          userId: adminUserId,
        },
      });
      expect(auditLog).toBeTruthy();
      expect(auditLog?.metadata).toHaveProperty('count', 10);
    });

    it('should rollback bulk create if one question invalid with 400 error', async () => {
      const questions = [
        { text: 'Valid Question 1', type: 'TEXT', order: 1 },
        { text: 'Invalid Question', type: 'INVALID_TYPE', order: 2 },
        { text: 'Valid Question 2', type: 'BOOLEAN', order: 3 },
      ];

      const response = await server.inject({
        method: 'POST',
        url: `/admin/sections/${bulkSectionId}/questions/bulk`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          questions,
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.success).toBe(false);

      // Verify no questions were created (rollback)
      const createdQuestions = await prisma.question.findMany({
        where: {
          sectionId: bulkSectionId,
        },
      });
      expect(createdQuestions).toHaveLength(0);
    });

    it('should return 403 error when non-admin user tries bulk create', async () => {
      const questions = [
        { text: 'Question 1', type: 'TEXT', order: 1 },
        { text: 'Question 2', type: 'BOOLEAN', order: 2 },
      ];

      const response = await server.inject({
        method: 'POST',
        url: `/admin/sections/${bulkSectionId}/questions/bulk`,
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          questions,
        },
      });

      expect(response.statusCode).toBe(403);
      const json = response.json();
      expect(json.success).toBe(false);
    });
  });
});
