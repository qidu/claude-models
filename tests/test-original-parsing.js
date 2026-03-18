#!/usr/bin/env node

console.log('=== Testing Original claude-models.txt with Improved Parsing ===\n');

import fs from 'fs';

// Load the original config file
const content = fs.readFileSync('claude-models.txt', 'utf8');
const lines = content.split('\n');

const config = {
  baseUrls: [],
  authTokens: [],
  models: [],
  smallFastModels: []
};

lines.forEach(line => {
  const trimmed = line.trim();
  
  // Skip empty lines
  if (!trimmed) return;
  
  // Helper function to extract value from assignment
  const extractValue = (line, varName) => {
    // Patterns to match:
    // 1. export VAR=value
    // 2. VAR=value
    // 3. # export VAR=value (commented but still contains our ENV)
    // 4. # VAR=value
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
        // Remove trailing comments
        return value.split('#')[0].trim();
      }
    }
    return null;
  };
  
  // Extract ANTHROPIC_BASE_URL
  const baseUrlValue = extractValue(trimmed, 'ANTHROPIC_BASE_URL');
  if (baseUrlValue) {
    // Also look for http/https URLs in the value
    const urlMatch = baseUrlValue.match(/(https?:\/\/[^\s#]+)/);
    if (urlMatch && !config.baseUrls.includes(urlMatch[1])) {
      config.baseUrls.push(urlMatch[1]);
    }
  }
  
  // Also catch any http/https lines that might be URLs
  if (trimmed.includes('http://') || trimmed.includes('https://')) {
    const urlMatch = trimmed.match(/(https?:\/\/[^\s#]+)/);
    if (urlMatch && !config.baseUrls.includes(urlMatch[1])) {
      config.baseUrls.push(urlMatch[1]);
    }
  }
  
  // Extract ANTHROPIC_AUTH_TOKEN
  const authTokenValue = extractValue(trimmed, 'ANTHROPIC_AUTH_TOKEN');
  if (authTokenValue && !config.authTokens.includes(authTokenValue)) {
    config.authTokens.push(authTokenValue);
  }
  
  // Also catch sk- tokens anywhere in the line
  if (trimmed.includes('sk-')) {
    const tokenMatch = trimmed.match(/sk-[a-zA-Z0-9]+/);
    if (tokenMatch && !config.authTokens.includes(tokenMatch[0])) {
      config.authTokens.push(tokenMatch[0]);
    }
  }
  
  // Extract ANTHROPIC_MODEL
  const modelValue = extractValue(trimmed, 'ANTHROPIC_MODEL');
  if (modelValue && !config.models.includes(modelValue)) {
    config.models.push(modelValue);
  }
  
  // Extract ANTHROPIC_SMALL_FAST_MODEL
  const smallFastModelValue = extractValue(trimmed, 'ANTHROPIC_SMALL_FAST_MODEL');
  if (smallFastModelValue && !config.smallFastModels.includes(smallFastModelValue)) {
    config.smallFastModels.push(smallFastModelValue);
  }
});

console.log('Parsed from claude-models.txt:');
console.log('\nANTHROPIC_BASE_URLs found:');
config.baseUrls.forEach(url => console.log(`  - ${url}`));

console.log('\nANTHROPIC_AUTH_TOKENs found (masked):');
config.authTokens.forEach(token => console.log(`  - ***${token.slice(-32)}`));

console.log('\nANTHROPIC_MODELs found:');
config.models.forEach(model => console.log(`  - ${model}`));

console.log('\nANTHROPIC_SMALL_FAST_MODELs found:');
config.smallFastModels.forEach(model => console.log(`  - ${model}`));

console.log('\n=== Key Improvements ===');
console.log('1. Now captures commented lines like:');
console.log('   "#export ANTHROPIC_MODEL=stepfun/step-flash-free"');
console.log('2. Captures lines without "export":');
console.log('   "ANTHROPIC_MODEL=hunter-alpha"');
console.log('3. Handles trailing comments:');
console.log('   "export ANTHROPIC_BASE_URL=https://api.qnaigc.com # main endpoint"');
console.log('4. Captures sk- tokens anywhere in line');

console.log('\n=== All Formats Now Supported ===');
console.log('✅ export VAR=value');
console.log('✅ VAR=value');
console.log('✅ # export VAR=value');
console.log('✅ # VAR=value');
console.log('✅ VAR=value # comment');
console.log('✅ Lines containing sk-');
console.log('✅ Lines containing http/https');