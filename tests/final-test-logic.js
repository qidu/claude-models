#!/usr/bin/env node

import axios from 'axios';

console.log('=== Final Test: Check Response Format, Only non-200 is Wrong ===\n');

// Real test with actual API
const config = {
  baseUrl: 'https://api.qnaigc.com',
  authToken: 'sk-2dd63001b32cf7d9***',
  model: 'minimax/minimax-m2.5',
  timeout: 10000
};

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
  stream: true
};

console.log('Request Details:');
console.log(`URL: ${config.baseUrl}/v1/messages`);
console.log(`Streaming: ${testPayload.stream}`);
console.log(`System prompt: "${testPayload.messages[0].content}"`);
console.log(`User prompt: "${testPayload.messages[1].content}"`);

console.log('\nMaking API call...\n');

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
      timeout: config.timeout,
      responseType: 'stream'
    }
  );

  console.log(`✅ Status: ${response.status} ${response.statusText}`);
  console.log('\nResponse analysis:');
  
  let responseText = '';
  let hasThinking = false;
  let hasText = false;
  let chunkCount = 0;
  
  response.data.on('data', (chunk) => {
    chunkCount++;
    const chunkStr = chunk.toString();
    
    // Check for thinking content
    if (chunkStr.includes('thinking') || chunkStr.includes('thinking_delta')) {
      hasThinking = true;
    }
    
    // Parse SSE for text content
    const lines = chunkStr.split('\n');
    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              responseText += parsed.delta.text;
              hasText = true;
            }
          } catch (e) {
            // Not JSON
          }
        }
      }
    });
  });
  
  await new Promise((resolve, reject) => {
    response.data.on('end', () => {
      console.log(`  - Chunks received: ${chunkCount}`);
      console.log(`  - Contains thinking: ${hasThinking ? 'Yes' : 'No'}`);
      console.log(`  - Contains text: ${hasText ? 'Yes' : 'No'}`);
      console.log(`  - Response length: ${responseText.length} characters`);
      console.log(`  - Response preview: "${responseText.substring(0, 100)}..."`);
      
      console.log('\n✅ RESULT: SUCCESS');
      console.log('Reason: Received 200 OK response');
      console.log('\nThe API:');
      console.log('  - Accepts the endpoint URL');
      console.log('  - Accepts the authentication token');
      console.log('  - Accepts the model name');
      console.log('  - Returns streaming response');
      console.log('  - Follows Anthropic-compatible format');
      
      console.log('\nNote: We do NOT judge if:');
      console.log('  - System prompt was followed');
      console.log('  - Response matches expected text');
      console.log('  - Thinking content is present');
      console.log('  - Streaming worked perfectly');
      
      console.log('\nOnly non-200 status codes are treated as failures.');
      resolve();
    });
    
    response.data.on('error', reject);
  });
  
} catch (error) {
  console.log('\n❌ Error occurred:');
  
  if (error.response) {
    if (error.response.status !== 200) {
      console.log(`❌ RESULT: FAILED`);
      console.log(`Reason: ${error.response.status} ${error.response.statusText}`);
      console.log('\nThe API returned an error status.');
      console.log('This could mean:');
      console.log('  - Invalid authentication (401)');
      console.log('  - Wrong endpoint (404)');
      console.log('  - Rate limiting (429)');
      console.log('  - Server error (5xx)');
    } else {
      console.log('✅ RESULT: SUCCESS (with parsing issue)');
      console.log('Reason: Received 200 OK but axios threw error');
      console.log('\nThe API endpoint is reachable and returns 200.');
      console.log('The issue might be with streaming parsing or network.');
    }
  } else if (error.request) {
    console.log('❌ RESULT: FAILED');
    console.log('Reason: No response received');
    console.log('\nThis could mean:');
    console.log('  - Network connectivity issue');
    console.log('  - DNS resolution problem');
    console.log('  - Firewall blocking the request');
    console.log('  - Wrong URL or port');
  } else {
    console.log('❌ RESULT: FAILED');
    console.log(`Reason: ${error.message}`);
    console.log('\nThis is a setup error, not an API error.');
    console.log('Check your configuration.');
  }
}

console.log('\n' + '='.repeat(60));
console.log('MODULE BEHAVIOR SUMMARY:');
console.log('='.repeat(60));
console.log('\nThe module now behaves like this:');
console.log('\n1. Makes request with specified format:');
console.log('   - Uses streaming if requested');
console.log('   - Sends system prompt');
console.log('   - Sends user prompt');
console.log('   - Uses specified timeout');

console.log('\n2. Checks response:');
console.log('   - ✅ SUCCESS if 200 OK (any content, even empty)');
console.log('   - ❌ FAILURE if non-200 status');
console.log('   - ❌ FAILURE if no response');
console.log('   - ❌ FAILURE if setup error');

console.log('\n3. Reports analysis (not judgment):');
console.log('   - Whether response contains thinking');
console.log('   - Whether response contains text');
console.log('   - Response length and preview');
console.log('   - Chunks received (for streaming)');

console.log('\n4. Does NOT judge:');
console.log('   - Whether system prompt was followed');
console.log('   - Whether response matches expected text');
console.log('   - Whether thinking is "correct"');
console.log('   - Whether streaming is "perfect"');

console.log('\nThis approach is more robust because:');
console.log('✅ Different models behave differently');
console.log('✅ Some models ignore system prompts');
console.log('✅ Some models include thinking, some don\'t');
console.log('✅ As long as API works, configuration is valid');