import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
const { sign } = jwt;

async function testRFPCreation() {
  try {
    // Use the premium John Doe user
    const userId = 'cmh0oe6890000o03xb8rza882';
    const organizationId = 'cmh0oe6ai0002o03xy1inmstg';

    const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-do-not-use-in-production-123456789';

    const token = sign(
      {
        userId: userId,
        id: userId, // Include both for compatibility
        role: 'USER',
        organizationId: organizationId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('\n🔑 Generated token for John Doe (Premium user)');
    console.log(`📧 User ID: ${userId}`);
    console.log(`🏢 Organization ID: ${organizationId}\n`);

    const rfpData = {
      organizationId: organizationId,
      title: 'Test RFP - Document Attachments',
      objectives: 'Testing RFP creation with document attachments',
      requirements: 'Basic compliance requirements for testing',
      timeline: '3-6 months',
      budget: '€50K-€100K',
      vendorIds: ['test-vendor-1'], // Mock vendor ID
      documents: [] // Empty documents array
    };

    console.log('📤 Sending RFP creation request...\n');

    const response = await fetch('http://localhost:8543/v1/rfps', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rfpData)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (response.ok) {
      console.log('✅ RFP created successfully!');
      console.log('\n📋 RFP Details:');
      console.log(`   ID: ${data.data?.id}`);
      console.log(`   Title: ${data.data?.title}`);
      console.log(`   Status: ${data.data?.status}`);
      console.log(`   Created: ${data.data?.createdAt}`);
    } else {
      console.log('❌ RFP creation failed');
      console.log('\n📄 Error Response:');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRFPCreation();
