import dotenv from 'dotenv';

dotenv.config();

async function testAssessmentsAPI() {
  try {
    // Get user token from test or create one
    const loginResponse = await fetch('http://localhost:8543/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'simongarrad@gmail.com', // Or your test user email
        password: 'Test1234!' // Or your test password
      })
    });

    if (!loginResponse.ok) {
      console.log('Login failed:', loginResponse.status);
      const error = await loginResponse.text();
      console.log('Error:', error);
      return;
    }

    const { data: { token, user } } = await loginResponse.json();
    console.log('✅ Logged in as:', user.email);
    console.log('   Organization ID:', user.organizationId);

    // Test assessments endpoint
    console.log('\n📊 Fetching assessments...\n');
    const assessmentsResponse = await fetch('http://localhost:8543/v1/assessments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!assessmentsResponse.ok) {
      console.log('❌ Failed to fetch assessments:', assessmentsResponse.status);
      const error = await assessmentsResponse.json();
      console.log('Error:', JSON.stringify(error, null, 2));
      return;
    }

    const assessmentsData = await assessmentsResponse.json();
    const assessments = assessmentsData.data?.items || assessmentsData.data || [];

    console.log(`✅ Found ${assessments.length} assessments\n`);

    // Group by status
    const byStatus = assessments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    console.log('Status breakdown:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n=== First 5 Assessments ===\n');
    assessments.slice(0, 5).forEach((a, i) => {
      console.log(`${i + 1}. ${a.id}`);
      console.log(`   Template: ${a.template?.name || 'N/A'}`);
      console.log(`   Status: ${a.status}`);
      console.log(`   Risk Score: ${a.riskScore || 'N/A'}`);
      console.log(`   Gaps: ${a.gaps?.length || 0}`);
      console.log(`   Risks: ${a.risks?.length || 0}`);
      console.log(`   Completed At: ${a.completedAt || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testAssessmentsAPI();
