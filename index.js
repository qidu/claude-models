#!/usr/bin/env node

import fs from 'fs';
import os from 'os';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import axios from 'axios';
import { spawn, execSync } from 'child_process';

class ClaudeModelsTUI {
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

        // Extract API_TIMEOUT_MS
        const timeoutValue = extractValue(trimmed, 'API_TIMEOUT_MS');
        if (timeoutValue) {
          const timeoutNum = parseInt(timeoutValue, 10);
          if (!isNaN(timeoutNum) && !this.config.timeouts.includes(timeoutNum)) {
            this.config.timeouts.push(timeoutNum);
          }
        }
      });
      
      console.log(chalk.green(`✓ Loaded configuration from ${filePath}`));
      console.log(chalk.cyan(`  Found ${this.config.baseUrls.length} Base URLs`));
      console.log(chalk.cyan(`  Found ${this.config.authTokens.length} Auth tokens`));
      console.log(chalk.cyan(`  Found ${this.config.models.length} Models`));
      console.log(chalk.cyan(`  Found ${this.config.timeouts.length} Timeouts`));

    } catch (error) {
      console.log(chalk.red(`✗ Error loading config file: ${error.message}`));
      return false;
    }
    return true;
  }

  async selectConfiguration() {
    const questions = [];

    // Helper: use input (editable) if only 1 choice, otherwise use list
    if (this.config.baseUrls.length === 1) {
      questions.push({
        type: 'input',
        name: 'baseUrl',
        message: 'Enter ANTHROPIC_BASE_URL:',
        default: this.config.baseUrls[0]
      });
    } else if (this.config.baseUrls.length > 1) {
      questions.push({
        type: 'list',
        name: 'baseUrl',
        message: 'Select ANTHROPIC_BASE_URL:',
        choices: this.config.baseUrls
      });
    } else {
      questions.push({
        type: 'input',
        name: 'baseUrl',
        message: 'Enter ANTHROPIC_BASE_URL:',
        default: 'https://api.qnaigc.com'
      });
    }

    if (this.config.authTokens.length === 1) {
      questions.push({
        type: 'input',
        name: 'authToken',
        message: 'Enter ANTHROPIC_AUTH_TOKEN:',
        default: this.config.authTokens[0]
      });
    } else if (this.config.authTokens.length > 1) {
      questions.push({
        type: 'list',
        name: 'authToken',
        message: 'Select ANTHROPIC_AUTH_TOKEN:',
        choices: this.config.authTokens.map(token => {
          const display = token.length > 32 ? `***${token.slice(-32)}` : token;
          return { name: display, value: token };
        })
      });
    } else {
      questions.push({
        type: 'input',
        name: 'authToken',
        message: 'Enter ANTHROPIC_AUTH_TOKEN:',
        default: 'sk-***'
      });
    }

    if (this.config.models.length === 1) {
      questions.push({
        type: 'input',
        name: 'model',
        message: 'Enter ANTHROPIC_MODEL:',
        default: this.config.models[0]
      });
    } else if (this.config.models.length > 1) {
      questions.push({
        type: 'list',
        name: 'model',
        message: 'Select ANTHROPIC_MODEL:',
        choices: this.config.models
      });
    } else {
      questions.push({
        type: 'input',
        name: 'model',
        message: 'Enter ANTHROPIC_MODEL:',
        default: 'minimax/minimax-m2.5'
      });
    }

    // API_TIMEOUT_MS selection
    if (this.config.timeouts.length === 1) {
      questions.push({
        type: 'input',
        name: 'timeout',
        message: 'Enter API_TIMEOUT_MS:',
        default: this.config.timeouts[0].toString()
      });
    } else if (this.config.timeouts.length > 1) {
      questions.push({
        type: 'list',
        name: 'timeout',
        message: 'Select API_TIMEOUT_MS:',
        choices: this.config.timeouts.map(t => {
          const display = typeof t === 'number' ? t.toString() : t;
          return { name: display, value: t };
        })
      });
    } else {
      questions.push({
        type: 'input',
        name: 'timeout',
        message: 'Enter API_TIMEOUT_MS:',
        default: '600000'
      });
    }

    const answers = await inquirer.prompt(questions);
    this.selectedConfig = answers;

    // Show exported environment variables
    console.log('\n' + chalk.bold.cyan('Exported Environment Variables:'));
    console.log(chalk.yellow(`ANTHROPIC_BASE_URL=${this.selectedConfig.baseUrl}`));
    console.log(chalk.yellow(`ANTHROPIC_AUTH_TOKEN=***${this.selectedConfig.authToken.slice(-32)}`));
    console.log(chalk.yellow(`ANTHROPIC_MODEL=${this.selectedConfig.model}`));
    console.log(chalk.yellow(`API_TIMEOUT_MS=${this.selectedConfig.timeout}`));

    return this.selectedConfig;
  }

  async saveConfigToFile() {
    if (!this.configFilePath) return;

    try {
      let content = fs.readFileSync(this.configFilePath, 'utf8');
      const lines = content.split('\n');
      const newLines = [];
      const varsToSet = {
        'ANTHROPIC_BASE_URL': this.selectedConfig.baseUrl,
        'ANTHROPIC_AUTH_TOKEN': this.selectedConfig.authToken,
        'ANTHROPIC_MODEL': this.selectedConfig.model,
        'API_TIMEOUT_MS': this.selectedConfig.timeout.toString()
      };
      const foundVars = new Set();

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) {
          newLines.push(line);
          continue;
        }

        const isCommented = trimmed.startsWith('#');
        const uncommentedLine = isCommented ? trimmed.slice(1).trim() : trimmed;
        const startsWithExport = uncommentedLine.startsWith('export ');

        // Check if this line defines one of our variables
        let matchedVar = null;
        let matchedValue = null;
        for (const varName of Object.keys(varsToSet)) {
          // Match patterns like "export VAR=value" or "VAR=value"
          const pattern = new RegExp(`^(export\\s+)?${varName}=(.+)$`);
          const match = uncommentedLine.match(pattern);
          if (match) {
            matchedVar = varName;
            matchedValue = match[2].trim().split('#')[0].trim(); // Get value part, strip trailing comments
            break;
          }
        }

        if (matchedVar && startsWithExport) {
          foundVars.add(matchedVar);
          const selectedValue = varsToSet[matchedVar];
          const isSelected = matchedValue === selectedValue;

          // Reconstruct the line based on selection
          const withoutPrefix = uncommentedLine.replace(/^export\s+/, '');
          const parts = withoutPrefix.split('#');
          const varAssignmentBase = matchedVar;

          if (isSelected) {
            // Selected choice: ensure no leading "#"
            const varAssignment = `${varAssignmentBase}=${selectedValue}`;
            if (parts.length > 1) {
              const comment = parts.slice(1).join('#').trim();
              newLines.push(`export ${varAssignment} # ${comment}`);
            } else {
              newLines.push(`export ${varAssignment}`);
            }
          } else {
            // Unselected choice: add leading "#" if not already commented
            const varAssignment = `${varAssignmentBase}=${matchedValue}`;
            if (parts.length > 1) {
              const comment = parts.slice(1).join('#').trim();
              newLines.push(`#export ${varAssignment} # ${comment}`);
            } else {
              newLines.push(`#export ${varAssignment}`);
            }
          }
          continue;
        }

        // Not a matching line, keep as is
        newLines.push(line);
      }

      // Add any missing variables at the end (not as duplicates)
      for (const [varName, varValue] of Object.entries(varsToSet)) {
        if (!foundVars.has(varName)) {
          newLines.push(`export ${varName}=${varValue}`);
        }
      }

      fs.writeFileSync(this.configFilePath, newLines.join('\n'));
      console.log(chalk.green(`✓ Configuration saved to ${this.configFilePath}`));
    } catch (error) {
      console.log(chalk.red(`✗ Error saving config: ${error.message}`));
    }
  }

  async testConfiguration() {
    console.log('\n' + chalk.bold.cyan('Testing configuration...'));

    const { baseUrl, authToken, model, timeout } = this.selectedConfig;

    // Generate random integers for test
    const a = Math.floor(Math.random() * 100);
    const b = Math.floor(Math.random() * 100);

    const testPayload = {
      model: model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Calculate ${a} + ${b} using the math_operation tool.`,
              cache_control: { type: "ephemeral" }
            }
          ]
        }
      ],
      max_tokens: 256,
      stream: true,
      system: [
        {
          type: "text",
          text: "You are a helpful assistant that uses tools when asked.",
          cache_control: { type: "ephemeral" }
        }
      ],
      tools: [
        {
          name: "math_operation",
          description: "Perform basic arithmetic operations",
          input_schema: {
            type: "object",
            properties: {
              a: { description: "First number", type: "number" },
              b: { description: "Second number", type: "number" },
              operation: {
                type: "string",
                enum: ["add", "subtract", "multiply", "divide"],
                description: "The operation to perform. One of 'add', 'subtract', 'multiply', 'divide'."
              }
            },
            required: ["a", "b", "operation"]
          }
        }
      ]
    };

    // Show the request details
    console.log(chalk.gray('URL: ') + `${baseUrl}/v1/messages`);
    // console.log(chalk.gray('Request Body:'));
    // console.log(chalk.gray(JSON.stringify(testPayload, null, 2)));

    try {
      console.log(chalk.cyan(`\nRequest to ${baseUrl}/v1/messages...`));

      const response = await axios.post(
        `${baseUrl}/v1/messages`,
        testPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': `${authToken}`,
            'anthropic-version': '2023-06-01'
          },
          timeout: timeout > 300000 ? 30000 : timeout,
          responseType: 'stream'
        }
      );

      return new Promise((resolve, reject) => {
        let rawResponse = '';
        response.data.on('data', (chunk) => {
          rawResponse += chunk.toString();
        //  console.log(chalk.green(chunk.toString()));
        });

        response.data.on('end', () => {
          // Write raw response to file
          fs.writeFileSync('/tmp/test-response.txt', rawResponse);
          console.log(chalk.cyan('\nResponse saved to /tmp/test-response.txt'));
          // Return the HTTP status code (200 for successful response)
          resolve(response.status);
        });

        response.data.on('error', (error) => {
          console.log(chalk.red(`\n✗ Stream error: ${error.message}`));
          // Even with stream error, check if we got a 200 status initially
          resolve(response?.status === 200 ? 200 : null);
        });
      });

    } catch (error) {
      if (error.response) {
        // Server responded - output raw response
        console.log(chalk.gray('Status: ') + error.response.status + ' ' + error.response.statusText);
        if (error.response.data) {
          console.log(chalk.red(error.response.data));
        }
        return error.response.status;
      } else if (error.request) {
        console.log(chalk.red(`No response: ${error.message}`));
        return null;
      } else {
        console.log(chalk.red(`Error: ${error.message}`));
        return null;
      }
    }
  }

  async startClaude() {
    console.log('\n' + chalk.bold.cyan('Starting claude command...'));
    
    try {
      // Set environment variables
      process.env.ANTHROPIC_BASE_URL = this.selectedConfig.baseUrl;
      process.env.ANTHROPIC_AUTH_TOKEN = this.selectedConfig.authToken;
      process.env.ANTHROPIC_MODEL = this.selectedConfig.model;
      process.env.API_TIMEOUT_MS = this.selectedConfig.timeout?.toString() || '600000';

      // Check if claude command exists
      try {
        execSync('command -v claude', { stdio: 'ignore' });
        console.log(chalk.green('✓ claude command found'));
        
        // Start claude
        const claudeProcess = spawn('claude', [], {
          stdio: 'inherit',
          shell: true
        });
        
        claudeProcess.on('close', (code) => {
          console.log(chalk.cyan(`claude process exited with code ${code}`));
        });
        
      } catch (error) {
        console.log(chalk.yellow('⚠️ claude command not found in PATH'));
        console.log(chalk.cyan('Environment variables have been set. You can now run:'));
        console.log(chalk.yellow('  claude'));
        console.log(chalk.cyan('Or any other command that uses these environment variables.'));
      }
      
    } catch (error) {
      console.log(chalk.red(`✗ Error starting claude: ${error.message}`));
    }
  }

  async run() {
    console.log(chalk.bold.magenta('\n--- Claude Models Configuring ---\n'));
    
    // Ask for config file
    const { configFile } = await inquirer.prompt([
      {
        type: 'input',
        name: 'configFile',
        message: 'Config file (or press Enter):',
        default: 'claude-models.txt'
      }
    ]);
    
    const filePath = path.resolve(configFile);
    const homeFilePath = path.join(os.homedir(), configFile);

    if (fs.existsSync(filePath)) {
      this.configFilePath = filePath;
      await this.loadConfigFile(filePath);
    } else if (fs.existsSync(homeFilePath)) {
      this.configFilePath = homeFilePath;
      console.log(chalk.yellow(`⚠️ Config file not found in current directory: ${filePath}`));
      console.log(chalk.cyan(`Using config file from home directory: ${homeFilePath}`));
      await this.loadConfigFile(homeFilePath);
    } else {
      this.configFilePath = filePath;
      console.log(chalk.yellow(`⚠️ Config file not found: ${filePath}`));
      console.log(chalk.cyan(`Also checked home directory: ${homeFilePath}`));
      console.log(chalk.cyan('Using default configuration options...'));
    }
    
    let testStatus = null;
    while (testStatus !== 200) {
      await this.selectConfiguration();
      testStatus = await this.testConfiguration();

      if (testStatus !== 200) {
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

    // Save selected config to file only on successful test
    await this.saveConfigToFile();

    // If successful, start claude
    await this.startClaude();
  }
}

// Run the TUI
const tui = new ClaudeModelsTUI();
tui.run().catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});
