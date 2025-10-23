const https = require('https');

const apiKey = process.env.OPENAI_API_KEY;

console.log('API Key details:');
console.log('- Length:', apiKey ? apiKey.length : 'undefined');
console.log('- Starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
console.log('- Ends with:', apiKey ? '...' + apiKey.substring(apiKey.length - 5) : 'undefined');
console.log('- Has newlines:', apiKey ? apiKey.includes('\n') : 'undefined');
console.log('- Has spaces:', apiKey ? apiKey.includes(' ') : 'undefined');

// Test the API key
const options = {
  hostname: 'api.openai.com',
  path: '/v1/models',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log('\nAPI Response Status:', res.statusCode);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅ API key is valid!');
      } else {
        console.log('❌ API key error:', parsed.error?.message || 'Unknown error');
      }
    } catch (e) {
      console.log('Response:', data.substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();