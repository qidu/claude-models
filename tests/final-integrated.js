#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import axios from 'axios';

class IntegratedClaudeModels {
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
    
    this.selected = {
      baseUrl: '',
      authToken: '',
      model: '',
      smallFastModel: null,
      timeout: '600000'
    };
    
    this.testOptions = {
      streaming: true,
      toolCall: false,
      systemPrompt: true,
      thinking: true
    };
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async loadConfig(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
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
        
        const extractors = [
          { key: 'baseUrls', var: 'ANTHROPIC_BASE_URL', processor: v => v.match(/(https?:\/\/[^\s#]+)/)?.[1] },
          { key: 'authTokens', var: 'ANTHROPIC_AUTH_TOKEN' },
          { key: 'models', var: 'ANTHROPIC_MODEL' },
          { key: 'smallFastModels', var: 'ANTHROPIC_SMALL_FAST_MODEL' },
          { key: 'timeouts', var: 'API_TIMEOUT_MS' },
          { key: 'timeouts', var: 'TIMEOUT' }
        ];
        
        for (const { key, var: varName, processor } of extractors) {
          const value = extractValue(trimmed, varName);
          if (value) {
            const processed = processor ? processor(value) : value;
            if (processed && !this.config[key].includes(processed)) {
              this.config[key].push(processed);
            }
          }
        }
      });
      
      return true;
    } catch (error) {
      console.log(`⚠️ Could not load config: ${error.message}`);
      return false;
    }
  }

  async selectOptions() {
    console.log('\n=== Configuration Selection ===\n');
    
    // Base URL
    if (this.config.baseUrls.length > 0) {
      console.log('Base URLs:');
      this.config.baseUrls.forEach((url, i) => console.log(`  ${i+1}. ${url}`));
      const choice = await this.question(`Select (1-${this.config.baseUrls.length}) [1]: `) || '1';
      this.selected.baseUrl = this.config.baseUrls[parseInt(choice) - 1] || this.config.baseUrls[0];
    } else {
      this.selected.baseUrl = await this.question('Base URL [https://api.qnaigc.com]: ') || 'https://api.qnaigc.com';
    }
    
    // Auth Token
    if (this.config.authTokens.length > 0) {
      console.log('\nAuth Tokens:');
      this.config.authTokens.forEach((token, i) => {
        const display = token.length > 32 ? `***${token.slice(-32)}` : token;
        console.log(`  ${i+1}. ${display}`);
      });
      const choice = await this.question(`Select (1-${this.config.authTokens.length}) [1]: `) || '1';
      this.selected.authToken = this.config.authTokens[parseInt(choice) - 1] || this.config.authTokens[0];
    } else {
      this.selected.authToken = await this.question('Auth Token: ') || 'sk-2dd63001b32cf7d9186be3d6673eedb3005a0dcfa6b0be1d00c6395173f4e348';
    }
    
    // Model
    if (this.config.models.length > 0) {
      console.log('\nModels:');
      this.config.models.forEach((model, i) => console.log(`  ${i+1}. ${model}`));
      const choice = await this.question(`Select (1-${this.config.models.length}) [1]: `) || '1';
      this.selected.model = this.config.models[parseInt(choice) - 1] || this.config.models[0];
    } else {
      this.selected.model = await this.question('Model [minimax/minimax-m2.5]: ') || 'minimax/minimax-m2.5';
    }
    
    // Timeout
    if (this.config.timeouts.length > 0) {
      console.log('\nTimeouts:');
      this.config.timeouts.forEach((timeout, i) => console.log(`  ${i+1}. ${timeout}ms`));
      const choice = await this.question(`Select (1-${this.config.timeouts.length}) [1]: `) || '1';
      this.selected.timeout = this.config.timeouts[parseInt(choice) - 1] || this.config.timeouts[0];
    } else {
      this.selected.timeout = await this.question('Timeout (ms) [600000]: ') || '600000';
    }
    
    // Test options
    console.log('\n=== Test Options ===');
    console.log('System prompt and thinking are INCLUDED by default in the test.');
    console.log('You can choose streaming and tool call options:');
    
    const streaming = await this.question('\nUse streaming in test? (y/n) [y]: ');
    this.testOptions.streaming = streaming.toLowerCase() !== 'n';
    
    const toolCall = await this.question('Include tool call in test? (y/n) [n]: ');
    this.testOptions.toolCall = toolCall.toLowerCase() === 'y';
    
    // System prompt and thinking are ALWAYS included (defaults)
    this.testOptions.systemPrompt = true;  // Always included
    this.testOptions.thinking = true;      // Always allowed
    
    return { selected: this.selected, testOptions: this.testOptions };
  }

  buildTestPayload() {
    const payload = {
      model: this.selected.model,
      max_tokens: 100,
      messages: [
        // System prompt is ALWAYS included (default)
        {
          role: "system",
          content: "You are a helpful assistant. Respond with 'Test successful!'"
        },
        // User message
        {
          role: "user",
          content: "Test API connectivity"
        }
      ]
    };
    
    // User choice: Streaming
    if (this.testOptions.streaming) {
      payload.stream = true;
    }
    
    // User choice: Tool call
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
    
    // Thinking is always allowed (default)
    // No need to set anything special for thinking
    
    return payload;
  }

  async testConnection() {
    const payload = this.buildTestPayload();
    
    console.log('\n' + '='.repeat(50));
    console.log('TESTING CONNECTION');
    console.log('='.repeat(50));
    
    console.log('\nRequest:');
    console.log(`URL: ${this.selected.baseUrl}/v1/messages`);
    console.log(`Headers: Authorization: Bearer ***${this.selected.authToken.slice(-32)}`);
    console.log(`Timeout: ${this.selected.timeout}ms`);
    console.log('\nPayload:');
    console.log(JSON.stringify(payload, null, 2));
    
    try {
      const response = await axios.post(
        `${this.selected.baseUrl}/v1/messages`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.selected.authToken}`,
            'anthropic-version': '2023-06-01'
          },
          timeout: parseInt(this.selected.timeout),
          responseType: this.testOptions.streaming ? 'stream' : 'json'
        }
      );
      
      console.log('\n✅ RESPONSE: 200 OK');
      console.log('\nAnalysis:');
      console.log(`  - Streaming: ${this.testOptions.streaming ? 'Requested' : 'Not requested'}`);
      console.log(`  - Tool call: ${this.testOptions.toolCall ? 'Requested' : 'Not requested'}`);
      console.log(`  - System prompt: ${this.testOptions.systemPrompt ? 'Included' : 'Not included'}`);
      console.log(`  - Thinking allowed: ${this.testOptions.thinking ? 'Yes' : 'No'}`);
      
      if (this.testOptions.streaming) {
        let responseText = '';
        let hasThinking = false;
        
        await new Promise((resolve, reject) => {
          response.data.on('data', (chunk) => {
            const chunkStr = chunk.toString();
            if (chunkStr.includes('thinking')) hasThinking = true;
            
            // Parse SSE for text
            const lines = chunkStr.split('\n');
            lines.forEach(line => {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.delta?.text) responseText += parsed.delta.text;
                  } catch (e) {}
                }
              }
            });
          });
          
          response.data.on('end', () => {
            console.log(`  - Contains thinking: ${hasThinking ? 'Yes' : 'No'}`);
            console.log(`  - Response: "${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}"`);
            resolve();
          });
          
          response.data.on('error', reject);
        });
      } else {
        console.log(`  - Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
      }
      
      console.log('\n✅ TEST PASSED: API is working');
      return true;
      
    } catch (error) {
      console.log('\n❌ TEST FAILED');
      
      if (error.response) {
        console.log(`Status: ${error.response.status} ${error.response.statusText}`);
        if (error.response.data) {
          console.log(`Error: ${JSON.stringify(error.response.data)}`);
        }
      } else if (error.request) {
        console.log('No response received');
        console.log(`Error: ${error.message}`);
      } else {
        console.log(`Setup error: ${error.message}`);
      }
      
      return false;
    }
  }

