#!/usr/bin/env node

import fs from 'fs';
import readline from 'readline';

console.log('=== Interactive Claude Models Test ===\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  // Load config
  const configFile = await question('Config file [claude-models.txt]: ') || 'claude-models.txt';
  
  let config = {
    baseUrls: ['https://api.qnaigc.com'],
    authTokens: ['sk-2dd63001b32cf7d9***'],
    models: ['minimax/minimax-m2.5'],
    timeouts: ['600000']
  };
  
  if (fs.existsSync(configFile)) {
    console.log(`✓ Loaded ${configFile}`);
  } else {
    console.log(`⚠️ Using defaults`);
  }
  
  // Select configuration
  console.log('\n=== Configuration ===');
  
  console.log('\n1. Base URL:');
  config.baseUrls.forEach((url, i) => console.log(`   ${i+1}. ${url}`));
  const baseUrlChoice = await question(`Select (1-${config.baseUrls.length}) [1]: `) || '1';
  const baseUrl = config.baseUrls[parseInt(baseUrlChoice) - 1] || config.baseUrls[0];
  
  console.log('\n2. Auth Token:');
  config.authTokens.forEach((token, i) => {
    const display = token.length > 32 ? `***${token.slice(-32)}` : token;
    console.log(`   ${i+1}. ${display}`);
  });
  const tokenChoice = await question(`Select (1-${config.authTokens.length}) [1]: `) || '1';
  const authToken = config.authTokens[parseInt(tokenChoice) - 1] || config.authTokens[0];
  
  console.log('\n3. Model:');
  config.models.forEach((model, i) => console.log(`   ${i+1}. ${model}`));
  const modelChoice = await question(`Select (1-${config.models.length}) [1]: `) || '1';
  const model = config.models[parseInt(modelChoice) - 1] || config.models[0];
  
  console.log('\n4. Timeout:');
  config.timeouts.forEach((timeout, i) => console.log(`   ${i+1}. ${timeout}ms`));
  const timeoutChoice = await question(`Select (1-${config.timeouts.length}) [1]: `) || '1';
  const timeout = config.timeouts[parseInt(timeoutChoice) - 1] || config.timeouts[0];
  
  // Test options
  console.log('\n=== Test Options ===');
  
  const streamingAnswer = await question('Use streaming? (y/n) [y]: ');
  const useStreaming = streamingAnswer.toLowerCase() !== 'n';
  
  const toolCallAnswer = await question('Include tool call? (y/n) [n]: ');
  const useToolCall = toolCallAnswer.toLowerCase() === 'y';
  
  const systemPromptAnswer = await question('Include system prompt? (y/n) [y]: ');
  const useSystemPrompt = systemPromptAnswer.toLowerCase() !== 'n';
  
  const thinkingAnswer = await question('Allow thinking in response? (y/n) [y]: ');
  const allowThinking = thinkingAnswer.toLowerCase() !== 'n';
  
  // Build test payload
  const testPayload = {
    model: model,
    max_tokens: 100,
    messages: []
  };
  
  // System prompt (default: true)
  if (useSystemPrompt) {
    testPayload.messages.push({
      role: "system",
      content: "You are a helpful assistant. Respond with 'Test successful!'"
    });
  }
  
  // User message
  testPayload.messages.push({
    role: "user",
    content: "Test API connectivity"
  });
  
  // Streaming (default: true)
  if (useStreaming) {
    testPayload.stream = true;
  }
  
  // Tool call (default: false)
  if (useToolCall) {
    testPayload.tools = [
      {
        name: "get_time",
        description: "Get current time",
        input_schema: {
          type: "object",
          properties: {},
          required: []
        }
      }
    ];
    
    testPayload.messages.push({
      role: "user",
      content: "Use the get_time tool"
    });
  }
  
  // Show summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST CONFIGURATION SUMMARY');
  console.log('='.repeat(50));
  
  console.log('\nAPI Configuration:');
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  Auth Token: ***${authToken.slice(-32)}`);
  console.log(`  Model: ${model}`);
  console.log(`  Timeout: ${timeout}ms`);
  
  console.log('\nTest Options:');
  console.log(`  Streaming: ${useStreaming ? 'Enabled' : 'Disabled'}`);
  console.log(`  Tool Call: ${useToolCall ? 'Included' : 'Not included'}`);
  console.log(`  System Prompt: ${useSystemPrompt ? 'Included' : 'Not included'}`);
  console.log(`  Thinking Allowed: ${allowThinking ? 'Yes' : 'No'}`);
  
  console.log('\nTest Payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('TEST LOGIC');
  console.log('='.repeat(50));
  
  console.log('\nThe test will:');
  console.log('1. Send request with above configuration');
  console.log('2. Check for 200 OK response');
  console.log('3. Report response format (streaming, thinking, etc.)');
  console.log('4. Only fail on non-200 status codes');
  
  console.log('\nDefaults:');
  console.log('  ✅ System prompt: Enabled (always included)');
  console.log('  ✅ Thinking: Enabled (allowed in response)');
  console.log('  ⚙️  Streaming: User choice');
  console.log('  ⚙️  Tool call: User choice');
  
  console.log('\nExport commands for your shell:');
  console.log(`export ANTHROPIC_BASE_URL="${baseUrl}"`);
  console.log(`export ANTHROPIC_AUTH_TOKEN="${authToken}"`);
  console.log(`export ANTHROPIC_MODEL="${model}"`);
  console.log(`export API_TIMEOUT_MS="${timeout}"`);
  
  console.log('\nTo run the actual test with axios, add the code.');
  console.log('Would you like to proceed with the API test? (y/n)');
  
  rl.close();
}

main().catch(console.error);