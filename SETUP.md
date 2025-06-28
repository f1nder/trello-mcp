# Trello MCP Server Setup Guide

## Prerequisites

1. **Node.js 18+** installed on your system
2. **Trello Account** with API access
3. **Claude Desktop** application installed

## Step 1: Get Trello API Credentials

### 1.1 Get API Key
1. Visit https://trello.com/app-key
2. Copy your API key

### 1.2 Generate Token
1. Replace `YOUR_API_KEY` in the URL below with your actual API key
2. Visit: `https://trello.com/1/authorize?expiration=never&scope=read,write,account&response_type=token&name=MCP%20Server&key=YOUR_API_KEY`
3. Click "Allow" to authorize the application
4. Copy the token displayed on the success page

## Step 2: Install and Configure

### 2.1 Clone and Install
```bash
git clone <repository-url>
cd trello-mcp
npm install
npm run build
```

### 2.2 Configure Environment
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your credentials:
   ```env
   TRELLO_API_KEY=your_actual_api_key_here
   TRELLO_TOKEN=your_actual_token_here
   LOG_LEVEL=info
   API_TIMEOUT=10000
   ```

## Step 3: Claude Desktop Integration

### 3.1 Locate Configuration File

**macOS:**
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
notepad %APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
nano ~/.config/Claude/claude_desktop_config.json
```

### 3.2 Add MCP Server Configuration

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/absolute/path/to/trello-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "your_actual_api_key_here",
        "TRELLO_TOKEN": "your_actual_token_here"
      }
    }
  }
}
```

**Important:** Replace `/absolute/path/to/trello-mcp/` with the actual absolute path to your project directory.

### 3.3 Find Absolute Path
```bash
# In your trello-mcp directory, run:
pwd
# Copy the output and use it in the configuration above
```

## Step 4: Test Installation

### 4.1 Test Server Directly
```bash
npm run start
# Should output: "Trello MCP server running on stdio"
# Press Ctrl+C to stop
```

### 4.2 Test with MCP Inspector (Optional)
```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Test the server
npx @modelcontextprotocol/inspector node dist/index.js
```

### 4.3 Test with Claude Desktop
1. Restart Claude Desktop completely
2. Start a new conversation
3. Try a command like: "Show me my Trello boards"

## Step 5: Verify Integration

Once configured, you should be able to use natural language commands in Claude Desktop:

- "List all my Trello boards"
- "Show me the cards in my 'To Do' list"
- "Create a card called 'Review documentation' in my Development board's 'In Progress' list"
- "Move the card about database migration to the 'Done' list"

## Troubleshooting

### Common Issues

**1. "Missing environment variables" error**
- Ensure your `.env` file has the correct API key and token
- Check that there are no extra spaces in the values

**2. "Network connection error"**
- Verify your internet connection
- Check if your firewall is blocking the connection

**3. "Invalid API credentials"**
- Regenerate your Trello token using the URL in Step 1.2
- Ensure the API key matches the one from https://trello.com/app-key

**4. Claude Desktop doesn't recognize the server**
- Verify the absolute path in `claude_desktop_config.json` is correct
- Restart Claude Desktop completely
- Check that the `dist/index.js` file exists (run `npm run build` if not)

**5. Permission errors**
- Make sure the `dist/index.js` file is executable
- Check file permissions in your project directory

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in your `.env` file to see detailed request/response information.

### Get Help

If you encounter issues:
1. Check the error messages in Claude Desktop's developer console
2. Test the server directly using the MCP Inspector
3. Verify your Trello API credentials work by making a test request:
   ```bash
   curl "https://api.trello.com/1/members/me/boards?key=YOUR_API_KEY&token=YOUR_TOKEN"
   ```

## Available Tools

Once setup is complete, you'll have access to these tools through Claude:

### Board Operations
- `list_boards` - Get all your boards
- `get_board` - Get detailed board information
- `get_board_members` - List board members

### List Operations
- `get_lists` - Get lists in a board
- `create_list` - Create new lists
- `update_list` - Modify list properties

### Card Operations
- `get_cards` - Get cards from board/list
- `get_card` - Get detailed card information
- `create_card` - Create new cards
- `update_card` - Modify card properties
- `move_card` - Move cards between lists
- `delete_card` - Delete cards
- `add_card_member` / `remove_card_member` - Manage card assignments

### Label Operations
- `get_labels` - Get available labels
- `create_label` - Create new labels
- `add_card_label` / `remove_card_label` - Manage card labels

### Checklist Operations
- `get_card_checklists` - Get card checklists
- `create_checklist` - Create new checklists
- `add_checklist_item` - Add checklist items
- `update_checklist_item` - Mark items complete/incomplete