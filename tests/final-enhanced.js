#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

class FinalClaudeModelsTUI {
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
        
        // Helper to extract value from any line format
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
        const extractors = [
          { key: 'baseUrls', varName: 'ANTHROPIC_BASE_URL', processor: (val) => val.match(/(https?:\/\/[^\s#]+)/)?.[1] },
          { key: 'authTokens', varName: 'ANTHROPIC_AUTH_TOKEN' },
          { key: 'models', varName: 'ANTHROPIC_MODEL' },
          { key: 'smallFastModels', varName: 'ANTHROPIC_SMALL_FAST_MODEL' },
          { key: 'timeouts', varName: 'API_TIMEOUT_MS' },
          { key: 'timeouts', varName: 'TIMEOUT' }
        ];
        
        for (const { key, varName, processor } of extractors) {
          const value = extractValue(trimmed, varName);
          if (value) {
            const processedValue = processor ? processor(value) : value;
            if (processedValue && !this.config[key].includes(processedValue)) {
              this.config[key].push(processedValue);
            }
          }
        }
        
        // Also catch URLs and tokens in any line
        if (trimmed.includes('http://') || trimmed.includes('https://')) {
          const urlMatch = trimmed.match(/(https?:\/\/[^\s#]+)/);
          if (urlMatch && !this.config.baseUrls.includes(urlMatch[1])) {
            this.config.baseUrls.push(urlMatch[1]);
          }
        }
        
        if (trimmed.includes('sk-')) {
          const tokenMatch = trimmed.match(/sk-[a-zA-Z0-9]+/);
          if (tokenMatch && !this.config.authTokens.includes(tokenMatch[0])) {
            this.config.authTokens.push(tokenMatch[0]);
          }
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
      this.selectedChoices.baseUrl = await this.question('Enter ANTHROPIC_BASE_URL [https://api.qnaigc.com]: ') || 'https://api.qnaigc.com';
    }
    
    // Select auth token
    if (this.config.authTokens.length > 0) {
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

  // Update config file: keep chosen lines without #, add # to unchosen lines (one at most)
  updateConfigFile() {
    if (!this.configFilePath || this.originalLines.length === 0) return;
    
    const updatedLines = [];
    const selectedValues = Object.values(this.selectedChoices).filter(v => v !== null);
    
    for (const line of this.originalLines) {
      const trimmed = line.trim();
      let updatedLine = line;
      
      if (!trimmed) {
        updatedLines.push(updatedLine);
        continue;
      }
      
      // Check if this line contains any ENV variable
      const envVars = ['ANTHROPIC_BASE_URL', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_MODEL', 'ANTHROPIC_SMALL_FAST_MODEL', 'API_TIMEOUT_MS', 'TIMEOUT'];
      let isEnvLine = false;
      let isSelected = false;
      
      for (const envVar of envVars) {
        const pattern = new RegExp(`(^|\\s)${envVar}=`);
        if (pattern.test(trimmed)) {
          isEnvLine = true;
          
          // Extract the value
          const match = trimmed.match(new RegExp(`${envVar}=([^#\\s]+)`));
          if (match) {
            const value = match[1];
            // Check if this value matches any selected choice
            if (selectedValues.some(selected => selected && selected.toString().includes(value))) {
              isSelected = true;
            }
          }
          break;
        }
      }
      
      if (isEnvLine) {
        const isCommented = trimmed.startsWith('#');
        
        if (isSelected) {
          // Selected line: ensure it's NOT commented
          if (isCommented) {
            // Remove one # prefix (but not multiple)
            updatedLine = line.replace(/^#\s*/, '');
          }
        } else {
          // Unselected line: ensure it IS commented (one # at most)
          if (!isCommented) {
            updatedLine = '#' + line;
          }
        }
      }
      
      updatedLines.push(updatedLine);
    }
    
    // Write back to file
    try {
      fs.writeFileSync(this.configFilePath, updatedLines.join('\n'));
      console.log(`\n✓ Updated config file: ${this.configFilePath}`);
      console.log('  - Selected lines: kept without # prefix');
      console.log('  - Unselected lines: prefixed with # (one at most)');
    } catch (error) {
      console.log(`✗ Error updating config file: ${error.message}`);
    }
  }

  async run() {
    console.log('\n=== Final Enhanced Claude Models TUI ===\n');
    
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
    
    // Update config file with selection
    this.updateConfigFile();
    
    // Generate export script for real shell export
    this.generateExportScript();
    
    // Set environment variables in Node.js process
    console.log('\n=== Environment Variables (Node.js process) ===');
    process.env.ANTHROPIC_BASE_URL = this.selectedChoices.baseUrl;
    process.env.ANTHROPIC_AUTH_TOKEN = this.selectedChoices.authToken;
    process.env.ANTHROPIC_MODEL = this.selectedChoices.model;
    if (this.selectedChoices.smallFastModel) {
      process.env.ANTHROPIC_SMALL_FAST_MODEL = this.selectedChoices.smallFastModel;
    }
    process.env.API_TIMEOUT_MS = this.selectedChoices.timeout;
    
    console.log('\nTo use claude command in THIS session, run:');
    console.log('  claude');
    
    this.rl.close();
  }

  // Generate a shell script that exports the chosen ENV variables
  generateExportScript() {
    const exportScript = `#!/bin/bash
# Claude Models Export Script
# Generated on: ${new Date().toISOString()}
# Source this file to export variables to your shell

export ANTHROPIC_BASE_URL="${this.selectedChoices.baseUrl}"
export ANTHROPIC_AUTH_TOKEN="${this.selectedChoices.authToken}"
export ANTHROPIC_MODEL="${this.selectedChoices.model}"`;

    let script = exportScript;
    
    if (this.selectedChoices.smallFastModel) {
      script += `\nexport ANTHROPIC_SMALL_FAST_MODEL="${this.selectedChoices.smallFastModel}"`;
    } else {
      script += '\n# ANTHROPIC_SMALL_FAST_MODEL is unset';
    }
    
    script += `\nexport API_TIMEOUT_MS="${this.selectedChoices.timeout}"`;
    
    script += `

# Display confirmation
echo "✓ Environment variables exported:"
echo "  ANTHROPIC_BASE_URL=\${ANTHROPIC_BASE_URL}"
echo "  ANTHROPIC_AUTH_TOKEN=***\${ANTHROPIC_AUTH_TOKEN: -32}"
echo "  ANTHROPIC_MODEL=\${ANTHROPIC_MODEL}"`;
    
    if (this.selectedChoices.smallFastModel) {
      script += `\necho "  ANTHROPIC_SMALL_FAST_MODEL=\${ANTHROPIC_SMALL_FAST_MODEL}"`;
    }
    
    script += `\necho "  API_TIMEOUT_MS=\${API_TIMEOUT_MS}"
echo ""
echo "To use claude command:"
echo "  claude"`;

    // Write export script
    const scriptPath = 'claude-export.sh';
    try {
      fs.writeFileSync(scriptPath, script);
      fs.chmodSync(scriptPath, '755'); // Make executable
      
      console.log('\n' + '='.repeat(50));
      console.log('✅ EXPORT SCRIPT GENERATED: claude-export.sh');
      console.log('='.repeat(50));
      console.log('\nTo export variables to your SHELL (not just Node.js):');
      console.log('\n  OPTION 1: Source the script (recommended):');
      console.log('    source claude-export.sh');
      console.log('    # or');
      console.log('    . claude-export.sh');
      
      console.log('\n  OPTION 2: Copy-paste export commands:');
      console.log(`    export ANTHROPIC_BASE_URL="${this.selectedChoices.baseUrl}"`);
      console.log(`    export ANTHROPIC_AUTH_TOKEN="${this.selectedChoices.authToken}"`);
      console.log(`    export ANTHROPIC_MODEL="${this.selectedChoices.model}"`);
      if (this.selectedChoices.smallFastModel) {
        console.log(`    export ANTHROPIC_SMALL_FAST_MODEL="${this.selectedChoices.smallFastModel}"`);
      }
      console.log(`    export API_TIMEOUT_MS="${this.selectedChoices.timeout}"`);
      
      console.log('\n  OPTION 3: Run in one line:');
      console.log(`    export ANTHROPIC_BASE_URL="${this.selectedChoices.baseUrl}" ANTHROPIC_AUTH_TOKEN="${this.selectedChoices.authToken}" ANTHROPIC_MODEL="${this.selectedChoices.model}" API_TIMEOUT_MS="${this.selectedChoices.timeout}"`);
      
      console.log('\nAfter exporting, you can run:');
      console.log('  claude');
      console.log('\nTo verify:');
      console.log('  echo $ANTHROPIC_BASE_URL');
      console.log('  echo $ANTHROPIC_MODEL');
      
    } catch (error) {
      console.log(`✗ Error generating export script: ${error.message}`);
    }
  }
}

// Run the TUI
const tui = new FinalClaudeModelsTUI();
tui.run().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});