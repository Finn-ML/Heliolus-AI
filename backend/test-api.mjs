import fetch from 'node-fetch';

async function testDocumentAPI() {
  try {
    // Get test token
    const tokenResponse = await fetch('http://localhost:8543/v1/test-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const { token } = await tokenResponse.json();

    // Get documents
    const docsResponse = await fetch('http://localhost:8543/v1/organizations/cmgjfhato0001qdjgtxd3cr1b/documents', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const docsData = await docsResponse.json();

    console.log('API Response Structure:');
    console.log(JSON.stringify(docsData, null, 2).substring(0, 2000));

    console.log('\n\nFirst document evidenceTier:', docsData?.data?.[0]?.evidenceTier);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDocumentAPI();
