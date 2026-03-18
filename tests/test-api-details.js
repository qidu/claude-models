#!/usr/bin/env node

console.log('=== API Test Request/Response Details ===\n');

// Simulate the exact request that would be sent
const baseUrl = 'https://api.qnaigc.com';
const authToken = 'sk-2dd63001b32cf7d9***';
const model = 'minimax/minimax-m2.5';

console.log('REQUEST DETAILS:');
console.log('================');
console.log(`URL: ${baseUrl}/v1/messages`);
console.log('Method: POST');
console.log('Headers:');
console.log('  Content-Type: application/json');
console.log(`  Authorization: Bearer ***${authToken.slice(-32)}`);
console.log('  anthropic-version: 2023-06-01');
console.log('  x-api-key: (if required by proxy)');

const testPayload = {
  model: model,
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

console.log('\nRequest Body:');
console.log(JSON.stringify(testPayload, null, 2));

console.log('\n\nEXPECTED RESPONSE FORMAT:');
console.log('========================');
console.log('Streaming response (SSE format):');
console.log('data: {"type":"message_start","message":{"id":"msg_123","type":"message","role":"assistant","content":[],"model":"claude-3-5-sonnet-20241022","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":25,"output_tokens":0}}}');
console.log('data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}');
console.log('data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Configuration test successful!"}}');
console.log('data: {"type":"content_block_stop","index":0}');
console.log('data: {"type":"message_stop"}');
console.log('data: [DONE]');

console.log('\n\nPOSSIBLE "UNEXPECTED MESSAGE" SCENARIOS:');
console.log('======================================');
console.log('1. Different greeting:');
console.log('   Response: "Hello! How can I help you today?"');
console.log('   Reason: Model ignored system prompt');

console.log('\n2. API error:');
console.log('   Response: {"error":{"type":"invalid_request_error","message":"Invalid API key"}}');
console.log('   Reason: Authentication failed');

console.log('\n3. Wrong endpoint:');
console.log('   Response: 404 Not Found');
console.log('   Reason: Incorrect API URL');

console.log('\n4. Rate limiting:');
console.log('   Response: {"error":{"type":"rate_limit_error","message":"Rate limit exceeded"}}');
console.log('   Reason: Too many requests');

console.log('\n5. Model not available:');
console.log('   Response: {"error":{"type":"model_not_found","message":"Model not found"}}');
console.log('   Reason: Invalid model name');

console.log('\n\nDEBUGGING STEPS:');
console.log('================');
console.log('1. Check if the API endpoint is correct');
console.log('2. Verify the API key/token is valid');
console.log('3. Ensure the model name is correct for the provider');
console.log('4. Check network connectivity and firewall settings');
console.log('5. Try without streaming to see full error response');
console.log('6. Test with curl to verify API works:');
console.log('');
console.log(`curl -X POST ${baseUrl}/v1/messages \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log(`  -H "Authorization: Bearer ${authToken}" \\`);
console.log('  -H "anthropic-version: 2023-06-01" \\');
console.log(`  -d \'${JSON.stringify({...testPayload, stream: false})}\'`);

console.log('\n\nThe module handles these cases by:');
console.log('1. Showing the full request details');
console.log('2. Displaying the actual response received');
console.log('3. Comparing expected vs actual response');
console.log('4. Asking user whether to continue or retry');
console.log('5. Providing debugging information');