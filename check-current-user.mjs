#!/usr/bin/env node

/**
 * Check current user from /v1/auth/me endpoint
 */

import fetch from 'node-fetch';

async function checkCurrentUser() {
  console.log('=== Checking Current User ===\n');

  // Try to get token from localStorage simulation
  // In browser, check: localStorage.getItem('token')

  const token = process.env.TEST_TOKEN || null;

  if (!token) {
    console.log('No token found. Please provide token via TEST_TOKEN environment variable.');
    console.log('Or check your browser localStorage for the token.');
    return;
  }

  try {
    // Decode token to see what's in it
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid JWT token format');
      return;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('Token payload:', JSON.stringify(payload, null, 2));

    // Call /auth/me endpoint
    console.log('\nCalling /v1/auth/me...');
    const response = await fetch('http://localhost:3000/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`❌ Failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }

    const data = await response.json();
    console.log('\n/auth/me response:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCurrentUser();
