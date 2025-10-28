import { PrismaClient } from './src/generated/prisma/index.js';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
const { sign } = jwt;

const prisma = new PrismaClient();

async function testRFPHTTP() {
  try {
    const assessmentId = 'cmhanasgy00c3qmmuwf8shscq';

    // Get assessment and user
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { user: true }
    });

    if (!assessment) {
      console.log('Assessment not found');
      return;
    }

    // Create JWT token for the user
    const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-do-not-use-in-production-123456789';
    const token = sign(
      {
        userId: assessment.userId,
        role: 'USER',
        organizationId: assessment.user.organizationId
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Testing RFP Requirements HTTP endpoint...\n');
    console.log(`Assessment ID: ${assessmentId}`);
    console.log(`User: ${assessment.user.email}\n`);

    const response = await fetch(
      `http://localhost:8543/v1/assessments/${assessmentId}/rfp-requirements`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Response Status: ${response.status}\n`);

    const data = await response.json();
    console.log('=== API RESPONSE ===\n');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.data?.formattedRequirements) {
      console.log('\n=== FORMATTED REQUIREMENTS ===\n');
      console.log(data.data.formattedRequirements);
      console.log('\n=== END ===\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRFPHTTP();
