# Claude Models TUI

A Terminal User Interface (TUI) program to load, select, and test Claude API configurations from shell/text files.

## Features

- **Config File Parsing**: Loads configuration from shell files like `claude-models.txt`
- **Interactive Selection**: Choose from parsed options or enter custom values
- **Environment Variable Management**: Sets and displays exported environment variables
- **API Testing**: Tests configuration with actual API requests
- **Claude Integration**: Starts `claude` command if available

## Installation

```bash
# Clone or download the module
cd claude-models

# Install dependencies
pnpm install  # or npm install
```

## Usage

### Basic Usage
```bash
node index.js
```

### With Config File
```bash
node index.js ../claude-models.txt
```

### As Executable
```bash
chmod +x index.js
./index.js
```

## Configuration File Format

The program reads shell-style configuration files like `claude-models.txt`:

```bash
export ANTHROPIC_BASE_URL=https://api.qnaigc.com
export ANTHROPIC_AUTH_TOKEN=sk-2dd63001b32cf7d9186be3d6673eedb3005a0dcfa6b0be1d00c6395173f4e348
export ANTHROPIC_MODEL=minimax/minimax-m2.5
#export ANTHROPIC_SMALL_FAST_MODEL=minimax/minimax-m2.1
export API_TIMEOUT_MS=600000
```

## What It Does

1. **Parses** configuration file for:
   - `ANTHROPIC_BASE_URL` (from http/https lines)
   - `ANTHROPIC_AUTH_TOKEN` (from token/sk- lines)
   - `ANTHROPIC_MODEL` and `ANTHROPIC_SMALL_FAST_MODEL`

2. **Provides interactive selection** for each variable

3. **Shows exported environment variables** (with tokens masked)

4. **Tests configuration** by making a request to `/v1/messages` with:
   - System prompt: "You are a helpful assistant. Respond with 'Configuration test successful!'"
   - User prompt: "Test message to verify API connectivity"
   - Streaming enabled

5. **If successful**, checks for `claude` command and starts it

6. **If failed**, allows re-selection of all parameters

## Files

- `index.js` - Main TUI program (ES modules)
- `simple-tui.js` - Simplified version without external dependencies
- `cli.js` - CLI version with no npm dependencies
- `demo.js` - Demonstration of parsing logic
- `test.js` - Test parsing functionality

## Dependencies

- `inquirer` - Interactive command line interface
- `axios` - HTTP client for API testing
- `chalk` - Terminal string styling

## Example Output

```
=== Claude Models TUI ===

✓ Loaded configuration from claude-models.txt
  Found 3 base URLs
  Found 2 auth tokens
  Found 2 models
  Found 0 small/fast models

=== Configuration Selection ===

Available base URLs:
  1. https://api.qnaigc.com
  2. https://anthropic.qnaigc.com
  3. http://localhost:8788
Select base URL (1-3): 1

=== Exported Environment Variables ===
ANTHROPIC_BASE_URL=https://api.qnaigc.com
ANTHROPIC_AUTH_TOKEN=***3f4e348
ANTHROPIC_MODEL=minimax/minimax-m2.5
ANTHROPIC_SMALL_FAST_MODEL=(unset)
API_TIMEOUT_MS=600000

=== Testing Configuration ===
Testing connection to https://api.qnaigc.com/v1/messages...
✓ Configuration test successful!

=== Starting Claude ===
Environment variables set.
✓ claude command found. Starting...
```

## License

MIT