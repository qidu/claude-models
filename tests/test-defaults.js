#!/usr/bin/env node

console.log('=== Testing Defaults: System Prompt & Thinking ===\n');

console.log('In the updated module:');
console.log('\n1. SYSTEM PROMPT:');
console.log('   - ALWAYS included in test requests');
console.log('   - NOT optional for user');
console.log('   - Default content: "You are a helpful assistant. Respond with \'Test successful!\'"');
console.log('   - Purpose: Tests if model respects system prompts');

console.log('\n2. THINKING:');
console.log('   - ALWAYS allowed in responses');
console.log('   - NOT optional for user');
console.log('   - Some models include thinking content by default');
console.log('   - Module reports if thinking is present, but doesn\'t judge');

console.log('\n3. USER CHOICES:');
console.log('   - Streaming: User chooses (default: yes)');
console.log('   - Tool call: User chooses (default: no)');

console.log('\n4. TEST PAYLOAD STRUCTURE:');
const payloadWithDefaults = {
  model: "minimax/minimax-m2.5",
  max_tokens: 100,
  messages: [
    {
      role: "system",           // ← ALWAYS INCLUDED (default)
      content: "You are a helpful assistant. Respond with 'Test successful!'"
    },
    {
      role: "user",
      content: "Test API connectivity"
    }
    // Tool call message added only if user chooses it
  ]
  // stream: true if user chooses it
  // tools: [] if user chooses it
};

console.log(JSON.stringify(payloadWithDefaults, null, 2));

console.log('\n5. TEST LOGIC:');
console.log('   - Send request with above structure');
console.log('   - Check for 200 OK response');
console.log('   - Report what was received');
console.log('   - Only fail on non-200 status');
console.log('   - Never judge content correctness');

console.log('\n6. EXAMPLE USER INTERACTION:');
console.log('   Q: Use streaming? (y/n) [y]: y');
console.log('   Q: Include tool call? (y/n) [n]: n');
console.log('   → System prompt: ALWAYS included (no prompt)');
console.log('   → Thinking: ALWAYS allowed (no prompt)');

console.log('\n7. RESULT:');
console.log('   - Test includes system prompt by default');
console.log('   - Test allows thinking by default');
console.log('   - User controls streaming and tool call');
console.log('   - Only HTTP status matters for pass/fail');

console.log('\nThis ensures:');
console.log('✅ Consistent test structure (always has system prompt)');
console.log('✅ Realistic testing (thinking is normal for some models)');
console.log('✅ User flexibility (control streaming and tool calls)');
console.log('✅ Simple pass/fail (only non-200 fails)');