import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
const { sign } = jwt;

async function testGetRFPs() {
  try {
    const userId = 'cmh0oe6890000o03xb8rza882';
    const organizationId = 'cmh0oe6ai0002o03xy1inmstg';

    const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-do-not-use-in-production-123456789';

    const token = sign(
      {
        userId: userId,
        id: userId,
        role: 'USER',
        organizationId: organizationId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('\n🔑 Testing GET /v1/rfps endpoint\n');

    const response = await fetch('http://localhost:8543/v1/rfps', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (response.ok) {
      console.log('✅ RFPs retrieved successfully!');
      console.log('\n📋 Response Structure:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Failed to retrieve RFPs');
      console.log('\n📄 Error Response:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGetRFPs();
