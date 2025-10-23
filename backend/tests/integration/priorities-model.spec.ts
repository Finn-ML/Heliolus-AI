import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient, CompanySize, AnnualRevenue, ComplianceTeamSize } from '../../src/generated/prisma'

describe('AssessmentPriorities Model', () => {
  let prisma: PrismaClient
  let testUserId: string
  let testOrgId: string
  let testTemplateId: string
  let testAssessmentId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    await prisma.$connect()

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-priorities-${Date.now()}@test.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed_password',
      },
    })
    testUserId = user.id

    // Create test organization
    const org = await prisma.organization.create({
      data: {
        userId: testUserId,
        name: 'Test Org Priorities',
        country: 'US',
      },
    })
    testOrgId = org.id

    // Create test template
    const template = await prisma.template.create({
      data: {
        name: 'Test Template Priorities',
        slug: `test-template-priorities-${Date.now()}`,
        description: 'Test template for priorities',
        category: 'FINANCIAL_CRIME',
        createdBy: testUserId,
      },
    })
    testTemplateId = template.id
  })

  afterAll(async () => {
    // Cleanup: delete assessments first, then template, then user
    await prisma.assessment.deleteMany({ where: { userId: testUserId } })
    await prisma.template.delete({ where: { id: testTemplateId } })
    await prisma.user.delete({ where: { id: testUserId } })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Create fresh assessment for each test
    const assessment = await prisma.assessment.create({
      data: {
        organizationId: testOrgId,
        userId: testUserId,
        templateId: testTemplateId,
        status: 'DRAFT',
      },
    })
    testAssessmentId = assessment.id
  })

  it('should create priorities record with all fields populated', async () => {
    const priorities = await prisma.assessmentPriorities.create({
      data: {
        assessmentId: testAssessmentId,
        // Step 1
        companySize: CompanySize.MIDMARKET,
        annualRevenue: AnnualRevenue.FROM_10M_100M,
        complianceTeamSize: ComplianceTeamSize.THREE_TEN,
        jurisdictions: ['FinCEN', 'FCA', 'MAS'],
        existingSystems: ['Salesforce', 'SAP'],
        // Step 2
        primaryGoal: 'Reduce compliance risk',
        implementationUrgency: 'Immediate',
        // Step 3
        selectedUseCases: ['Sanctions', 'KYC', 'Transaction Monitoring'],
        rankedPriorities: ['Sanctions', 'Transaction Monitoring', 'KYC'],
        // Step 4
        budgetRange: '$200K-$500K',
        deploymentPreference: 'Cloud',
        mustHaveFeatures: ['Real-time monitoring', 'AI/ML', 'Integration capabilities'],
        criticalIntegrations: ['Salesforce'],
        // Step 5
        vendorMaturity: 'Established',
        geographicRequirements: 'US presence required',
        supportModel: 'Managed service',
        // Step 6
        decisionFactorRanking: ['Speed', 'Innovation', 'Track record', 'Cost', 'Support', 'Scalability'],
      },
    })

    expect(priorities).toBeDefined()
    expect(priorities.assessmentId).toBe(testAssessmentId)
    expect(priorities.companySize).toBe(CompanySize.MIDMARKET)
    expect(priorities.jurisdictions).toEqual(['FinCEN', 'FCA', 'MAS'])
    expect(priorities.rankedPriorities).toHaveLength(3)
    expect(priorities.mustHaveFeatures).toHaveLength(3)
    expect(priorities.decisionFactorRanking).toHaveLength(6)
  })

  it('should read priorities by assessmentId', async () => {
    // Create priorities
    await prisma.assessmentPriorities.create({
      data: {
        assessmentId: testAssessmentId,
        companySize: CompanySize.SMB,
        annualRevenue: AnnualRevenue.FROM_1M_10M,
        complianceTeamSize: ComplianceTeamSize.ONE_TWO,
        jurisdictions: ['FinCEN'],
        existingSystems: ['Excel'],
        primaryGoal: 'Automate compliance',
        implementationUrgency: 'Planned',
        selectedUseCases: ['KYC'],
        rankedPriorities: ['KYC'],
        budgetRange: 'Under $100K',
        deploymentPreference: 'On-premise',
        mustHaveFeatures: ['User-friendly'],
        criticalIntegrations: [],
        vendorMaturity: 'Any',
        geographicRequirements: 'None',
        supportModel: 'Self-service',
        decisionFactorRanking: ['Cost', 'Ease of use', 'Speed', 'Support', 'Innovation', 'Track record'],
      },
    })

    // Read back
    const found = await prisma.assessmentPriorities.findUnique({
      where: { assessmentId: testAssessmentId },
    })

    expect(found).toBeDefined()
    expect(found?.companySize).toBe(CompanySize.SMB)
    expect(found?.primaryGoal).toBe('Automate compliance')
  })

  it('should update priorities record', async () => {
    // Create initial
    const created = await prisma.assessmentPriorities.create({
      data: {
        assessmentId: testAssessmentId,
        companySize: CompanySize.STARTUP,
        annualRevenue: AnnualRevenue.UNDER_1M,
        complianceTeamSize: ComplianceTeamSize.NONE,
        jurisdictions: ['FinCEN'],
        existingSystems: [],
        primaryGoal: 'Build compliance program',
        implementationUrgency: 'Long-term',
        selectedUseCases: ['KYC'],
        rankedPriorities: ['KYC'],
        budgetRange: 'Under $50K',
        deploymentPreference: 'Cloud',
        mustHaveFeatures: ['Low cost'],
        criticalIntegrations: [],
        vendorMaturity: 'Any',
        geographicRequirements: 'None',
        supportModel: 'Self-service',
        decisionFactorRanking: ['Cost', 'Ease of use', 'Speed', 'Support', 'Innovation', 'Track record'],
      },
    })

    // Update
    const updated = await prisma.assessmentPriorities.update({
      where: { id: created.id },
      data: {
        primaryGoal: 'UPDATED: Enhance compliance program',
        mustHaveFeatures: ['Low cost', 'Easy integration'],
      },
    })

    expect(updated.primaryGoal).toBe('UPDATED: Enhance compliance program')
    expect(updated.mustHaveFeatures).toHaveLength(2)
  })

  it('should cascade delete priorities when assessment deleted', async () => {
    // Create priorities
    const priorities = await prisma.assessmentPriorities.create({
      data: {
        assessmentId: testAssessmentId,
        companySize: CompanySize.ENTERPRISE,
        annualRevenue: AnnualRevenue.OVER_100M,
        complianceTeamSize: ComplianceTeamSize.OVER_TEN,
        jurisdictions: ['FinCEN', 'FCA'],
        existingSystems: ['Salesforce', 'SAP', 'Oracle'],
        primaryGoal: 'Comprehensive compliance',
        implementationUrgency: 'Immediate',
        selectedUseCases: ['Sanctions', 'KYC', 'Transaction Monitoring', 'AML'],
        rankedPriorities: ['Sanctions', 'KYC', 'AML'],
        budgetRange: 'Over $1M',
        deploymentPreference: 'Hybrid',
        mustHaveFeatures: ['Enterprise scale', 'Advanced analytics', 'Multi-region', 'White-glove support', 'SLA'],
        criticalIntegrations: ['Salesforce', 'SAP'],
        vendorMaturity: 'Established only',
        geographicRequirements: 'Global coverage',
        supportModel: 'Dedicated account manager',
        decisionFactorRanking: ['Track record', 'Scalability', 'Support', 'Innovation', 'Speed', 'Cost'],
      },
    })

    expect(priorities).toBeDefined()

    // Delete assessment
    await prisma.assessment.delete({ where: { id: testAssessmentId } })

    // Verify priorities also deleted
    const found = await prisma.assessmentPriorities.findUnique({
      where: { assessmentId: testAssessmentId },
    })

    expect(found).toBeNull()
  })

  it('should enforce unique constraint on assessmentId', async () => {
    // Create first priorities
    await prisma.assessmentPriorities.create({
      data: {
        assessmentId: testAssessmentId,
        companySize: CompanySize.SMB,
        annualRevenue: AnnualRevenue.FROM_1M_10M,
        complianceTeamSize: ComplianceTeamSize.ONE_TWO,
        jurisdictions: ['FinCEN'],
        existingSystems: [],
        primaryGoal: 'Test',
        implementationUrgency: 'Test',
        selectedUseCases: ['Test'],
        rankedPriorities: ['Test'],
        budgetRange: 'Test',
        deploymentPreference: 'Test',
        mustHaveFeatures: ['Test'],
        criticalIntegrations: [],
        vendorMaturity: 'Test',
        geographicRequirements: 'Test',
        supportModel: 'Test',
        decisionFactorRanking: ['Test'],
      },
    })

    // Attempt to create duplicate
    await expect(
      prisma.assessmentPriorities.create({
        data: {
          assessmentId: testAssessmentId, // Same assessmentId
          companySize: CompanySize.STARTUP,
          annualRevenue: AnnualRevenue.UNDER_1M,
          complianceTeamSize: ComplianceTeamSize.NONE,
          jurisdictions: ['FCA'],
          existingSystems: [],
          primaryGoal: 'Duplicate',
          implementationUrgency: 'Duplicate',
          selectedUseCases: ['Duplicate'],
          rankedPriorities: ['Duplicate'],
          budgetRange: 'Duplicate',
          deploymentPreference: 'Duplicate',
          mustHaveFeatures: ['Duplicate'],
          criticalIntegrations: [],
          vendorMaturity: 'Duplicate',
          geographicRequirements: 'Duplicate',
          supportModel: 'Duplicate',
          decisionFactorRanking: ['Duplicate'],
        },
      })
    ).rejects.toThrow()
  })

  it('should verify AssessmentPriorities type available in TypeScript', () => {
    // Type check - this will fail to compile if type not generated
    const testType: typeof prisma.assessmentPriorities = prisma.assessmentPriorities
    expect(testType).toBeDefined()
  })

  it('should allow creating priorities with array fields', async () => {
    const priorities = await prisma.assessmentPriorities.create({
      data: {
        assessmentId: testAssessmentId,
        companySize: CompanySize.MIDMARKET,
        annualRevenue: AnnualRevenue.FROM_10M_100M,
        complianceTeamSize: ComplianceTeamSize.THREE_TEN,
        // Test various array configurations
        jurisdictions: ['FinCEN', 'FCA', 'MAS', 'BaFin'],
        existingSystems: ['Salesforce', 'SAP', 'Oracle', 'Microsoft Dynamics'],
        primaryGoal: 'Test arrays',
        implementationUrgency: 'Test',
        selectedUseCases: ['Sanctions', 'KYC', 'TM', 'AML', 'Fraud'],
        rankedPriorities: ['Sanctions', 'KYC', 'TM'],
        budgetRange: 'Test',
        deploymentPreference: 'Test',
        mustHaveFeatures: ['Feature1', 'Feature2', 'Feature3', 'Feature4', 'Feature5'],
        criticalIntegrations: ['Salesforce', 'SAP', 'Oracle'],
        vendorMaturity: 'Test',
        geographicRequirements: 'Test',
        supportModel: 'Test',
        decisionFactorRanking: ['Factor1', 'Factor2', 'Factor3', 'Factor4', 'Factor5', 'Factor6'],
      },
    })

    expect(priorities.jurisdictions).toHaveLength(4)
    expect(priorities.existingSystems).toHaveLength(4)
    expect(priorities.selectedUseCases).toHaveLength(5)
    expect(priorities.mustHaveFeatures).toHaveLength(5)
    expect(priorities.decisionFactorRanking).toHaveLength(6)
  })
})
