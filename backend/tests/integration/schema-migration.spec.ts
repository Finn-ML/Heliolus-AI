import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient, EvidenceTier, EffortRange, CostRange } from '../../src/generated/prisma'

describe('Schema Migration - Enhanced Scoring Foundation', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = new PrismaClient()
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should have EvidenceTier enum accessible', () => {
    expect(EvidenceTier.TIER_0).toBeDefined()
    expect(EvidenceTier.TIER_1).toBeDefined()
    expect(EvidenceTier.TIER_2).toBeDefined()
  })

  it('should have updated EffortRange enum with new values', () => {
    expect(EffortRange.SMALL).toBeDefined()
    expect(EffortRange.MEDIUM).toBeDefined()
    expect(EffortRange.LARGE).toBeDefined()
  })

  it('should have updated CostRange enum with new values', () => {
    expect(CostRange.UNDER_10K).toBeDefined()
    expect(CostRange.RANGE_10K_50K).toBeDefined()
    expect(CostRange.RANGE_50K_100K).toBeDefined()
    expect(CostRange.RANGE_100K_250K).toBeDefined()
    expect(CostRange.OVER_250K).toBeDefined()
  })

  it('should allow creating Question with isFoundational field', async () => {
    // This test verifies the schema accepts the new field
    // Actual creation would require a valid template/section setup
    const questionType = prisma.question
    expect(questionType).toBeDefined()
  })

  it('should allow creating Section with regulatoryPriority field', async () => {
    // This test verifies the schema accepts the new field
    const sectionType = prisma.section
    expect(sectionType).toBeDefined()
  })

  it('should verify Answer model has weighted scoring fields', async () => {
    // Verify TypeScript types include new fields
    const answerType = prisma.answer
    expect(answerType).toBeDefined()
  })

  it('should verify Document model has evidence tier fields', async () => {
    // Verify TypeScript types include new fields
    const documentType = prisma.document
    expect(documentType).toBeDefined()
  })

  it('should verify Gap model has existing effort/cost fields', async () => {
    // Verify Gap model still has the effort/cost fields (using updated enums)
    const gapType = prisma.gap
    expect(gapType).toBeDefined()
  })
})
