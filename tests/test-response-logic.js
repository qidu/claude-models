#!/usr/bin/env node

import axios from 'axios';

console.log('=== Testing Response Logic: Only non-200 is wrong ===\n');

// Test cases
const testCases = [
  {
    name: 'Case 1: 200 OK with response',
    simulate: async () => {
      return { status: 200, data: 'Streaming response with thinking content' };
    }
  },
  {
    name: 'Case 2: 200 OK but empty',
    simulate: async () => {
      return { status: 200, data: '' };
    }
  },
  {
    name: 'Case 3: 401 Unauthorized',
    simulate: async () => {
      throw { response: { status: 401, statusText: 'Unauthorized', data: { error: 'Invalid token' } } };
    }
  },
  {
    name: 'Case 4: 404 Not Found',
    simulate: async () => {
      throw { response: { status: 404, statusText: 'Not Found', data: { error: 'Endpoint not found' } } };
    }
  },
  {
    name: 'Case 5: Network error',
    simulate: async () => {
      throw { request: true, message: 'Network error' };
    }
  },
  {
    name: 'Case 6: Setup error',
    simulate: async () => {
      throw { message: 'Invalid configuration' };
    }
  }
];

for (const testCase of testCases) {
  console.log(`\n${testCase.name}:`);
  console.log('-'.repeat(50));
  
  try {
    const result = await testCase.simulate();
    
    if (result.status === 200) {
      console.log('✅ Result: SUCCESS (200 OK)');
      console.log(`  Response: "${result.data || 'Empty'}"`);
      console.log('  Analysis: API is working, regardless of content');
    } else {
      console.log(`❌ Result: FAILED (${result.status} ${result.statusText})`);
    }
    
  } catch (error) {
    if (error.response) {
      if (error.response.status !== 200) {
        console.log(`❌ Result: FAILED (${error.response.status} ${error.response.statusText})`);
        console.log(`  Error: ${JSON.stringify(error.response.data)}`);
      } else {
        console.log('✅ Result: SUCCESS (200 OK with error object)');
        console.log('  Analysis: API returned 200, parsing issue but API works');
      }
    } else if (error.request) {
      console.log('❌ Result: FAILED (No response)');
      console.log(`  Error: ${error.message}`);
    } else {
      console.log('❌ Result: FAILED (Setup error)');
      console.log(`  Error: ${error.message}`);
    }
  }
}

console.log('\n' + '='.repeat(50));
console.log('LOGIC SUMMARY:');
console.log('='.repeat(50));
console.log('\n✅ SUCCESS if:');
console.log('  - 200 OK with any content (even empty)');
console.log('  - 200 OK with error in axios (parsing issue)');
console.log('  - Response follows stream/thinking format (just report, don\'t judge)');

console.log('\n❌ FAILURE if:');
console.log('  - Non-200 status (401, 404, 429, 500, etc.)');
console.log('  - No response received (network error)');
console.log('  - Request setup error (invalid config)');

console.log('\nNOT JUDGED:');
console.log('  - Whether system prompt was followed');
console.log('  - Whether response contains "thinking"');
console.log('  - Whether response matches expected text');
console.log('  - Whether streaming worked perfectly');

console.log('\nEXAMPLE SCENARIOS:');
console.log('1. 200 OK with "Connection verified!" → ✅ SUCCESS');
console.log('2. 200 OK with "Hello world" → ✅ SUCCESS');
console.log('3. 200 OK with empty response → ✅ SUCCESS (API works)');
console.log('4. 401 Unauthorized → ❌ FAILURE');
console.log('5. 404 Not Found → ❌ FAILURE');
console.log('6. Network timeout → ❌ FAILURE');

console.log('\nThe module now:');
console.log('✅ Checks if response follows request format (stream, thinking, system)');
console.log('✅ Reports what was received vs what was requested');
console.log('✅ Only treats non-200 status as wrong');
console.log('✅ Allows any content in 200 response');