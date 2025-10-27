import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/server';
import { PrismaClient, UserRole, TemplateCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Admin Template Routes', () => {
  let server: FastifyInstance;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;
  let testOrgId: string;
  let createdTemplateId: string;

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
        slug: 'test-org',
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
        email: `admin-${Date.now()}@test.com`,
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
        email: `user-${Date.now()}@test.com`,
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
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.assessment.deleteMany({
      where: {
        template: {
          slug: {
            startsWith: 'test-template-',
          },
        },
      },
    });

    await prisma.template.deleteMany({
      where: {
        slug: {
          startsWith: 'test-template-',
        },
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

  describe('POST /admin/templates', () => {
    it('should create template with valid data and return 201', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/admin/templates',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: 'Test Template',
          slug: `test-template-${Date.now()}`,
          category: 'FINANCIAL_CRIME',
          description: 'Test description for compliance assessment',
          version: '1.0',
          isActive: true,
          creditCost: 50,
        },
      });

      expect(response.statusCode).toBe(201);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe('Test Template');
      expect(json.data.category).toBe('FINANCIAL_CRIME');
      expect(json.data.creditCost).toBe(50);
      expect(json.data.createdBy).toBe(adminUserId);

      // Store for later tests
      createdTemplateId = json.data.id;

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'TEMPLATE_CREATED',
          entityId: json.data.id,
          userId: adminUserId,
        },
      });
      expect(auditLog).toBeTruthy();
    });

    it('should return 409 error when creating template with duplicate slug', async () => {
      const slug = `test-template-duplicate-${Date.now()}`;

      // Create first template
      const firstResponse = await server.inject({
        method: 'POST',
        url: '/admin/templates',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: 'First Template',
          slug: slug,
          category: 'FINANCIAL_CRIME',
          description: 'First template description',
        },
      });

      expect(firstResponse.statusCode).toBe(201);

      // Try to create second template with same slug
      const duplicateResponse = await server.inject({
        method: 'POST',
        url: '/admin/templates',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: 'Second Template',
          slug: slug,
          category: 'CYBERSECURITY',
          description: 'Second template description',
        },
      });

      expect(duplicateResponse.statusCode).toBe(409);
      const json = duplicateResponse.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('SLUG_EXISTS');
    });

    it('should return 400 error when creating template with invalid category', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/admin/templates',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: 'Invalid Template',
          slug: `test-template-invalid-${Date.now()}`,
          category: 'INVALID_CATEGORY',
          description: 'Template with invalid category',
        },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.success).toBe(false);
    });

    it('should return 403 error when non-admin user tries to create template', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/admin/templates',
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          name: 'Unauthorized Template',
          slug: `test-template-unauth-${Date.now()}`,
          category: 'FINANCIAL_CRIME',
          description: 'Template by non-admin',
        },
      });

      expect(response.statusCode).toBe(403);
      const json = response.json();
      expect(json.success).toBe(false);
    });

    it('should return 401 error when no token is provided', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/admin/templates',
        payload: {
          name: 'No Auth Template',
          slug: `test-template-noauth-${Date.now()}`,
          category: 'FINANCIAL_CRIME',
          description: 'Template without auth',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PUT /admin/templates/:id', () => {
    let updateTemplateId: string;

    beforeEach(async () => {
      // Create a template to update
      const template = await prisma.template.create({
        data: {
          name: 'Template to Update',
          slug: `test-template-update-${Date.now()}`,
          category: TemplateCategory.FINANCIAL_CRIME,
          description: 'Original description',
          version: '1.0',
          isActive: true,
          creditCost: 50,
          createdBy: adminUserId,
        },
      });
      updateTemplateId = template.id;
    });

    it('should update template with valid data and return 200', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: `/admin/templates/${updateTemplateId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: 'Updated Template Name',
          description: 'Updated description',
          creditCost: 75,
          version: '1.1',
        },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe('Updated Template Name');
      expect(json.data.description).toBe('Updated description');
      expect(json.data.creditCost).toBe(75);
      expect(json.data.version).toBe('1.1');

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'TEMPLATE_UPDATED',
          entityId: updateTemplateId,
          userId: adminUserId,
        },
      });
      expect(auditLog).toBeTruthy();
    });

    it('should return 404 error when updating non-existent template', async () => {
      const fakeId = 'clxxxxxxxxxxxxxxxxx';

      const response = await server.inject({
        method: 'PUT',
        url: `/admin/templates/${fakeId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(404);
      const json = response.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('TEMPLATE_NOT_FOUND');
    });

    it('should return 403 error when non-admin user tries to update template', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: `/admin/templates/${updateTemplateId}`,
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          name: 'Unauthorized Update',
        },
      });

      expect(response.statusCode).toBe(403);
      const json = response.json();
      expect(json.success).toBe(false);
    });
  });

  describe('DELETE /admin/templates/:id', () => {
    let deleteTemplateId: string;

    beforeEach(async () => {
      // Create a template to delete
      const template = await prisma.template.create({
        data: {
          name: 'Template to Delete',
          slug: `test-template-delete-${Date.now()}`,
          category: TemplateCategory.CYBERSECURITY,
          description: 'Template for deletion test',
          version: '1.0',
          isActive: true,
          creditCost: 30,
          createdBy: adminUserId,
        },
      });
      deleteTemplateId = template.id;
    });

    it('should soft delete template and return 200', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/admin/templates/${deleteTemplateId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);

      // Verify template is soft deleted (isActive = false)
      const deletedTemplate = await prisma.template.findUnique({
        where: { id: deleteTemplateId },
      });
      expect(deletedTemplate?.isActive).toBe(false);

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'TEMPLATE_DELETED',
          entityId: deleteTemplateId,
          userId: adminUserId,
        },
      });
      expect(auditLog).toBeTruthy();
    });

    it('should return 400 error when deleting template with active assessments', async () => {
      // Create an assessment using the template
      await prisma.assessment.create({
        data: {
          organizationId: testOrgId,
          templateId: deleteTemplateId,
          userId: adminUserId,
          status: 'IN_PROGRESS',
          name: 'Test Assessment',
          totalScore: 0,
        },
      });

      const response = await server.inject({
        method: 'DELETE',
        url: `/admin/templates/${deleteTemplateId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(400);
      const json = response.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('TEMPLATE_IN_USE');
      expect(json.metadata?.assessmentCount).toBeGreaterThan(0);
    });

    it('should return 404 error when deleting non-existent template', async () => {
      const fakeId = 'clxxxxxxxxxxxxxxxxx';

      const response = await server.inject({
        method: 'DELETE',
        url: `/admin/templates/${fakeId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(404);
      const json = response.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('TEMPLATE_NOT_FOUND');
    });

    it('should return 403 error when non-admin user tries to delete template', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/admin/templates/${deleteTemplateId}`,
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(403);
      const json = response.json();
      expect(json.success).toBe(false);
    });
  });

  describe('GET /admin/templates/stats', () => {
    beforeAll(async () => {
      // Create some templates for stats testing
      const categories = [
        TemplateCategory.FINANCIAL_CRIME,
        TemplateCategory.CYBERSECURITY,
        TemplateCategory.DATA_PRIVACY,
      ];

      for (let i = 0; i < 5; i++) {
        await prisma.template.create({
          data: {
            name: `Stats Test Template ${i}`,
            slug: `test-template-stats-${Date.now()}-${i}`,
            category: categories[i % categories.length],
            description: `Stats test template ${i}`,
            version: '1.0',
            isActive: i < 3, // 3 active, 2 inactive
            creditCost: 50,
            createdBy: adminUserId,
          },
        });
      }
    });

    it('should return template statistics with 200', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/admin/templates/stats',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty('totalTemplates');
      expect(json.data).toHaveProperty('activeTemplates');
      expect(json.data).toHaveProperty('categoryCounts');
      expect(json.data.totalTemplates).toBeGreaterThan(0);
      expect(json.data.activeTemplates).toBeGreaterThan(0);
      expect(typeof json.data.categoryCounts).toBe('object');
    });

    it('should return 403 error when non-admin user tries to access stats', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/admin/templates/stats',
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(403);
      const json = response.json();
      expect(json.success).toBe(false);
    });

    it('should return 401 error when no token is provided', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/admin/templates/stats',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Backward Compatibility', () => {
    it('should verify public template routes still work - GET /templates', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/templates',
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('should verify public template routes still work - GET /templates/:id', async () => {
      // Use createdTemplateId from POST test
      if (!createdTemplateId) {
        // Create a template if not exists
        const template = await prisma.template.create({
          data: {
            name: 'Test Template for Public Route',
            slug: `test-template-public-${Date.now()}`,
            category: TemplateCategory.FINANCIAL_CRIME,
            description: 'Template for testing public route',
            version: '1.0',
            isActive: true,
            creditCost: 50,
            createdBy: adminUserId,
          },
        });
        createdTemplateId = template.id;
      }

      const response = await server.inject({
        method: 'GET',
        url: `/templates/${createdTemplateId}`,
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(createdTemplateId);
    });
  });
});