  generateExport() {
    console.log('\n' + '='.repeat(50));
    console.log('EXPORT CONFIGURATION');
    console.log('='.repeat(50));
    
    console.log('\nShell commands:');
    console.log(`export ANTHROPIC_BASE_URL="${this.selected.baseUrl}"`);
    console.log(`export ANTHROPIC_AUTH_TOKEN="${this.selected.authToken}"`);
    console.log(`export ANTHROPIC_MODEL="${this.selected.model}"`);
    console.log(`export API_TIMEOUT_MS="${this.selected.timeout}"`);
    
    if (this.selected.smallFastModel) {
      console.log(`export ANTHROPIC_SMALL_FAST_MODEL="${this.selected.smallFastModel}"`);
    }
    
    console.log('\nOne-line export:');
    console.log(`export ANTHROPIC_BASE_URL="${this.selected.baseUrl}" ANTHROPIC_AUTH_TOKEN="${this.selected.authToken}" ANTHROPIC_MODEL="${this.selected.model}" API_TIMEOUT_MS="${this.selected.timeout}"`);
    
    console.log('\nTest options used:');
    console.log(`  Streaming: ${this.testOptions.streaming} (user choice)`);
    console.log(`  Tool call: ${this.testOptions.toolCall} (user choice)`);
    console.log(`  System prompt: ${this.testOptions.systemPrompt} (default: always included)`);
    console.log(`  Thinking allowed: ${this.testOptions.thinking} (default: always allowed)`);
  }

  async run() {
    console.log('=== Integrated Claude Models TUI ===\n');
    
    const configFile = await this.question('Config file [claude-models.txt]: ') || 'claude-models.txt';
    await this.loadConfig(configFile);
    
    await this.selectOptions();
    
    const test = await this.question('\nRun API test? (y/n) [y]: ');
    if (test.toLowerCase() !== 'n') {
      const success = await this.testConnection();
      if (!success) {
        const retry = await this.question('\nTest failed. Try different configuration? (y/n) [n]: ');
        if (retry.toLowerCase() === 'y') {
          this.rl.close();
          const newTui = new IntegratedClaudeModels();
          return newTui.run();
        }
      }
    }
    
    this.generateExport();
    
    console.log('\n✅ Configuration complete!');
    this.rl.close();
  }
}

// Run
const tui = new IntegratedClaudeModels();
tui.run().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});