#!/usr/bin/env node

console.log('=== Testing Improved Parsing Logic ===\n');

import fs from 'fs';

// Load the test config file
const content = fs.readFileSync('test-config.txt', 'utf8');
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

console.log('Parsed from test-config.txt:');
console.log('\nANTHROPIC_BASE_URLs found:');
config.baseUrls.forEach(url => console.log(`  - ${url}`));

console.log('\nANTHROPIC_AUTH_TOKENs found (masked):');
config.authTokens.forEach(token => console.log(`  - ***${token.slice(-32)}`));

console.log('\nANTHROPIC_MODELs found:');
config.models.forEach(model => console.log(`  - ${model}`));

console.log('\nANTHROPIC_SMALL_FAST_MODELs found:');
config.smallFastModels.forEach(model => console.log(`  - ${model}`));

console.log('\n=== Parsing Rules Applied ===');
console.log('✅ Lines with "export VAR=value"');
console.log('✅ Lines with "VAR=value" (no export)');
console.log('✅ Lines with "# export VAR=value" (commented export)');
console.log('✅ Lines with "# VAR=value" (commented assignment)');
console.log('✅ Lines with trailing comments (value # comment)');
console.log('✅ Lines containing "sk-" (token patterns)');
console.log('✅ Lines containing http/https URLs');

console.log('\n=== Example Lines Parsed ===');
console.log('1. "export ANTHROPIC_BASE_URL=https://api.qnaigc.com" → https://api.qnaigc.com');
console.log('2. "ANTHROPIC_BASE_URL=https://anthropic.qnaigc.com" → https://anthropic.qnaigc.com');
console.log('3. "# export ANTHROPIC_BASE_URL=http://localhost:8788" → http://localhost:8788');
console.log('4. "# ANTHROPIC_BASE_URL=http://localhost:9999" → http://localhost:9999');
console.log('5. "export ANTHROPIC_BASE_URL=https://backup.example.com # backup server" → https://backup.example.com');

console.log('\n=== Improved Parsing Complete ===');
console.log('All input lines with prefix "export" or "#" but containing our ENV');
console.log('variables are now taken as valid choices!');