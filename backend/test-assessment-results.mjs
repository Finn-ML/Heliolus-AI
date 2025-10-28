import { PrismaClient } from './src/generated/prisma/index.js';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
const { sign } = jwt;

const prisma = new PrismaClient();

async function testResults() {
  try {
    const assessmentId = 'cmhanasgy00c3qmmuwf8shscq';

    // Get assessment
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { user: true }
    });

    if (!assessment) {
      console.log('Assessment not found');
      return;
    }

    // Create JWT token
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

    console.log('Testing Assessment Results endpoint...\n');

    const response = await fetch(
      `http://localhost:8543/v1/assessments/${assessmentId}/results`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Response Status: ${response.status}\n`);

    const data = await response.json();

    if (data.success && data.data) {
      const results = data.data;
      console.log('=== ASSESSMENT RESULTS ===\n');
      console.log(`Assessment ID: ${results.assessment?.id}`);
      console.log(`Risk Score: ${results.riskScore}`);
      console.log(`Status: ${results.assessment?.status}`);
      console.log(`Gaps Count: ${results.gaps?.length || 0}`);
      console.log(`Risks Count: ${results.risks?.length || 0}`);
      console.log('\nFull Response:');
      console.log(JSON.stringify(data, null, 2).substring(0, 1000) + '...');
    } else {
      console.log('Full Response:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testResults();
