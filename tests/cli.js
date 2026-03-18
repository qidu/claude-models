#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

class ClaudeModelsCLI {
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
        
        // Extract ANTHROPIC_BASE_URL
        if (trimmed.startsWith('export ANTHROPIC_BASE_URL=') || 
            trimmed.startsWith('ANTHROPIC_BASE_URL=') ||
            trimmed.includes('http://') || trimmed.includes('https://')) {
          const match = trimmed.match(/(https?:\/\/[^\s#]+)/);
          if (match && !this.config.baseUrls.includes(match[1])) {
            this.config.baseUrls.push(match[1]);
          }
        }
        
        // Extract ANTHROPIC_AUTH_TOKEN
        if (trimmed.startsWith('export ANTHROPIC_AUTH_TOKEN=') || 
            trimmed.startsWith('ANTHROPIC_AUTH_TOKEN=') ||
            trimmed.includes('sk-')) {
          const match = trimmed.match(/=(.+)$/);
          if (match) {
            const token = match[1].trim();
            if (!this.config.authTokens.includes(token)) {
              this.config.authTokens.push(token);
            }
          }
        }
        
        // Extract ANTHROPIC_MODEL
        if (trimmed.startsWith('export ANTHROPIC_MODEL=') && !trimmed.startsWith('#')) {
          const match = trimmed.match(/=(.+)$/);
          if (match) {
            const model = match[1].trim();
            if (!config.models.includes(model)) {
              this.config.models.push(model);
            }
          }
        }
        
        // Extract ANTHROPIC_SMALL_FAST_MODEL
        if (trimmed.startsWith('export ANTHROPIC_SMALL_FAST_MODEL=') && !trimmed.startsWith('#')) {
          const match = trimmed.match(/=(.+)$/);
          if (match) {
            const model = match[1].trim();
            if (!config.smallFastModels.includes(model)) {
              this.config.smallFastModels.push(model);
            }
          }
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
    
    // Note: For actual API testing, you would need to install axios or use node-fetch
    console.log('(API test would be implemented with axios/fetch)');
    console.log('  System prompt: "You are a helpful assistant. Respond with \'Configuration test successful!\'"');
    console.log('  User prompt: "Test message to verify API connectivity"');
    console.log('  Streaming: enabled');
    
    // For now, simulate success
    console.log('✓ Configuration test simulated successfully');
    return true;
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
    
    // Try to execute claude if it exists
    try {
      require('child_process').execSync('command -v claude', { stdio: 'ignore' });
      console.log('\n✓ claude command found. Starting...');
      
      const claudeProcess = spawn('claude', [], {
        stdio: 'inherit',
        shell: true
      });
      
      claudeProcess.on('close', (code) => {
        console.log(`claude process exited with code ${code}`);
        this.rl.close();
      });
      
    } catch (error) {
      console.log('⚠️ claude command not found in PATH');
      console.log('Environment variables are set. You can run claude manually.');
      this.rl.close();
    }
  }

  async run() {
    console.log('\n=== Claude Models CLI ===\n');
    
    // Load config file
    const configFile = await this.question('Enter path to config file [claude-models.txt]: ');
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
  }
}

// Run the CLI
const cli = new ClaudeModelsCLI();
cli.run().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});