#!/usr/bin/env node

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in environment');
  process.exit(1);
}

console.log('✓ API Key found (length:', apiKey.length, ')');
console.log('✓ Key prefix:', apiKey.substring(0, 15) + '...');
console.log('\n🔍 Testing API key with OpenAI...\n');

const testRequest = async () => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! API key is valid');
      console.log('✅ Model: gpt-4o-mini is accessible');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED! Status:', response.status);
      console.log('Error:', JSON.stringify(data, null, 2));

      if (response.status === 401) {
        console.log('\n⚠️  401 Unauthorized - API key is INVALID or EXPIRED');
        console.log('Please generate a new key at: https://platform.openai.com/api-keys');
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

testRequest();
