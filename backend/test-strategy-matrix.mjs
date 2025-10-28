import { PrismaClient } from './src/generated/prisma/index.js';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
const { sign } = jwt;

const prisma = new PrismaClient();

async function testStrategyMatrix() {
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

    console.log('Testing Strategy Matrix endpoint...\n');
    console.log(`Assessment ID: ${assessmentId}\n`);

    const response = await fetch(
      `http://localhost:8543/v1/assessments/${assessmentId}/strategy-matrix`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Response Status: ${response.status}\n`);

    const data = await response.json();
    console.log('=== STRATEGY MATRIX DATA ===\n');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.data) {
      const matrix = data.data;
      console.log('\n=== BUDGET DATA ===\n');
      console.log('Immediate bucket cost:', matrix.immediate?.estimatedCostRange || 'N/A');
      console.log('Near-term bucket cost:', matrix.nearTerm?.estimatedCostRange || 'N/A');
      console.log('Strategic bucket cost:', matrix.strategic?.estimatedCostRange || 'N/A');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testStrategyMatrix();
