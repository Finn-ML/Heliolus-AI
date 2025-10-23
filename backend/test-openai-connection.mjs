import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

async function testOpenAI() {
  try {
    console.log('Testing OpenAI Connection...\n');

    const apiKey = process.env.OPENAI_API_KEY;
    console.log(`API Key configured: ${apiKey ? 'Yes' : 'No'}`);
    console.log(`API Key length: ${apiKey?.length || 0}`);
    console.log(`API Key starts with 'sk-': ${apiKey?.startsWith('sk-') ? 'Yes' : 'No'}\n`);

    if (!apiKey) {
      console.log('❌ No OpenAI API key found');
      return;
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    console.log('Testing API call...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Say "test successful" if you receive this.' }],
      max_tokens: 50,
    });

    console.log('✅ OpenAI API test successful!');
    console.log(`Response: ${response.choices[0].message.content}`);
    console.log(`Model: ${response.model}`);
    console.log(`Tokens used: ${response.usage.total_tokens}`);

  } catch (error) {
    console.error('❌ OpenAI API test failed:');
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status: ${error.status}`);
    }
    if (error.code) {
      console.error(`Code: ${error.code}`);
    }
  }
}

testOpenAI();
