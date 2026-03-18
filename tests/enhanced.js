#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import axios from 'axios';

class EnhancedClaudeModelsTUI {
  constructor() {
    this.config = {
      baseUrls: [],
      authTokens: [],
      models: [],
      smallFastModels: [],
      timeouts: []
    };
    this.selectedConfig = {};
    this.originalLines = [];
    this.configFilePath = '';
    this.selectedChoices = {};
  }

  async loadConfigFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.originalLines = content.split('\n');
      this.configFilePath = filePath;
      
      this.originalLines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // Helper function to extract value from any line format
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
        
        // Extract ANTHROPIC_BASE_URL
        const baseUrlValue = extractValue(trimmed, 'ANTHROPIC_BASE_URL');
        if (baseUrlValue) {
          const urlMatch = baseUrlValue.match(/(https?:\/\/[^\s#]+)/);
          if (urlMatch && !this.config.baseUrls.includes(urlMatch[1])) {
            this.config.baseUrls.push(urlMatch[1]);
          }
        }
        
        // Also catch any http/https lines
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
        
        // Catch sk- tokens anywhere
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
        
        // Extract TIMEOUT (API_TIMEOUT_MS or TIMEOUT)
        const timeoutValue = extractValue(trimmed, 'API_TIMEOUT_MS') || extractValue(trimmed, 'TIMEOUT');
        if (timeoutValue && !this.config.timeouts.includes(timeoutValue)) {
          this.config.timeouts.push(timeoutValue);
        }
      });
      
      console.log(chalk.green(`✓ Loaded configuration from ${filePath}`));
      console.log(chalk.cyan(`  Found ${this.config.baseUrls.length} base URLs`));
      console.log(chalk.cyan(`  Found ${this.config.authTokens.length} auth tokens`));
      console.log(chalk.cyan(`  Found ${this.config.models.length} models`));
      console.log(chalk.cyan(`  Found ${this.config.smallFastModels.length} small/fast models`));
      console.log(chalk.cyan(`  Found ${this.config.timeouts.length} timeout options`));
      
    } catch (error) {
      console.log(chalk.red(`✗ Error loading config file: ${error.message}`));
      return false;
    }
    return true;
  }

  async selectConfiguration() {
    console.log(chalk.bold.cyan('\n=== Configuration Selection ===\n'));
    
    const questions = [];
    
    // Base URL selection
    if (this.config.baseUrls.length > 0) {
      questions.push({
        type: 'list',
        name: 'baseUrl',
        message: 'Select ANTHROPIC_BASE_URL:',
        choices: this.config.baseUrls,
        default: this.config.baseUrls[0]
      });
    } else {
      questions.push({
        type: 'input',
        name: 'baseUrl',
        message: 'Enter ANTHROPIC_BASE_URL:',
        default: 'https://api.qnaigc.com'
      });
    }
    
    // Auth Token selection
    if (this.config.authTokens.length > 0) {
      questions.push({
        type: 'list',
        name: 'authToken',
        message: 'Select ANTHROPIC_AUTH_TOKEN:',
        choices: this.config.authTokens.map(token => ({
          name: token.length > 32 ? `***${token.slice(-32)}` : token,
          value: token
        })),
        default: this.config.authTokens[0]
      });
    } else {
      questions.push({
        type: 'input',
        name: 'authToken',
        message: 'Enter ANTHROPIC_AUTH_TOKEN:',
        default: 'sk-2dd63001b32cf7d9***'
      });
    }
    
    // Model selection
    if (this.config.models.length > 0) {
      questions.push({
        type: 'list',
        name: 'model',
        message: 'Select ANTHROPIC_MODEL:',
        choices: this.config.models,
        default: this.config.models[0]
      });
    } else {
      questions.push({
        type: 'input',
        name: 'model',
        message: 'Enter ANTHROPIC_MODEL:',
        default: 'minimax/minimax-m2.5'
      });
    }
    
    // Small/Fast Model selection
    if (this.config.smallFastModels.length > 0) {
      questions.push({
        type: 'list',
        name: 'smallFastModel',
        message: 'Select ANTHROPIC_SMALL_FAST_MODEL (or skip):',
        choices: ['(unset)', ...this.config.smallFastModels],
        default: '(unset)'
      });
    } else {
      questions.push({
        type: 'input',
        name: 'smallFastModel',
        message: 'Enter ANTHROPIC_SMALL_FAST_MODEL (or leave empty to unset):',
        default: ''
      });
    }
    
    // Timeout selection
    if (this.config.timeouts.length > 0) {
      questions.push({
        type: 'list',
        name: 'timeout',
        message: 'Select TIMEOUT (API_TIMEOUT_MS):',
        choices: this.config.timeouts,
        default: this.config.timeouts[0] || '600000'
      });
    } else {
      questions.push({
        type: 'input',
        name: 'timeout',
        message: 'Enter TIMEOUT (API_TIMEOUT_MS):',
        default: '600000'
      });
    }
    
    const answers = await inquirer.prompt(questions);
    this.selectedConfig = answers;
    this.selectedChoices = {
      baseUrl: answers.baseUrl,
      authToken: answers.authToken,
      model: answers.model,
      smallFastModel: answers.smallFastModel === '(unset)' ? null : answers.smallFastModel,
      timeout: answers.timeout
    };
    
    // Show exported environment variables
    console.log('\n' + chalk.bold.cyan('=== Exported Environment Variables ==='));
    console.log(chalk.yellow(`ANTHROPIC_BASE_URL=${this.selectedChoices.baseUrl}`));
    console.log(chalk.yellow(`ANTHROPIC_AUTH_TOKEN=***${this.selectedChoices.authToken.slice(-32)}`));
    console.log(chalk.yellow(`ANTHROPIC_MODEL=${this.selectedChoices.model}`));
    if (this.selectedChoices.smallFastModel) {
      console.log(chalk.yellow(`ANTHROPIC_SMALL_FAST_MODEL=${this.selectedChoices.smallFastModel}`));
    } else {
      console.log(chalk.yellow('ANTHROPIC_SMALL_FAST_MODEL=(unset)'));
    }
    console.log(chalk.yellow(`API_TIMEOUT_MS=${this.selectedChoices.timeout}`));
    
    return this.selectedChoices;
  }

  // Helper function to update config file with selected choices
  updateConfigFile() {
    if (!this.configFilePath || this.originalLines.length === 0) {
      console.log(chalk.yellow('⚠️ No config file to update'));
      return;
    }
    
    const updatedLines = [];
    
    for (const line of this.originalLines) {
      const trimmed = line.trim();
      let updatedLine = line;
      
      // Check if this line contains any of our ENV variables
      const envPatterns = [
        { pattern: /(^|\s)(ANTHROPIC_BASE_URL)=/, value: this.selectedChoices.baseUrl },
        { pattern: /(^|\s)(ANTHROPIC_AUTH_TOKEN)=/, value: this.selectedChoices.authToken },
        { pattern: /(^|\s)(ANTHROPIC_MODEL)=/, value: this.selectedChoices.model },
        { pattern: /(^|\s)(ANTHROPIC_SMALL_FAST_MODEL)=/, value: this.selectedChoices.smallFastModel },
        { pattern: /(^|\s)(API_TIMEOUT_MS|TIMEOUT)=/, value: this.selectedChoices.timeout }
      ];
      
      for (const { pattern, value } of envPatterns) {
        if (pattern.test(trimmed) && value !== null) {
          // Check if line is already commented
          const isCommented = trimmed.startsWith('#');
          const lineWithoutComment = isCommented ? trimmed.substring(1).trim() : trimmed;
          
          // Extract the variable name and any existing value
          const match = lineWithoutComment.match(new RegExp(`(${pattern.source.split('=')[0]})=(.+)$`));
          if (match) {
            const varName = match[1];
            const currentValue = match[2].split('#')[0].trim();
            
            // If this is the selected value, ensure it's NOT commented
            if (currentValue === value) {
              // Remove comment if present (but only one #)
              if (isCommented) {
                updatedLine = line.replace(/^#\s*/, '');
              }
            } else {
              // If this is NOT the selected value, ensure it IS commented
              if (!isCommented) {
                updatedLine = '#' + line;
              }
            }
          }
          break;
        }
      }
      
      updatedLines.push(updatedLine);
    }
    
    // Write back to file
    try {
      fs.writeFileSync(this.configFilePath, updatedLines.join('\n'));
      console.log(chalk.green(`✓ Updated config file: ${this.configFilePath}`));
      console.log(chalk.cyan('  - Selected lines kept without #'));
      console.log(chalk.cyan('  - Unselected lines prefixed with # (one at most)'));
    } catch (error) {
      console.log(chalk.red(`✗ Error updating config file: ${error.message}`));
    }
  }

  async testConfiguration() {
    console.log('\n' + chalk.bold.cyan('=== Testing Configuration ==='));
    
    const { baseUrl, authToken, model, smallFastModel, timeout } = this.selectedChoices;
    
    console.log(chalk.cyan(`Testing connection to ${baseUrl}/v1/messages...`));
    
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
    
    try {
      console.log(chalk.cyan(`Sending test request (timeout: ${timeout}ms)...`));
      
      const response = await axios.post(
        `${baseUrl}/v1/messages`,
        testPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'anthropic-version': '2023-06-01'
          },
          timeout: parseInt(timeout),
          responseType: 'stream'
        }
      );
      
      let responseText = '';
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content && parsed.content[0] && parsed.content[0].text) {
                  responseText += parsed.content[0].text;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        });
      });
      
      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          if (responseText.includes('Configuration test successful!')) {
            console.log(chalk.green('✓ Configuration test successful!'));
            console.log(chalk.cyan(`Response: ${responseText}`));
            resolve(true);
          } else {
            console.log(chalk.yellow('⚠️ Response received but not the expected message'));
            console.log(chalk.cyan(`Response: ${responseText}`));
            console.log(chalk.yellow('Expected: "Configuration test successful!"'));
            resolve(true); // Still consider it successful if we got a response
          }
        });
        
        response.data.on('error', (error) => {
          console.log(chalk.red(`✗ Stream error: ${error.message}`));
          reject(error);
        });
      });
      
    } catch (error) {
      if (error.response) {
        console.log(chalk.red(`✗ API Error: ${error.response.status} ${error.response.statusText}`));
        if (error.response.data) {
          try {
            const errorData = JSON.stringify(error.response.data);
            console.log(chalk.red(`  Details: ${errorData}`));
          } catch (e) {
            console.log(chalk.red(`  Details: ${error.response.data}`));
          }
        }
      } else if (error.request) {
        console.log(chalk.red(`✗ No response received: ${error.message}`));
      } else {
        console.log(chalk.red(`✗ Request setup error: ${error.message}`));
      }
      return false;
    }
  }

  async startClaude() {
    console.log('\n' + chalk.bold.cyan('=== Starting Claude ==='));
    
    // Set environment variables
    process.env.ANTHROPIC_BASE_URL = this.selectedChoices.baseUrl;
    process.env.ANTHROPIC_AUTH_TOKEN = this.selectedChoices.authToken;
    process.env.ANTHROPIC_MODEL = this.selectedChoices.model;
    
    if (this.selectedChoices.smallFastModel) {
      process.env.ANTHROPIC_SMALL_FAST_MODEL = this.selectedChoices.smallFastModel;
    } else {
      delete process.env.ANTHROPIC_SMALL_FAST_MODEL;
    }
    
    process.env.API_TIMEOUT_MS = this.selectedChoices.timeout;
    
    console.log('Environment variables set.');
    console.log('\nTo use claude command, run:');
    console.log('  claude');
    console.log('\nOr to check if it exists:');
    console.log('  command -v claude');
  }

  async run() {
    console.log(chalk.bold.magenta('\n=== Enhanced Claude Models TUI ===\n'));
    
    // Ask for config file
    const { configFile } = await inquirer.prompt([
      {
        type: 'input',
        name: 'configFile',
        message: 'Enter path to config file (or press Enter for claude-models.txt):',
        default: 'claude-models.txt'
      }
    ]);
    
    const filePath = path.resolve(configFile);
    if (fs.existsSync(filePath)) {
      await this.loadConfigFile(filePath);
    } else {
      console.log(chalk.yellow(`⚠️ Config file not found: ${filePath}`));
      console.log(chalk.cyan('Using default configuration options...'));
    }
    
    let testSuccess = false;
    while (!testSuccess) {
      await this.selectConfiguration();
      
      // Update config file with selected choices
      this.updateConfigFile();
      
      testSuccess = await this.testConfiguration();
      
      if (!testSuccess) {
        console.log(chalk.red('\n✗ Configuration test failed.'));
        const { retry } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'retry',
            message: 'Would you like to try different configuration?',
            default: true
          }
        ]);
        
        if (!retry) {
          console.log(chalk.cyan('Exiting...'));
          process.exit(1);
        }
      }
    }
    
