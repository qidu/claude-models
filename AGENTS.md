# AGENTS.md - Claude Models TUI

A Terminal User Interface (TUI) program to load and test Customer Claude API config for `Claude Code`.

## Running the project

```bash
# Run the TUI
node index.js

# Or use pnpm
pnpm start
```

## Configuration file

The program reads from `claude-models.txt` which contains environment variables:

```bash
export ANTHROPIC_BASE_URL=https://api.qnaigc.com
export ANTHROPIC_AUTH_TOKEN=sk-xxx
export ANTHROPIC_MODEL=minimax/minimax-m2.5
export API_TIMEOUT_MS=600000
```

The TUI allows users to select/edit these values and saves modifications back to the config file.

## Dependencies

- **inquirer** - Terminal interactive prompts
- **axios** - HTTP client for API requests
- **chalk** - Terminal styling

## Testing API configuration

1. Run `node index.js`
2. Enter config file path (default: `claude-models.txt`)
3. The TUI will display available configurations
4. If only one choice exists, it's editable via input field
5. Select or edit the configuration
6. The TUI sends a test request to the API with a random math problem
7. On success, saves the selected config to the file (comments out unselected, adds new values)
8. Then starts the Claude CLI with the selected configuration

## Key features

- **Config loading**: Parses `claude-models.txt` for multiple base URLs, auth tokens, models, and timeouts
- **Smart selection**: Uses input for single choice (editable), list for multiple choices
- **Config preservation**: Comments out unselected options with `#`, adds new values when modified
- **API testing**: Sends test request with random math problem (two random integers < 100) to verify connectivity
- **Error display**: Shows raw response content for debugging
- **Environment export**: Sets environment variables and starts Claude CLI
