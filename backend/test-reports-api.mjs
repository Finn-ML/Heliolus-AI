import fetch from 'node-fetch';

async function testReportsAPI() {
  try {
    // Use the test user token
    const testUserId = 'test-user-id';
    const testOrgId = 'cmgjfhato0001qdjgtxd3cr1b';

    // Create a JWT token manually for testing (matching the auth middleware)
    const jwt = (await import('jsonwebtoken')).default;
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

    console.log('Testing GET /v1/assessments endpoint...\n');

    const response = await fetch('http://localhost:8543/v1/assessments?limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\nResponse structure:');
    console.log('- Has data field:', 'data' in data);
    console.log('- Has pagination field:', 'pagination' in data);

    if (data.data) {
      console.log('\nAssessments array length:', data.data.length);

      if (data.data.length > 0) {
        console.log('\nFirst assessment structure:');
        const first = data.data[0];
        console.log('- id:', first.id);
        console.log('- status:', first.status);
        console.log('- riskScore:', first.riskScore);
        console.log('- template:', first.template ? 'YES' : 'NO');
        console.log('- gaps:', first.gaps ? `${first.gaps.length} items` : 'NO');
        console.log('- risks:', first.risks ? `${first.risks.length} items` : 'NO');
        console.log('- completedAt:', first.completedAt);
        console.log('- updatedAt:', first.updatedAt);

        if (first.template) {
          console.log('\nTemplate details:');
          console.log('  - id:', first.template.id);
          console.log('  - name:', first.template.name);
          console.log('  - category:', first.template.category);
        }

        console.log('\nAll assessments by status:');
        const byStatus = data.data.reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {});
        Object.entries(byStatus).forEach(([status, count]) => {
          console.log(`  ${status}: ${count}`);
        });
      }
    }

    if (data.pagination) {
      console.log('\nPagination:');
      console.log('- total:', data.pagination.total);
      console.log('- page:', data.pagination.page);
      console.log('- limit:', data.pagination.limit);
      console.log('- totalPages:', data.pagination.totalPages);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

testReportsAPI();
