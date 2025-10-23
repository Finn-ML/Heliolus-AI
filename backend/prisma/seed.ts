import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';
import { seedTradeComplianceV3 } from './seed-templates-trade-v3';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.vendorContact.deleteMany();
  await prisma.report.deleteMany();
  await prisma.creditTransaction.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.vendorMatch.deleteMany();
  await prisma.solution.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.gap.deleteMany();
  await prisma.assessment.deleteMany();  // Delete assessments before templates
  await prisma.question.deleteMany();
  await prisma.section.deleteMany();
  await prisma.template.deleteMany();
  await prisma.document.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating users...');
  
  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@heliolus.com',
      firstName: 'Admin',
      lastName: 'User',
      password: await bcrypt.hash('Admin123!', 10),
      role: 'ADMIN',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  // Create regular users
  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@acmecorp.com',
      firstName: 'John',
      lastName: 'Doe',
      password: await bcrypt.hash('Password123!', 10),
      role: 'USER',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@techstart.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: await bcrypt.hash('Password123!', 10),
      role: 'USER',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  // Create vendor users
  const vendorUser1 = await prisma.user.create({
    data: {
      email: 'contact@complysafe.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      password: await bcrypt.hash('Vendor123!', 10),
      role: 'VENDOR',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  const vendorUser2 = await prisma.user.create({
    data: {
      email: 'info@riskguard.com',
      firstName: 'Michael',
      lastName: 'Chen',
      password: await bcrypt.hash('Vendor123!', 10),
      role: 'VENDOR',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  console.log('🏢 Creating organizations...');
  
  const org1 = await prisma.organization.create({
    data: {
      userId: user1.id,
      name: 'ACME Corporation',
      website: 'https://acmecorp.com',
      industry: 'Financial Services',
      size: 'ENTERPRISE',
      country: 'United States',
      region: 'North America',
      description: 'Leading financial services company focusing on digital transformation',
      onboardingCompleted: true,
      riskProfile: 'MEDIUM',
      complianceGaps: {
        identifiedAreas: ['KYC', 'AML', 'Data Privacy'],
        riskScore: 65,
      },
    },
  });

  const org2 = await prisma.organization.create({
    data: {
      userId: user2.id,
      name: 'TechStart Inc',
      website: 'https://techstart.com',
      industry: 'Technology',
      size: 'STARTUP',
      country: 'Germany',
      region: 'Europe',
      description: 'Innovative fintech startup revolutionizing payments',
      onboardingCompleted: true,
      riskProfile: 'HIGH',
    },
  });

  console.log('💳 Creating subscriptions...');
  
  const subscription1 = await prisma.subscription.create({
    data: {
      userId: user1.id,
      plan: 'PREMIUM',
      status: 'ACTIVE',
      creditsBalance: 100,
      creditsPurchased: 100,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      stripeCustomerId: 'cus_test_123456',
    },
  });

  const subscription2 = await prisma.subscription.create({
    data: {
      userId: user2.id,
      plan: 'FREE',
      status: 'TRIALING',
      creditsBalance: 5,
      creditsPurchased: 5,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('🏪 Creating vendors...');
  
  const vendor1 = await prisma.vendor.create({
    data: {
      companyName: 'ComplySafe Solutions',
      website: 'https://complysafe.com',
      headquarters: 'New York, USA',
      primaryProduct: 'Compliance Management Platform',
      aiCapabilities: 'AI-powered risk detection and automated compliance monitoring',
      categories: ['KYC_AML', 'REGULATORY_REPORTING', 'RISK_ASSESSMENT'],
      contactEmail: 'sales@complysafe.com',
      featured: true,
      verified: true,
      rating: 4.8,
      reviewCount: 127,
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: adminUser.id,
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      companyName: 'RiskGuard Technologies',
      website: 'https://riskguard.com',
      headquarters: 'London, UK',
      primaryProduct: 'Enterprise Risk Management Platform',
      aiCapabilities: 'Predictive analytics and real-time risk monitoring',
      categories: ['RISK_ASSESSMENT', 'TRANSACTION_MONITORING', 'DATA_GOVERNANCE'],
      contactEmail: 'contact@riskguard.com',
      featured: false,
      verified: true,
      rating: 4.5,
      reviewCount: 89,
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: adminUser.id,
    },
  });

  console.log('🛠️ Creating solutions...');
  
  const solution1 = await prisma.solution.create({
    data: {
      vendorId: vendor1.id,
      name: 'ComplySafe KYC Pro',
      description: 'Advanced Know Your Customer solution with AI-powered verification',
      category: 'KYC_AML',
      features: [
        'Automated identity verification',
        'Document authentication',
        'Risk scoring',
        'Compliance monitoring',
        'API integration',
      ],
      benefits: [
        'Reduce compliance costs by 60%',
        'Improve customer onboarding speed',
        'Ensure regulatory compliance',
        'Real-time risk assessment',
      ],
      useCases: [
        'Customer onboarding',
        'Ongoing monitoring',
        'Risk assessment',
        'Regulatory reporting',
      ],
      pricingModel: 'SUBSCRIPTION',
      startingPrice: 2500,
      currency: 'EUR',
      pricingDetails: 'Starting at €2,500/month for up to 1,000 verifications',
      gapCategories: ['KYC', 'AML', 'Customer Due Diligence'],
      industries: ['Financial Services', 'Banking', 'Fintech'],
      companySizes: ['SMB', 'MIDMARKET', 'ENTERPRISE'],
      demoUrl: 'https://complysafe.com/demo',
      brochureUrl: 'https://complysafe.com/brochure.pdf',
      caseStudyUrls: [
        'https://complysafe.com/case-study-bank.pdf',
        'https://complysafe.com/case-study-fintech.pdf',
      ],
    },
  });

  const solution2 = await prisma.solution.create({
    data: {
      vendorId: vendor2.id,
      name: 'RiskGuard Enterprise',
      description: 'Comprehensive enterprise risk management platform',
      category: 'RISK_ASSESSMENT',
      features: [
        'Real-time risk monitoring',
        'Predictive analytics',
        'Customizable dashboards',
        'Automated reporting',
        'Integration capabilities',
      ],
      benefits: [
        'Proactive risk identification',
        'Reduce operational risks',
        'Improve decision making',
        'Streamline compliance',
      ],
      useCases: [
        'Operational risk management',
        'Compliance monitoring',
        'Regulatory reporting',
        'Risk analytics',
      ],
      pricingModel: 'CUSTOM',
      pricingDetails: 'Custom pricing based on organization size and requirements',
      gapCategories: ['Operational Risk', 'Compliance Monitoring', 'Risk Analytics'],
      industries: ['Financial Services', 'Insurance', 'Healthcare'],
      companySizes: ['MIDMARKET', 'ENTERPRISE'],
      demoUrl: 'https://riskguard.com/demo',
      brochureUrl: 'https://riskguard.com/enterprise-brochure.pdf',
    },
  });

  console.log('📋 Creating templates...');
  
  const template1 = await prisma.template.create({
    data: {
      name: 'Financial Crime Risk Assessment',
      slug: 'financial-crime-assessment',
      description: 'Comprehensive assessment for financial crime risks including AML, KYC, and sanctions',
      category: 'FINANCIAL_CRIME',
      version: '2.1',
      createdBy: adminUser.id,
      scoringCriteria: {
        weights: {
          geography: 0.3,
          customer: 0.25,
          product: 0.2,
          transaction: 0.25,
        },
        thresholds: {
          low: 25,
          medium: 50,
          high: 75,
          critical: 90,
        },
      },
      aiPrompts: {
        riskAnalysis: 'Analyze the provided responses for financial crime risks',
        gapIdentification: 'Identify compliance gaps based on regulatory requirements',
        recommendations: 'Provide actionable recommendations for risk mitigation',
      },
    },
  });

  const template2 = await prisma.template.create({
    data: {
      name: 'Data Privacy Compliance Check',
      slug: 'data-privacy-gdpr',
      description: 'GDPR and data privacy compliance assessment',
      category: 'DATA_PRIVACY',
      version: '1.8',
      createdBy: adminUser.id,
    },
  });

  // Seed comprehensive Trade Compliance v3.0 template
  console.log('📋 Seeding Trade Compliance v3.0 template...');
  await seedTradeComplianceV3();

  console.log('📝 Creating template sections and questions...');

  // Template 1 - Section 1
  const section1 = await prisma.section.create({
    data: {
      templateId: template1.id,
      title: 'Geographic Risk Assessment',
      description: 'Assess risks associated with geographic locations',
      weight: 0.3,
      order: 1,
    },
  });

  await prisma.question.create({
    data: {
      sectionId: section1.id,
      text: 'In which countries does your organization operate?',
      type: 'MULTISELECT',
      required: true,
      options: [
        'United States',
        'United Kingdom',
        'Germany',
        'France',
        'Japan',
        'Singapore',
        'Other',
      ],
      helpText: 'Select all countries where you have business operations',
      order: 1,
    },
  });

  await prisma.question.create({
    data: {
      sectionId: section1.id,
      text: 'What percentage of your customer base is in high-risk jurisdictions?',
      type: 'SELECT',
      required: true,
      options: ['0-10%', '11-25%', '26-50%', '51-75%', '76-100%'],
      order: 2,
    },
  });

  // Template 1 - Section 2
  const section2 = await prisma.section.create({
    data: {
      templateId: template1.id,
      title: 'Customer Due Diligence',
      description: 'Assessment of customer onboarding and monitoring processes',
      weight: 0.25,
      order: 2,
    },
  });

  await prisma.question.create({
    data: {
      sectionId: section2.id,
      text: 'Do you have automated KYC processes in place?',
      type: 'BOOLEAN',
      required: true,
      helpText: 'Automated Know Your Customer verification',
      order: 1,
    },
  });

  console.log('📊 Creating assessments...');
  
  const assessment1 = await prisma.assessment.create({
    data: {
      organizationId: org1.id,
      userId: user1.id,
      templateId: template1.id,
      status: 'COMPLETED',
      responses: {
        '1-1': ['United States', 'Germany'],
        '1-2': '26-50%',
        '2-1': true,
      },
      aiAnalysis: {
        riskFactors: ['Geographic diversity', 'Moderate high-risk exposure'],
        strengths: ['Automated KYC processes'],
        concerns: ['Significant high-risk jurisdiction exposure'],
      },
      riskScore: 68,
      creditsUsed: 25,
      completedAt: new Date(),
      recommendations: {
        immediate: ['Enhance monitoring for high-risk jurisdictions'],
        shortTerm: ['Implement enhanced due diligence procedures'],
        longTerm: ['Consider geographic risk diversification'],
      },
    },
  });

  const assessment2 = await prisma.assessment.create({
    data: {
      organizationId: org2.id,
      userId: user2.id,
      templateId: template1.id,
      status: 'IN_PROGRESS',
      responses: {
        '1-1': ['Germany'],
      },
      creditsUsed: 10,
    },
  });

  console.log('🔍 Creating gaps and risks...');
  
  const gap1 = await prisma.gap.create({
    data: {
      assessmentId: assessment1.id,
      category: 'KYC',
      title: 'Enhanced Due Diligence for High-Risk Customers',
      description: 'Current KYC processes lack enhanced due diligence procedures for customers from high-risk jurisdictions',
      severity: 'HIGH',
      priority: 'IMMEDIATE',
      estimatedCost: 'RANGE_10K_50K',
      estimatedEffort: 'MEDIUM',
      suggestedVendors: [vendor1.id],
    },
  });

  const gap2 = await prisma.gap.create({
    data: {
      assessmentId: assessment1.id,
      category: 'AML',
      title: 'Transaction Monitoring Enhancement',
      description: 'Transaction monitoring systems need updates to detect suspicious patterns more effectively',
      severity: 'MEDIUM',
      priority: 'SHORT_TERM',
      estimatedCost: 'RANGE_50K_100K',
      estimatedEffort: 'LARGE',
      suggestedVendors: [vendor2.id],
    },
  });

  const risk1 = await prisma.risk.create({
    data: {
      assessmentId: assessment1.id,
      category: 'REGULATORY',
      title: 'Regulatory Compliance Risk',
      description: 'Risk of regulatory violations due to inadequate monitoring of high-risk customers',
      likelihood: 'LIKELY',
      impact: 'MAJOR',
      riskLevel: 'HIGH',
      mitigationStrategy: 'Implement enhanced due diligence and continuous monitoring',
      residualRisk: 'MEDIUM',
    },
  });

  console.log('🤝 Creating vendor matches...');
  
  const match1 = await prisma.vendorMatch.create({
    data: {
      gapId: gap1.id,
      vendorId: vendor1.id,
      solutionId: solution1.id,
      matchScore: 92,
      matchReasons: [
        'Specializes in KYC/AML solutions',
        'Supports enhanced due diligence',
        'Proven track record in financial services',
        'API integration available',
      ],
    },
  });

  const match2 = await prisma.vendorMatch.create({
    data: {
      gapId: gap2.id,
      vendorId: vendor2.id,
      solutionId: solution2.id,
      matchScore: 85,
      matchReasons: [
        'Transaction monitoring capabilities',
        'Risk assessment expertise',
        'Enterprise-grade platform',
        'Customizable alerts',
      ],
    },
  });

  console.log('📄 Creating reports...');
  
  const report1 = await prisma.report.create({
    data: {
      assessmentId: assessment1.id,
      type: 'DETAILED',
      format: 'PDF',
      content: {
        executiveSummary: 'ACME Corporation shows moderate financial crime risk',
        riskScore: 68,
        keyFindings: [
          'Strong KYC processes in place',
          'Geographic risk exposure needs attention',
          'Enhanced monitoring recommended',
        ],
        gaps: 2,
        risks: 1,
        recommendations: 3,
      },
      summary: 'Detailed financial crime risk assessment showing moderate risk level with specific recommendations for improvement',
      pdfUrl: 'https://s3.amazonaws.com/reports/assessment_1_detailed.pdf',
    },
  });

  console.log('💰 Creating credit transactions...');
  
  await prisma.creditTransaction.create({
    data: {
      subscriptionId: subscription1.id,
      type: 'SUBSCRIPTION_RENEWAL',
      amount: 100,
      balance: 100,
      description: 'Monthly credit allocation - Premium plan',
      metadata: {
        plan: 'PREMIUM',
        period: 'monthly',
      },
    },
  });

  await prisma.creditTransaction.create({
    data: {
      subscriptionId: subscription1.id,
      type: 'ASSESSMENT',
      amount: -25,
      balance: 75,
      description: 'Credit used for Financial Crime Risk Assessment',
      assessmentId: assessment1.id,
      metadata: {
        assessmentType: 'FINANCIAL_CRIME',
      },
    },
  });

  console.log('📞 Creating vendor contacts...');
  
  await prisma.vendorContact.create({
    data: {
      vendorId: vendor1.id,
      userId: user1.id,
      organizationId: org1.id,
      type: 'DEMO_REQUEST',
      message: 'We would like to schedule a demo of ComplySafe KYC Pro for our team',
      requirements: {
        users: 50,
        volume: '1000 verifications/month',
        integration: 'API required',
      },
      budget: '€2,000 - €5,000 per month',
      timeline: '2-3 months',
      status: 'IN_PROGRESS',
    },
  });

  console.log('📋 Creating audit logs...');
  
  await prisma.auditLog.create({
    data: {
      userId: user1.id,
      action: 'assessment.completed',
      entity: 'Assessment',
      entityId: assessment1.id,
      newValues: {
        status: 'COMPLETED',
        riskScore: 68,
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      metadata: {
        assessmentType: 'FINANCIAL_CRIME',
        creditsUsed: 25,
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'vendor.approved',
      entity: 'Vendor',
      entityId: vendor1.id,
      oldValues: {
        status: 'PENDING',
      },
      newValues: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0 (macOS Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`
Created:
- 5 Users (1 admin, 2 regular users, 2 vendor users)
- 2 Organizations 
- 2 Subscriptions
- 2 Vendors with 2 Solutions
- 2 Assessment Templates with sections and questions
- 2 Assessments (1 completed, 1 in progress)
- 2 Gaps, 1 Risk, 2 Vendor Matches
- 1 Report
- 2 Credit Transactions
- 1 Vendor Contact
- 2 Audit Log entries

Test Users:
- Admin: admin@heliolus.com / Admin123!
- User 1: john.doe@acmecorp.com / Password123! (Premium subscription)
- User 2: jane.smith@techstart.com / Password123! (Free trial)
- Vendor 1: contact@complysafe.com / Vendor123!
- Vendor 2: info@riskguard.com / Vendor123!
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });