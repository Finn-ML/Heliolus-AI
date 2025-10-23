import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

async function testSpecificCompleted() {
  try {
    const testUserId = 'test-user-id';
    const testOrgId = 'cmgjfhato0001qdjgtxd3cr1b';
    const JWT_SECRET = process.env.JWT_SECRET || 'heliolus-dev-secret-key-2024';

    const token = jwt.sign(
      {
        id: testUserId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        organizationId: testOrgId,
        emailVerified: true,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Fetch the list to find COMPLETED assessments
    const listResponse = await fetch('http://localhost:8543/v1/assessments?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const listData = await listResponse.json();
    const completed = listData.data.filter(a => a.status === 'COMPLETED');

    console.log(`Found ${completed.length} COMPLETED assessments in list response\n`);

    if (completed.length > 0) {
      const first = completed[0];
      console.log('First COMPLETED assessment from list:');
      console.log('  ID:', first.id);
      console.log('  Status:', first.status);
      console.log('  Risk Score:', first.riskScore);
      console.log('  Template:', first.template ? 'YES' : 'NO');
      if (first.template) {
        console.log('    Name:', first.template.name);
      }
      console.log('  Gaps:', first.gaps ? `${first.gaps.length} items` : 'NO');
      if (first.gaps && first.gaps.length > 0) {
        console.log('    First gap:', first.gaps[0]);
      }
      console.log('  Risks:', first.risks ? `${first.risks.length} items` : 'NO\n');
    } else {
      console.log('No COMPLETED assessments found in list response!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSpecificCompleted();
