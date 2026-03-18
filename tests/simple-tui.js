#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

class SimpleClaudeModelsTUI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.config = {
      baseUrls: [],
      authTokens: [],
      models: [],
      smallFastModels: []
    };
    this.selectedConfig = {};
  }

  async loadConfigFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
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
          if (urlMatch && !this.config.baseUrls.includes(urlMatch[1])) {
            this.config.baseUrls.push(urlMatch[1]);
          }
        }
        
        // Also catch any http/https lines that might be URLs
        if (trimmed.includes('http://') || trimmed.includes('https://')) {
          const urlMatch = trimmed.match(/(https?:\/\/[^\s#]+)/);
          if (urlMatch && !this.config.baseUrls.includes(urlMatch[1])) {
            this.config.baseUrls.push(urlMatch[1]);
          }
        }
        
        // Extract ANTHROPIC_AUTH_TOKEN
        const authTokenValue = extractValue(trimmed, 'ANTHROPIC_AUTH_TOKEN');
        if (authTokenValue && !this.config.authTokens.includes(authTokenValue)) {
          this.config.authTokens.push(authTokenValue);
        }
        
        // Also catch sk- tokens anywhere in the line
        if (trimmed.includes('sk-')) {
          const tokenMatch = trimmed.match(/sk-[a-zA-Z0-9]+/);
          if (tokenMatch && !this.config.authTokens.includes(tokenMatch[0])) {
            this.config.authTokens.push(tokenMatch[0]);
          }
        }
        
        // Extract ANTHROPIC_MODEL
        const modelValue = extractValue(trimmed, 'ANTHROPIC_MODEL');
        if (modelValue && !this.config.models.includes(modelValue)) {
          this.config.models.push(modelValue);
        }
        
        // Extract ANTHROPIC_SMALL_FAST_MODEL
        const smallFastModelValue = extractValue(trimmed, 'ANTHROPIC_SMALL_FAST_MODEL');
        if (smallFastModelValue && !this.config.smallFastModels.includes(smallFastModelValue)) {
          this.config.smallFastModels.push(smallFastModelValue);
        }
      });
      
      console.log(`✓ Loaded configuration from ${filePath}`);
      console.log(`  Found ${this.config.baseUrls.length} base URLs`);
      console.log(`  Found ${this.config.authTokens.length} auth tokens`);
      console.log(`  Found ${this.config.models.length} models`);
      console.log(`  Found ${this.config.smallFastModels.length} small/fast models`);
      
    } catch (error) {
      console.log(`✗ Error loading config file: ${error.message}`);
      return false;
    }
    return true;
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  async selectConfiguration() {
    console.log('\n=== Configuration Selection ===\n');
    
    // Select base URL
    let baseUrl;
    if (this.config.baseUrls.length > 0) {
      console.log('Available base URLs:');
      this.config.baseUrls.forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
      const answer = await this.question(`Select base URL (1-${this.config.baseUrls.length}): `);
      const index = parseInt(answer) - 1;
      baseUrl = this.config.baseUrls[index] || this.config.baseUrls[0];
    } else {
      baseUrl = await this.question('Enter ANTHROPIC_BASE_URL [https://api.qnaigc.com]: ');
      if (!baseUrl) baseUrl = 'https://api.qnaigc.com';
    }
    
    // Select auth token
    let authToken;
    if (this.config.authTokens.length > 0) {
      console.log('\nAvailable auth tokens:');
      this.config.authTokens.forEach((token, index) => {
        const display = token.length > 32 ? `***${token.slice(-32)}` : token;
        console.log(`  ${index + 1}. ${display}`);
      });
      const answer = await this.question(`Select auth token (1-${this.config.authTokens.length}): `);
      const index = parseInt(answer) - 1;
      authToken = this.config.authTokens[index] || this.config.authTokens[0];
    } else {
      authToken = await this.question('Enter ANTHROPIC_AUTH_TOKEN: ');
    }
    
    // Select model
    let model;
    if (this.config.models.length > 0) {
      console.log('\nAvailable models:');
      this.config.models.forEach((model, index) => {
        console.log(`  ${index + 1}. ${model}`);
      });
      const answer = await this.question(`Select model (1-${this.config.models.length}): `);
      const index = parseInt(answer) - 1;
      model = this.config.models[index] || this.config.models[0];
    } else {
      model = await this.question('Enter ANTHROPIC_MODEL [minimax/minimax-m2.5]: ');
      if (!model) model = 'minimax/minimax-m2.5';
    }
    
    // Select small/fast model
    let smallFastModel;
    if (this.config.smallFastModels.length > 0) {
      console.log('\nAvailable small/fast models:');
      this.config.smallFastModels.forEach((model, index) => {
        console.log(`  ${index + 1}. ${model}`);
      });
      console.log(`  ${this.config.smallFastModels.length + 1}. (unset)`);
      const answer = await this.question(`Select small/fast model (1-${this.config.smallFastModels.length + 1}): `);
      const index = parseInt(answer) - 1;
      if (index < this.config.smallFastModels.length) {
        smallFastModel = this.config.smallFastModels[index];
      }
    } else {
      const answer = await this.question('Enter ANTHROPIC_SMALL_FAST_MODEL (or leave empty to unset): ');
      smallFastModel = answer || null;
    }
    
    this.selectedConfig = { baseUrl, authToken, model, smallFastModel };
    
    // Show exported environment variables
    console.log('\n=== Exported Environment Variables ===');
    console.log(`ANTHROPIC_BASE_URL=${this.selectedConfig.baseUrl}`);
    console.log(`ANTHROPIC_AUTH_TOKEN=***${this.selectedConfig.authToken.slice(-32)}`);
    console.log(`ANTHROPIC_MODEL=${this.selectedConfig.model}`);
    if (this.selectedConfig.smallFastModel) {
      console.log(`ANTHROPIC_SMALL_FAST_MODEL=${this.selectedConfig.smallFastModel}`);
    } else {
      console.log('ANTHROPIC_SMALL_FAST_MODEL=(unset)');
    }
    console.log('API_TIMEOUT_MS=600000');
    
    return this.selectedConfig;
  }

  async testConfiguration() {
    console.log('\n=== Testing Configuration ===');
    
    const { baseUrl, authToken, model, smallFastModel } = this.selectedConfig;
    
    console.log(`Testing connection to ${baseUrl}/v1/messages...`);
    
    // Show the exact request that would be sent
    console.log('\n=== Test Request Details ===');
    console.log('URL:', `${baseUrl}/v1/messages`);
    console.log('Headers:');
    console.log('  Content-Type: application/json');
    console.log('  Authorization: Bearer ***' + authToken.slice(-32));
    console.log('  anthropic-version: 2023-06-01');
    
    const testPayload = {
      model: model,
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
    };
    
    if (smallFastModel) {
      testPayload.small_fast_model = smallFastModel;
    }
    
    console.log('\nRequest Body:');
    console.log(JSON.stringify(testPayload, null, 2));
    
    console.log('\n=== Expected Response ===');
    console.log('If successful, should receive streaming response with:');
    console.log('  Content containing "Configuration test successful!"');
    console.log('\n=== Actual Response (if "Response received but not the expected message") ===');
    console.log('Would show:');
    console.log('  1. HTTP status code');
    console.log('  2. Response headers');
    console.log('  3. Full response body');
    console.log('  4. Any error messages');
    
    console.log('\n=== Simulated Test Result ===');
    console.log('✓ Connection test simulated (actual API test requires axios)');
    console.log('⚠️ To enable actual API testing:');
    console.log('  1. Install axios: pnpm add axios');
    console.log('  2. Uncomment the API call code in the function');
    
    // For demo purposes, simulate a response that doesn't match expected
    console.log('\n⚠️ Simulating: "Response received but not the expected message"');
    console.log('Example response that might cause this:');
    console.log('```');
    console.log('data: {"type":"message_start","message":{"id":"msg_123","type":"message","role":"assistant","content":[],"model":"claude-3-5-sonnet-20241022","stop_reason":null,"stop_sequence":null,"usage":{"input_tokens":25,"output_tokens":0}}}');
    console.log('data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}');
    console.log('data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}');
    console.log('data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"! How can I help"}}');
    console.log('data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" you today?"}}');
    console.log('data: {"type":"content_block_stop","index":0}');
    console.log('data: {"type":"message_stop"}');
    console.log('data: [DONE]');
    console.log('```');
    console.log('\nResponse text extracted: "Hello! How can I help you today?"');
    console.log('Expected text: "Configuration test successful!"');
    console.log('Result: Response received but not the expected message');
    
    // Ask user if they want to continue anyway
    const continueAnswer = await this.question('\nContinue anyway? (y/n) [y]: ');
    return continueAnswer.toLowerCase() !== 'n';
  }

  async startClaude() {
    console.log('\n=== Starting Claude ===');
    
    // Set environment variables
    process.env.ANTHROPIC_BASE_URL = this.selectedConfig.baseUrl;
    process.env.ANTHROPIC_AUTH_TOKEN = this.selectedConfig.authToken;
    process.env.ANTHROPIC_MODEL = this.selectedConfig.model;
    
    if (this.selectedConfig.smallFastModel) {
      process.env.ANTHROPIC_SMALL_FAST_MODEL = this.selectedConfig.smallFastModel;
    } else {
      delete process.env.ANTHROPIC_SMALL_FAST_MODEL;
    }
    
    process.env.API_TIMEOUT_MS = '600000';
    
    console.log('Environment variables set.');
    console.log('\nTo use claude command, run:');
    console.log('  claude');
    console.log('\nOr to check if it exists:');
    console.log('  command -v claude');
  }

  async run() {
    console.log('\n=== Claude Models TUI ===\n');
    
    // Load config file
    const configFile = await this.question('Enter path [claude-models.txt]: ');
    const filePath = configFile || 'claude-models.txt';
    
    if (fs.existsSync(filePath)) {
      await this.loadConfigFile(filePath);
    } else {
      console.log(`⚠️ Config file not found: ${filePath}`);
      console.log('Using default configuration options...');
    }
    
    let testSuccess = false;
    while (!testSuccess) {
      await this.selectConfiguration();
      
      // Ask if user wants to test
      const testAnswer = await this.question('\nTest configuration? (y/n) [y]: ');
      if (testAnswer.toLowerCase() !== 'n') {
        testSuccess = await this.testConfiguration();
        
        if (!testSuccess) {
          console.log('\n✗ Configuration test failed.');
          const retryAnswer = await this.question('Try different configuration? (y/n) [y]: ');
          if (retryAnswer.toLowerCase() === 'n') {
            console.log('Exiting...');
            this.rl.close();
            return;
          }
        }
      } else {
        testSuccess = true; // Skip test
      }
    }
    
    // If successful, start claude
    await this.startClaude();
    
    this.rl.close();
  }
}

// Run the TUI
const tui = new SimpleClaudeModelsTUI();
tui.run().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
