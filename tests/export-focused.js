#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('=== Claude Models Export Generator ===\n');

// Load config file
const configFile = process.argv[2] || 'claude-models.txt';
console.log(`Loading config from: ${configFile}`);

if (!fs.existsSync(configFile)) {
  console.log(`✗ Config file not found: ${configFile}`);
  process.exit(1);
}

const content = fs.readFileSync(configFile, 'utf8');
const lines = content.split('\n');

// Parse configuration
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

// Simple selection (choose first option for each)
const selectedChoices = {
  baseUrl: config.baseUrls[0] || 'https://api.qnaigc.com',
  authToken: config.authTokens[0] || 'sk-2dd63001b32cf7d9***',
  model: config.models[0] || 'minimax/minimax-m2.5',
  smallFastModel: config.smallFastModels[0] || null,
  timeout: config.timeouts[0] || '600000'
};

console.log('\nSelected configuration:');
console.log(`ANTHROPIC_BASE_URL=${selectedChoices.baseUrl}`);
console.log(`ANTHROPIC_AUTH_TOKEN=***${selectedChoices.authToken.slice(-32)}`);
console.log(`ANTHROPIC_MODEL=${selectedChoices.model}`);
console.log(`ANTHROPIC_SMALL_FAST_MODEL=${selectedChoices.smallFastModel || '(unset)'}`);
console.log(`API_TIMEOUT_MS=${selectedChoices.timeout}`);

// Generate multiple export formats
console.log('\n' + '='.repeat(50));
console.log('EXPORT OPTIONS FOR YOUR SHELL:');
console.log('='.repeat(50));

// 1. Shell script
const exportScript = `#!/bin/bash
export ANTHROPIC_BASE_URL="${selectedChoices.baseUrl}"
export ANTHROPIC_AUTH_TOKEN="${selectedChoices.authToken}"
export ANTHROPIC_MODEL="${selectedChoices.model}"${selectedChoices.smallFastModel ? `\nexport ANTHROPIC_SMALL_FAST_MODEL="${selectedChoices.smallFastModel}"` : ''}
export API_TIMEOUT_MS="${selectedChoices.timeout}"
echo "✓ Environment variables exported"`;

fs.writeFileSync('claude-env.sh', exportScript);
fs.chmodSync('claude-env.sh', '755');
console.log('\n✅ 1. Shell script: claude-env.sh');
console.log('   Run: source claude-env.sh');

// 2. One-line export
const oneLineExport = `export ANTHROPIC_BASE_URL="${selectedChoices.baseUrl}" ANTHROPIC_AUTH_TOKEN="${selectedChoices.authToken}" ANTHROPIC_MODEL="${selectedChoices.model}" API_TIMEOUT_MS="${selectedChoices.timeout}"`;
console.log('\n✅ 2. One-line export:');
console.log(`   ${oneLineExport}`);

// 3. Individual exports
console.log('\n✅ 3. Individual exports:');
console.log(`   export ANTHROPIC_BASE_URL="${selectedChoices.baseUrl}"`);
console.log(`   export ANTHROPIC_AUTH_TOKEN="${selectedChoices.authToken}"`);
console.log(`   export ANTHROPIC_MODEL="${selectedChoices.model}"`);
console.log(`   export API_TIMEOUT_MS="${selectedChoices.timeout}"`);
if (selectedChoices.smallFastModel) {
  console.log(`   export ANTHROPIC_SMALL_FAST_MODEL="${selectedChoices.smallFastModel}"`);
}

// 4. Dotenv file
const dotenvContent = `ANTHROPIC_BASE_URL="${selectedChoices.baseUrl}"
ANTHROPIC_AUTH_TOKEN="${selectedChoices.authToken}"
ANTHROPIC_MODEL="${selectedChoices.model}"${selectedChoices.smallFastModel ? `\nANTHROPIC_SMALL_FAST_MODEL="${selectedChoices.smallFastModel}"` : ''}
API_TIMEOUT_MS="${selectedChoices.timeout}"`;

fs.writeFileSync('.claude.env', dotenvContent);
console.log('\n✅ 4. Dotenv file: .claude.env');
console.log('   Run: export $(cat .claude.env | xargs)');

console.log('\n' + '='.repeat(50));
console.log('AFTER EXPORTING, VERIFY:');
console.log('='.repeat(50));
console.log('\nRun these commands to verify:');
console.log('  echo $ANTHROPIC_BASE_URL');
console.log('  echo $ANTHROPIC_MODEL');
console.log('  echo $API_TIMEOUT_MS');
console.log('\nThen use claude:');
console.log('  claude');

console.log('\nNOTE: Environment variables set in Node.js (process.env)');
console.log('      are NOT available in your shell. You MUST export');
console.log('      them using one of the methods above.');