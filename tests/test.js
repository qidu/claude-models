#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Test the config parsing logic
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

// Test the selection logic
console.log('\n\nExample selection output:');
console.log('ANTHROPIC_BASE_URL=https://api.qnaigc.com');
console.log('ANTHROPIC_AUTH_TOKEN=***3f4e348');
console.log('ANTHROPIC_MODEL=minimax/minimax-m2.5');
console.log('ANTHROPIC_SMALL_FAST_MODEL=(unset)');
console.log('API_TIMEOUT_MS=600000');