#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

class UserChoiceClaudeModels {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.config = {
      baseUrls: [],
      authTokens: [],
      models: [],
      smallFastModels: [],
      timeouts: []
    };
    this.selectedChoices = {};
    this.testOptions = {
      streaming: true,
      toolCall: false,
      systemPrompt: true,
      thinking: true
    };
    this.originalLines = [];
    this.configFilePath = '';
  }

  async loadConfigFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.originalLines = content.split('\n');
      this.configFilePath = filePath;
      
      this.originalLines.forEach(line => {
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
          if (urlMatch && !this.config.baseUrls.includes(urlMatch[1])) {
            this.config.baseUrls.push(urlMatch[1]);
          }
        }
        
        const authTokenValue = extractValue(trimmed, 'ANTHROPIC_AUTH_TOKEN');
        if (authTokenValue && !this.config.authTokens.includes(authTokenValue)) {
          this.config.authTokens.push(authTokenValue);
        }
        
        const modelValue = extractValue(trimmed, 'ANTHROPIC_MODEL');
        if (modelValue && !this.config.models.includes(modelValue)) {
          this.config.models.push(modelValue);
        }
        
        const smallFastModelValue = extractValue(trimmed, 'ANTHROPIC_SMALL_FAST_MODEL');
        if (smallFastModelValue && !this.config.smallFastModels.includes(smallFastModelValue)) {
          this.config.smallFastModels.push(smallFastModelValue);
        }
        
        const timeoutValue = extractValue(trimmed, 'API_TIMEOUT_MS') || extractValue(trimmed, 'TIMEOUT');
        if (timeoutValue && !this.config.timeouts.includes(timeoutValue)) {
          this.config.timeouts.push(timeoutValue);
        }
      });
      
      console.log(`✓ Loaded configuration from ${filePath}`);
      console.log(`  Found ${this.config.baseUrls.length} base URLs`);
      console.log(`  Found ${this.config.authTokens.length} auth tokens`);
      console.log(`  Found ${this.config.models.length} models`);
      console.log(`  Found ${this.config.smallFastModels.length} small/fast models`);
      console.log(`  Found ${this.config.timeouts.length} timeout options`);
      
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
    if (this.config.baseUrls.length > 0) {
      console.log('Available base URLs:');
      this.config.baseUrls.forEach((url, i) => console.log(`  ${i+1}. ${url}`));
      const answer = await this.question(`Select base URL (1-${this.config.baseUrls.length}): `);
      const idx = parseInt(answer) - 1;
      this.selectedChoices.baseUrl = this.config.baseUrls[idx] || this.config.baseUrls[0];
    } else {
      this.selectedChoices8409dcfa6b0be1d00c6395173f4e348';
      console.log('\nAvailable auth tokens:');
      this.config.authTokens.forEach((token, i) => {
        const display = token.length > 32 ? `***${token.slice(-32)}` : token;
        console.log(`  ${i+1}. ${display}`);
      });
      const answer = await this.question(`Select auth token (1-${this.config.authTokens.length}): `);
      const idx = parseInt(answer) - 1;
      this.selectedChoices.authToken = this.config.authTokens[idx] || this.config.authTokens[0];
    } else {
      this.selectedChoices.authToken = await this.question('Enter ANTHROPIC_AUTH_TOKEN: ');
    }
    
    // Select model
    if (this.config.models.length > 0) {
      console.log('\nAvailable models:');
      this.config.models.forEach((model, i) => console.log(`  ${i+1}. ${model}`));
      const answer = await this.question(`Select model (1-${this.config.models.length}): `);
      const idx = parseInt(answer) - 1;
      this.selectedChoices.model = this.config.models[idx] || this.config.models[0];
    } else {
      this.selectedChoices.model = await this.question('Enter ANTHROPIC_MODEL [minimax/minimax-m2.5]: ') || 'minimax/minimax-m2.5';
    }
    
    // Select small/fast model
    if (this.config.smallFastModels.length > 0) {
      console.log('\nAvailable small/fast models:');
      this.config.smallFastModels.forEach((model, i) => console.log(`  ${i+1}. ${model}`));
      console.log(`  ${this.config.smallFastModels.length + 1}. (unset)`);
      const answer = await this.question(`Select small/fast model (1-${this.config.smallFastModels.length + 1}): `);
      const idx = parseInt(answer) - 1;
      this.selectedChoices.smallFastModel = idx < this.config.smallFastModels.length ? this.config.smallFastModels[idx] : null;
    } else {
      const answer = await this.question('Enter ANTHROPIC_SMALL_FAST_MODEL (or leave empty to unset): ');
      this.selectedChoices.smallFastModel = answer || null;
    }
    
    // Select timeout
    if (this.config.timeouts.length > 0) {
      console.log('\nAvailable timeout options:');
      this.config.timeouts.forEach((timeout, i) => console.log(`  ${i+1}. ${timeout}`));
      const answer = await this.question(`Select timeout (1-${this.config.timeouts.length}): `);
      const idx = parseInt(answer) - 1;
      this.selectedChoices.timeout = this.config.timeouts[idx] || this.config.timeouts[0];
    } else {
      this.selectedChoices.timeout = await this.question('Enter TIMEOUT (API_TIMEOUT_MS) [600000]: ') || '600000';
    }
    
    // Show selected configuration
    console.log('\n=== Selected Configuration ===');
    console.log(`ANTHROPIC_BASE_URL=${this.selectedChoices.baseUrl}`);
    console.log(`ANTHROPIC_AUTH_TOKEN=***${this.selectedChoices.authToken?.slice(-32) || ''}`);
    console.log(`ANTHROPIC_MODEL=${this.selectedChoices.model}`);
    console.log(`ANTHROPIC_SMALL_FAST_MODEL=${this.selectedChoices.smallFastModel || '(unset)'}`);
    console.log(`API_TIMEOUT_MS=${this.selectedChoices.timeout}`);
    
    return this.selectedChoices;
  }

  async selectTestOptions() {
    console.log('\n=== Test Request Options ===\n');
    
    // Streaming option
    const streamingAnswer = await this.question('Use streaming in test? (y/n) [y]: ');
    this.testOptions.streaming = streamingAnswer.toLowerCase() !== 'n';
    
    // Tool call option
    const toolCallAnswer = await this.question('Include tool call in test? (y/n) [n]: ');
    this.testOptions.toolCall = toolCallAnswer.toLowerCase() === 'y';
    
    // System prompt (default: true)
    const systemPromptAnswer = await this.question('Include system prompt? (y/n) [y]: ');
    this.testOptions.systemPrompt = systemPromptAnswer.toLowerCase() !== 'n';
    
    // Thinking (default: true)
    const thinkingAnswer = await this.question('Allow thinking in response? (y/n) [y]: ');
    this.testOptions.thinking = thinkingAnswer.toLowerCase() !== 'n';
    
    console.log('\n=== Test Configuration ===');
    console.log(`Streaming: ${this.testOptions.streaming ? 'Enabled' : 'Disabled'}`);
    console.log(`Tool call: ${this.testOptions.toolCall ? 'Included' : 'Not included'}`);
    console.log(`System prompt: ${this.testOptions.systemPrompt ? 'Included' : 'Not included'}`);
    console.log(`Thinking allowed: ${this.testOptions.thinking ? 'Yes' : 'No'}`);
    
    return this.testOptions;
  }

  buildTestPayload() {
    const payload = {
      model: this.selectedChoices.model,
      max_tokens: 100,
      messages: []
    };
    
    // Add system prompt if enabled
    if (this.testOptions.systemPrompt) {
      payload.messages.push({
        role: "system",
        content: "You are a helpful assistant. Respond with 'Test successful!'"
      });
    }
    
    // Add user message
    payload.messages.push({
      role: "user",
      content: "Test API connectivity"
    });
    
    // Add streaming if enabled
    if (this.testOptions.streaming) {
      payload.stream = true;
    }
    
    // Add tool call if enabled
    if (this.testOptions.toolCall) {
      payload.tools = [
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
      
      // Add tool use message
      payload.messages.push({
        role: "user",
        content: "Use the get_time tool"
      });
    }
    
    return payload;
  }

  async run() {
    console.log('\n=== User Choice Claude Models ===\n');
    
    // Load config file
    const configFile = await this.question('Enter path to config file [claude-models.txt]: ');
    const filePath = configFile || 'claude-models.txt';
    
    if (fs.existsSync(filePath)) {
      await this.loadConfigFile(filePath);
    } else {
      console.log(`⚠️ Config file not found: ${filePath}`);
      console.log('Using default configuration options...');
    }
    
    await this.selectConfiguration();
    await this.selectTestOptions();
    
    // Build and show test payload
    const testPayload = this.buildTestPayload();
    
    console.log('\n=== Test Request Payload ===');
    console.log(JSON.stringify(testPayload, null, 2));
    
    console.log('\n=== Test Logic ===');
    console.log('Will make API request with these options.');
    console.log('Only non-200 status codes are treated as failures.');
    console.log('System prompt and thinking are included by default.');
    console.log('You chose streaming and tool call options.');
    
    console.log('\n=== Export Options ===');
    console.log('After testing, you can export the chosen configuration.');
    console.log('Run: export ANTHROPIC_BASE_URL="..." etc.');
    
    this.rl.close();
  }
}

// Run the TUI
const tui = new UserChoiceClaudeModels();
tui.run().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});