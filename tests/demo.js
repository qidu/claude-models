#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('=== Claude Models TUI Demo ===\n');

// Load and parse the config file
const content = fs.readFileSync('../claude-models.txt', 'utf8');
const lines = content.split('\n');

const config = {
  baseUrls: [],
  authTokens: [],
  models: [],
  smallFastModels: []
};

lines.forEach(line => {
  const trimmed = line.trim();
  
  // Extract ANTHROPIC_BASE_URL
  if (trimmed.startsWith('export ANTHROPIC_BASE_URL=') || 
      trimmed.startsWith('ANTHROPIC_BASE_URL=') ||
      trimmed.includes('http://') || trimmed.includes('https://')) {
    const match = trimmed.match(/(https?:\/\/[^\s#]+)/);
    if (match && !config.baseUrls.includes(match[1])) {
      config.baseUrls.push(match[1]);
    }
  }
  
  // Extract ANTHROPIC_AUTH_TOKEN
  if (trimmed.startsWith('export ANTHROPIC_AUTH_TOKEN=') || 
      trimmed.startsWith('ANTHROPIC_AUTH_TOKEN=') ||
      trimmed.includes('sk-')) {
    const match = trimmed.match(/=(.+)$/);
    if (match) {
      const token = match[1].trim();
      if (!config.authTokens.includes(token)) {
        config.authTokens.push(token);
      }
    }
  }
  
  // Extract ANTHROPIC_MODEL
  if (trimmed.startsWith('export ANTHROPIC_MODEL=') && !trimmed.startsWith('#')) {
    const match = trimmed.match(/=(.+)$/);
    if (match) {
      const model = match[1].trim();
      if (!config.models.includes(model)) {
        config.models.push(model);
      }
    }
  }
  
  // Extract ANTHROPIC_SMALL_FAST_MODEL
  if (trimmed.startsWith('export ANTHROPIC_SMALL_FAST_MODEL=') && !trimmed.startsWith('#')) {
    const match = trimmed.match(/=(.+)$/);
    if (match) {
      const model = match[1].trim();
      if (!config.smallFastModels.includes(model)) {
        config.smallFastModels.push(model);
      }
    }
  }
});

console.log('Parsed configuration from claude-models.txt:');
console.log('\nBase URLs:');
config.baseUrls.forEach(url => console.log(`  - ${url}`));
console.log('\nAuth Tokens (masked):');
config.authTokens.forEach(token => console.log(`  - ***${token.slice(-32)}`));
console.log('\nModels:');
config.models.forEach(model => console.log(`  - ${model}`));
console.log('\nSmall/Fast Models:');
config.smallFastModels.forEach(model => console.log(`  - ${model}`));

// Simulate user selection
console.log('\n=== Simulated User Selection ===');
const selectedConfig = {
  baseUrl: config.baseUrls[0],
  authToken: config.authTokens[0],
  model: config.models[0],
  smallFastModel: null
};

console.log('\nSelected configuration:');
console.log(`ANTHROPIC_BASE_URL=${selectedConfig.baseUrl}`);
console.log(`ANTHROPIC_AUTH_TOKEN=***${selectedConfig.authToken.slice(-32)}`);
console.log(`ANTHROPIC_MODEL=${selectedConfig.model}`);
console.log(`ANTHROPIC_SMALL_FAST_MODEL=(unset)`);
console.log(`API_TIMEOUT_MS=600000`);

// Simulate API test
console.log('\n=== Simulated API Test ===');
console.log(`Testing connection to ${selectedConfig.baseUrl}/v1/messages...`);
console.log('Request payload:');
console.log('```json');
console.log(`{
  "model": "${selectedConfig.model}",
  "max_tokens": 100,
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant. Respond with 'Configuration test successful!'"
    },
    {
      "role": "user",
      "content": "Test message to verify API connectivity"
    }
  ],
  "stream": true
}`);
console.log('```');
console.log('\n✓ Configuration test successful!');

// Set environment variables
console.log('\n=== Setting Environment Variables ===');
process.env.ANTHROPIC_BASE_URL = selectedConfig.baseUrl;
process.env.ANTHROPIC_AUTH_TOKEN = selectedConfig.authToken;
process.env.ANTHROPIC_MODEL = selectedConfig.model;
process.env.API_TIMEOUT_MS = '600000';

console.log('Environment variables set.');
console.log('\nNow you can run:');
console.log('  claude');
console.log('\nOr check if claude command exists:');

try {
  const { execSync } = require('child_process');
  execSync('command -v claude', { stdio: 'ignore' });
  console.log('✓ claude command found');
} catch (error) {
  console.log('⚠️ claude command not found in PATH');
}

console.log('\n=== Complete Demo ===');
console.log('The TUI program successfully:');
console.log('1. Loads config files like claude-models.txt');
console.log('2. Parses environment variables');
console.log('3. Provides interactive selection');
console.log('4. Shows exported ENV (key masked)');
console.log('5. Tests API with system/user prompts and streaming');
console.log('6. Starts claude command if successful');
console.log('7. Allows re-selection if failed');