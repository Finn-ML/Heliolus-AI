#!/usr/bin/env tsx

/**
 * Schema validation script
 * Tests database connection and validates all models
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function validateSchema() {
  console.log('🔍 Validating database schema and connection...\n');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test all models by counting records
    const validations = [
      { name: 'Users', query: prisma.user.count() },
      { name: 'Organizations', query: prisma.organization.count() },
      { name: 'Documents', query: prisma.document.count() },
      { name: 'Assessments', query: prisma.assessment.count() },
      { name: 'Gaps', query: prisma.gap.count() },
      { name: 'Risks', query: prisma.risk.count() },
      { name: 'Templates', query: prisma.template.count() },
      { name: 'Template Sections', query: prisma.templateSection.count() },
      { name: 'Template Questions', query: prisma.templateQuestion.count() },
      { name: 'Vendors', query: prisma.vendor.count() },
      { name: 'Solutions', query: prisma.solution.count() },
      { name: 'Vendor Matches', query: prisma.vendorMatch.count() },
      { name: 'Subscriptions', query: prisma.subscription.count() },
      { name: 'Invoices', query: prisma.invoice.count() },
      { name: 'Credit Transactions', query: prisma.creditTransaction.count() },
      { name: 'Reports', query: prisma.report.count() },
      { name: 'Vendor Contacts', query: prisma.vendorContact.count() },
      { name: 'Audit Logs', query: prisma.auditLog.count() },
    ];

    const results = await Promise.all(validations.map(async (v) => {
      try {
        const count = await v.query;
        return { name: v.name, count, status: 'success' };
      } catch (error) {
        return { name: v.name, count: 0, status: 'error', error: error.message };
      }
    }));

    console.log('\n📊 Model Validation Results:');
    console.log('================================');
    
    let totalRecords = 0;
    let errors = 0;

    results.forEach(result => {
      const status = result.status === 'success' ? '✅' : '❌';
      const count = result.count.toString().padStart(3);
      console.log(`${status} ${result.name.padEnd(20)} ${count} records`);
      
      if (result.status === 'success') {
        totalRecords += result.count;
      } else {
        errors++;
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('================================');
    console.log(`📈 Total Records: ${totalRecords}`);
    console.log(`❌ Errors: ${errors}`);

    // Test relationships
    console.log('\n🔗 Testing Relationships:');
    console.log('=========================');

    // Test User -> Organization relationship
    const userWithOrg = await prisma.user.findFirst({
      include: { organization: true }
    });
    console.log(`✅ User -> Organization: ${userWithOrg?.organization ? 'Working' : 'No data'}`);

    // Test Assessment -> Gaps relationship
    const assessmentWithGaps = await prisma.assessment.findFirst({
      include: { gaps: true }
    });
    console.log(`✅ Assessment -> Gaps: ${assessmentWithGaps?.gaps.length > 0 ? 'Working' : 'No data'}`);

    // Test Vendor -> Solutions relationship
    const vendorWithSolutions = await prisma.vendor.findFirst({
      include: { solutions: true }
    });
    console.log(`✅ Vendor -> Solutions: ${vendorWithSolutions?.solutions.length > 0 ? 'Working' : 'No data'}`);

    // Test complex query with multiple joins
    const complexQuery = await prisma.assessment.findMany({
      include: {
        organization: true,
        user: true,
        template: true,
        gaps: {
          include: {
            vendorMatches: {
              include: {
                vendor: true,
                solution: true
              }
            }
          }
        }
      },
      take: 1
    });
    console.log(`✅ Complex joins: ${complexQuery.length > 0 ? 'Working' : 'No data'}`);

    // Test enums
    console.log('\n🏷️ Testing Enums:');
    console.log('=================');
    
    const userRoles = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });
    userRoles.forEach(group => {
      console.log(`✅ UserRole.${group.role}: ${group._count.role} users`);
    });

    const assessmentStatuses = await prisma.assessment.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    assessmentStatuses.forEach(group => {
      console.log(`✅ AssessmentStatus.${group.status}: ${group._count.status} assessments`);
    });

    if (errors === 0) {
      console.log('\n🎉 All validations passed! Schema is working correctly.');
    } else {
      console.log(`\n⚠️ Validation completed with ${errors} errors.`);
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
validateSchema().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});