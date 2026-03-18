#!/usr/bin/env node

import fs from 'fs';

console.log('=== Testing Enhanced Features ===\n');

// Test 1: Show original config file
console.log('1. Original config file (test-with-timeout.txt):');
console.log('-----------------------------------------------');
const content = fs.readFileSync('test-with-timeout.txt', 'utf8');
console.log(content);

// Test 2: Parse and show options
console.log('\n2. Parsed options:');
console.log('-----------------');

const lines = content.split('\n');
const config = {
  baseUrls: [],
  authTokens: [],
  models: [],
  smallFastModels: [],
  timeouts: []
};

lines.forEach(line => {
  const trimmed = line.trim();
  if (!trimmed) return;
  
  const extractValue = (line, varName) => {
    const patterns = [
      new RegExp(`^export\\s+${varName}=(.+)$`),
      new RegExp(`^${varName}=(.+)$`),
      new RegExp(`^#.*export\\s+${varName}=(.+)$`),
      new RegExp(`^#.*${varName}=(.+)$`)
    ];
    
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const value = match[1].trim();
        return value.split('#')[0].trim();
      }
    }
    return null;
  };
  
  // Extract all ENV variables
  const baseUrlValue = extractValue(trimmed, 'ANTHROPIC_BASE_URL');
  if (baseUrlValue) {
    const urlMatch = baseUrlValue.match(/(https?:\/\/[^\s#]+)/);
    if (urlMatch && !config.baseUrls.includes(urlMatch[1])) {
      config.baseUrls.push(urlMatch[1]);
    }
  }
  
  const authTokenValue = extractValue(trimmed, 'ANTHROPIC_AUTH_TOKEN');
  if (authTokenValue && !config.authTokens.includes(authTokenValue)) {
    config.authTokens.push(authTokenValue);
  }
  
  const modelValue = extractValue(trimmed, 'ANTHROPIC_MODEL');
  if (modelValue && !config.models.includes(modelValue)) {
    config.models.push(modelValue);
  }
  
  const smallFastModelValue = extractValue(trimmed, 'ANTHROPIC_SMALL_FAST_MODEL');
  if (smallFastModelValue && !config.smallFastModels.includes(smallFastModelValue)) {
    config.smallFastModels.push(smallFastModelValue);
  }
  
  const timeoutValue = extractValue(trimmed, 'API_TIMEOUT_MS') || extractValue(trimmed, 'TIMEOUT');
  if (timeoutValue && !config.timeouts.includes(timeoutValue)) {
    config.timeouts.push(timeoutValue);
  }
});

console.log('Base URLs:');
config.baseUrls.forEach(url => console.log(`  - ${url}`));

console.log('\nAuth Tokens (masked):');
config.authTokens.forEach(token => console.log(`  - ***${token.slice(-32)}`));

console.log('\nModels:');
config.models.forEach(model => console.log(`  - ${model}`));

console.log('\nSmall/Fast Models:');
config.smallFastModels.forEach(model => console.log(`  - ${model}`));

console.log('\nTimeout options:');
config.timeouts.forEach(timeout => console.log(`  - ${timeout}`));

// Test 3: Demonstrate file update logic
console.log('\n3. File update logic demonstration:');
console.log('----------------------------------');

// Simulate selecting specific options
const selectedChoices = {
  baseUrl: 'https://api.qnaigc.com',
  authToken: 'sk-2dd63001b32cf7d9186be3d6673eedb3005a0dcfa6b0be1d00c6395173f4e348',
  model: 'minimax/minimax-m2.5',
  smallFastModel: null,
  timeout: '600000'
};

console.log('\nSelected choices:');
console.log(`  Base URL: ${selectedChoices.baseUrl}`);
console.log(`  Auth Token: ***${selectedChoices.authToken.slice(-32)}`);
console.log(`  Model: ${selectedChoices.model}`);
console.log(`  Timeout: ${selectedChoices.timeout}`);

console.log('\nFile update rules:');
console.log('  - Lines with selected values: keep WITHOUT #');
console.log('  - Lines with unselected values: add # prefix (one at most)');
console.log('  - Already commented lines stay commented if unselected');
console.log('  - Commented lines with selected values: remove #');

// Test 4: Show what the updated file would look like
console.log('\n4. Example updated file:');
console.log('------------------------');

const updatedLines = lines.map(line => {
  const trimmed = line.trim();
  if (!trimmed) return line;
  
  let updatedLine = line;
  
  // Check if this line contains selected values
  const envPatterns = [
    { pattern: /ANTHROPIC_BASE_URL=/, value: selectedChoices.baseUrl },
    { pattern: /ANTHROPIC_AUTH_TOKEN=/, value: selectedChoices.authToken },
    { pattern: /ANTHROPIC_MODEL=/, value: selectedChoices.model },
    { pattern: /(API_TIMEOUT_MS|TIMEOUT)=/, value: selectedChoices.timeout }
  ];
  
  for (const { pattern, value } of envPatterns) {
    if (pattern.test(trimmed)) {
      const isCommented = trimmed.startsWith('#');
      const lineWithoutComment = isCommented ? trimmed.substring(1).trim() : trimmed;
      
      // Extract current value
      const match = lineWithoutComment.match(/([^=]+)=(.+)/);
      if (match) {
        const currentValue = match[2].split('#')[0].trim();
        
        if (currentValue === value) {
          // Selected value: ensure not commented
          if (isCommented) {
            updatedLine = line.replace(/^#\s*/, '');
          }
        } else {
          // Unselected value: ensure commented
          if (!isCommented) {
            updatedLine = '#' + line;
          }
        }
      }
      break;
    }
  }
  
  return updatedLine;
});

console.log(updatedLines.join('\n'));

console.log('\n=== Key Features Demonstrated ===');
console.log('✅ TIMEOUT is now a selectable choice (API_TIMEOUT_MS or TIMEOUT)');
console.log('✅ Selected lines kept without # prefix');
console.log('✅ Unselected lines prefixed with # (one at most)');
console.log('✅ All line formats supported (export, non-export, commented)');