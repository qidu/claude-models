#!/usr/bin/env node

import axios from 'axios';

console.log('=== Testing API Response Body ===\n');

// Configuration from claude-models.txt
const config = {
  baseUrl: 'https://api.qnaigc.com',
  authToken: 'sk-2dd63001b32cf7d9186be3d6673eedb3005a0dcfa6b0be1d00c6395173f4e348',
  model: 'minimax/minimax-m2.5',
  timeout: '600000'
};

console.log('Using configuration:');
console.log(`ANTHROPIC_BASE_URL=${config.baseUrl}`);
console.log(`ANTHROPIC_AUTH_TOKEN=***${config.authToken.slice(-32)}`);
console.log(`ANTHROPIC_MODEL=${config.model}`);
console.log(`API_TIMEOUT_MS=${config.timeout}`);

const testPayload = {
  model: config.model,
  max_tokens: 100,
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant. Respond with 'Configuration test successful!'"
    },
    {
      role: "user",
      content: "Test message to verify API connectivity"
    }
  ],
  stream: false  // Use non-streaming to get complete response
};

console.log('\n=== Request Details ===');
console.log(`URL: ${config.baseUrl}/v1/messages`);
console.log('Method: POST');
console.log('Headers:');
console.log('  Content-Type: application/json');
console.log(`  Authorization: Bearer ***${config.authToken.slice(-32)}`);
console.log('  anthropic-version: 2023-06-01');

console.log('\nRequest Body:');
console.log(JSON.stringify(testPayload, null, 2));

console.log('\n=== Making API Call ===');

try {
  const response = await axios.post(
    `${config.baseUrl}/v1/messages`,
    testPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`,
        'anthropic-version': '2023-06-01'
      },
      timeout: parseInt(config.timeout)
    }
  );

  console.log('\n=== Response Received ===');
  console.log(`Status: ${response.status} ${response.statusText}`);
  
  console.log('\nResponse Headers:');
  Object.keys(response.headers).forEach(key => {
    console.log(`  ${key}: ${response.headers[key]}`);
  });

  console.log('\nFull Response Body:');
  console.log(JSON.stringify(response.data, null, 2));

  console.log('\n=== Analysis ===');
  
  if (response.data.content && response.data.content[0] && response.data.content[0].text) {
    const responseText = response.data.content[0].text;
    console.log(`Extracted text: "${responseText}"`);
    
    if (responseText.includes('Configuration test successful!')) {
      console.log('✅ Response matches expected message');
    } else {
      console.log('⚠️ Response received but not the expected message');
      console.log(`Expected: "Configuration test successful!"`);
      console.log(`Got: "${responseText}"`);
    }
  } else {
    console.log('⚠️ Response structure unexpected');
    console.log('Expected format: { content: [{ text: "..." }] }');
  }

} catch (error) {
  console.log('\n=== Error Response ===');
  
  if (error.response) {
    console.log(`Status: ${error.response.status} ${error.response.statusText}`);
    console.log('\nError Response Headers:');
    Object.keys(error.response.headers).forEach(key => {
      console.log(`  ${key}: ${error.response.headers[key]}`);
    });
    
    console.log('\nError Response Body:');
    if (typeof error.response.data === 'string') {
      console.log(error.response.data);
    } else {
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('\nError Analysis:');
    if (error.response.status === 401) {
      console.log('❌ Authentication failed (invalid token)');
    } else if (error.response.status === 404) {
      console.log('❌ Endpoint not found (wrong URL)');
    } else if (error.response.status === 429) {
      console.log('❌ Rate limit exceeded');
    } else {
      console.log('❌ API error');
    }
    
  } else if (error.request) {
    console.log('❌ No response received');
    console.log(`Error: ${error.message}`);
    console.log('Possible issues:');
    console.log('  - Network connectivity');
    console.log('  - DNS resolution');
    console.log('  - Firewall blocking');
    
  } else {
    console.log('❌ Request setup error');
    console.log(`Error: ${error.message}`);
  }
}

console.log('\n=== Common Response Patterns ===');
console.log('1. Success response:');
console.log('```json');
console.log(`{
  "id": "msg_123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Configuration test successful!"
    }
  ],
  "model": "${config.model}"
}`);
console.log('```');

console.log('\n2. Different greeting (ignored system prompt):');
console.log('```json');
console.log(`{
  "content": [
    {
      "type": "text",
      "text": "Hello! How can I help you today?"
    }
  ]
}`);
console.log('```');

console.log('\n3. API error response:');
console.log('```json');
console.log(`{
  "error": {
    "type": "invalid_request_error",
    "message": "Invalid API key"
  }
}`);
console.log('```');

console.log('\n4. Model not found:');
console.log('```json');
console.log(`{
  "error": {
    "type": "model_not_found",
    "message": "Model '${config.model}' not found"
  }
}`);
console.log('```');