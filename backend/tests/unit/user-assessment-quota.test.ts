import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '../../src/generated/prisma';

describe('UserAssessmentQuota Model', () => {
  let prisma: PrismaClient;
  let testUserId: string;
  let testUserId2: string;

  beforeAll(async () => {
    prisma = new PrismaClient();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'quota-test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed_password'
      }
    });
    testUserId = user.id;

    // Create second test user
    const user2 = await prisma.user.create({
      data: {
        email: 'quota-test-2@example.com',
        firstName: 'Test2',
        lastName: 'User2',
        password: 'hashed_password'
      }
    });
    testUserId2 = user2.id;
  });

  afterAll(async () => {
    // Cleanup - cascade will delete quota records
    await prisma.user.deleteMany({
      where: {
        id: { in: [testUserId, testUserId2] }
      }
    });
    await prisma.$disconnect();
  });

  it('should create quota with default values', async () => {
    const quota = await prisma.userAssessmentQuota.create({
      data: { userId: testUserId }
    });

    expect(quota.totalAssessmentsCreated).toBe(0);
    expect(quota.assessmentsThisMonth).toBe(0);
    expect(quota.assessmentsUsedThisMonth).toBe(0);
    expect(quota.userId).toBe(testUserId);
    expect(quota.createdAt).toBeInstanceOf(Date);
    expect(quota.updatedAt).toBeInstanceOf(Date);
  });

  it('should enforce unique constraint on userId', async () => {
    await expect(
      prisma.userAssessmentQuota.create({
        data: { userId: testUserId } // Duplicate
      })
    ).rejects.toThrow(); // P2002 error - unique constraint violation
  });

  it('should cascade delete when user deleted', async () => {
    // Create temporary user with quota
    const tempUser = await prisma.user.create({
      data: {
        email: 'temp@example.com',
        firstName: 'Temp',
        lastName: 'User',
        password: 'pass'
      }
    });

    await prisma.userAssessmentQuota.create({
      data: { userId: tempUser.id }
    });

    // Delete user
    await prisma.user.delete({ where: { id: tempUser.id } });

    // Verify quota deleted
    const quota = await prisma.userAssessmentQuota.findUnique({
      where: { userId: tempUser.id }
    });

    expect(quota).toBeNull();
  });

  it('should increment counters atomically', async () => {
    const quota = await prisma.userAssessmentQuota.create({
      data: { userId: testUserId2 }
    });

    // Increment totalAssessmentsCreated
    await prisma.userAssessmentQuota.update({
      where: { userId: testUserId2 },
      data: { totalAssessmentsCreated: { increment: 1 } }
    });

    const updated = await prisma.userAssessmentQuota.findUnique({
      where: { userId: testUserId2 }
    });

    expect(updated?.totalAssessmentsCreated).toBe(1);
  });

  it('should increment multiple counters', async () => {
    // Increment all three counters
    await prisma.userAssessmentQuota.update({
      where: { userId: testUserId2 },
      data: {
        totalAssessmentsCreated: { increment: 1 },
        assessmentsThisMonth: { increment: 1 },
        assessmentsUsedThisMonth: { increment: 1 }
      }
    });

    const quota = await prisma.userAssessmentQuota.findUnique({
      where: { userId: testUserId2 }
    });

    expect(quota?.totalAssessmentsCreated).toBe(2); // Was 1, now 2
    expect(quota?.assessmentsThisMonth).toBe(1);
    expect(quota?.assessmentsUsedThisMonth).toBe(1);
  });

  it('should query quota by userId efficiently', async () => {
    const quota = await prisma.userAssessmentQuota.findUnique({
      where: { userId: testUserId }
    });

    expect(quota).toBeDefined();
    expect(quota?.userId).toBe(testUserId);
  });

  it('should create quota with custom values', async () => {
    // Delete existing quota first
    await prisma.userAssessmentQuota.delete({
      where: { userId: testUserId }
    });

    const quota = await prisma.userAssessmentQuota.create({
      data: {
        userId: testUserId,
        totalAssessmentsCreated: 5,
        assessmentsThisMonth: 2,
        assessmentsUsedThisMonth: 1
      }
    });

    expect(quota.totalAssessmentsCreated).toBe(5);
    expect(quota.assessmentsThisMonth).toBe(2);
    expect(quota.assessmentsUsedThisMonth).toBe(1);
  });

  it('should include quota when querying user', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      include: { assessmentQuota: true }
    });

    expect(user?.assessmentQuota).toBeDefined();
    expect(user?.assessmentQuota?.userId).toBe(testUserId);
  });
});
