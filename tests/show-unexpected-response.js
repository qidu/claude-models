#!/usr/bin/env node

console.log('=== DEMO: "Response received but not the expected message" ===\n');

console.log('Scenario: The API responds, but not with the exact expected text.\n');

console.log('REQUEST SENT:');
console.log('-------------');
console.log('POST https://api.qnaigc.com/v1/messages');
console.log('Headers:');
console.log('  Authorization: Bearer ***3f4e348');
console.log('  anthropic-version: 2023-06-01');
console.log('\nBody:');
console.log(JSON.stringify({
  model: "minimax/minimax-m2.5",
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
}, null, 2));

console.log('\n\nACTUAL RESPONSE RECEIVED:');
console.log('------------------------');
console.log('HTTP/1.1 200 OK');
console.log('Content-Type: text/event-stream');
console.log('Transfer-Encoding: chunked');
console.log('\nStreaming data:');
console.log('data: {"type":"message_start","message":{"id":"msg_abc123","type":"message","role":"assistant","content":[],"model":"minimax/minimax-m2.5","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":25,"output_tokens":0}}}');
console.log('data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}');
console.log('data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}');
console.log('data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"! I"}}');
console.log('data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"\'m here"}}');
console.log('data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" to help"}}');
console.log('data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"."}}');
console.log('data: {"type":"content_block_stop","index":0}');
console.log('data: {"type":"message_stop"}');
console.log('data: [DONE]');

console.log('\n\nMODULE ANALYSIS:');
console.log('----------------');
console.log('Extracted response text: "Hello! I\'m here to help."');
console.log('Expected text: "Configuration test successful!"');
console.log('\n⚠️ Response received but not the expected message');
console.log('\nThe module would show:');
console.log('1. Full request details (URL, headers, body)');
console.log('2. Actual response received');
console.log('3. Comparison: Expected vs Got');
console.log('4. Debugging suggestions');

console.log('\n\nUSER PROMPT:');
console.log('------------');
console.log('The API responded, but not with the expected message.');
console.log('This could mean:');
console.log('  1. The API is working but system prompt wasn\'t followed');
console.log('  2. Different model behavior');
console.log('  3. API endpoint differences');
console.log('\nWould you like to:');
console.log('  1. Continue with this configuration');
console.log('  2. Try different configuration');
console.log('  3. Exit');

console.log('\n\nREAL-WORLD EXAMPLES:');
console.log('-------------------');
console.log('1. Model ignores system prompt:');
console.log('   Response: "Hi there! How can I assist you?"');
console.log('   Action: Try a different model or adjust prompt');

console.log('\n2. API returns error but 200 OK:');
console.log('   Response: {"error": "Invalid model"}');
console.log('   Action: Check model name compatibility');

console.log('\n3. Proxy modifies response:');
console.log('   Response: "Welcome to our API service..."');
console.log('   Action: Check if using correct endpoint');

console.log('\n\nThe module handles this gracefully by:');
console.log('✅ Showing exact request/response for debugging');
console.log('✅ Allowing user to continue if API is working');
console.log('✅ Providing clear comparison of expected vs actual');
console.log('✅ Offering retry with different configuration');