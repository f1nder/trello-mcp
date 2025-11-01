# Trello MCP Server

A Model Context Protocol (MCP) server that provides Claude with tools to interact with Trello boards, lists, and cards through the Trello REST API.

## Features

### Core Functionality
- **Board Management**: List boards, get board details and metadata
- **List Operations**: Retrieve lists, create new lists within boards
- **Card Management**: Create, update, delete, and move cards between lists
- **Member Management**: Add/remove members from boards and cards
- **Labels & Checklists**: Manage card labels and checklist items

### Technical Features
- TypeScript implementation with full type safety
- Comprehensive error handling and validation
- Rate limiting compliance for Trello API
- Secure authentication using API key/token
- Integration with Popular Agentic IDE via MCP protocol

## Prerequisites

- Node.js 18+ and npm
- Trello account with API access
- Claude Desktop application

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trello-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Authentication Setup

1. **Get Trello API Credentials**:
   - Visit https://trello.com/app-key to get your API key
   - Generate a token by visiting: `https://trello.com/1/authorize?expiration=never&scope=read,write,account&response_type=token&name=Server%20Token&key=YOUR_API_KEY`

2. **Configure Environment**:
   Create a `.env` file in the project root:
   ```env
   TRELLO_API_KEY=your_api_key_here
   TRELLO_TOKEN=your_token_here
   ```

## Integration Setup

### Claude Desktop Integration

Add the following to your Claude Desktop configuration file:

#### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

#### Windows
Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/path/to/trello-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "your_api_key_here",
        "TRELLO_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Docker Desktop Integration

Docker Desktop (v4.38+) includes built-in MCP server support through the Docker MCP Catalog and Toolkit. This provides the easiest way to run and manage MCP servers.

#### Option 1: Using Docker Desktop's Built-in MCP Support (Recommended)

1. **Enable MCP in Docker Desktop**:
   - Open Docker Desktop (ensure version 4.38 or later)
   - Go to **Extensions** → **Browse** → Search for "MCP" 
   - Install the **Docker MCP Catalog and Toolkit** extension

2. **Publish to Docker Hub's MCP Catalog**:
   ```bash
   # Build and tag for MCP catalog
   docker build -t mcp/trello-server .
   docker push mcp/trello-server
   ```

3. **Configure in Claude Desktop with Docker MCP**:
   ```json
   {
     "mcpServers": {
       "trello": {
         "command": "docker",
         "args": [
           "run", "--rm", "-i",
           "--env-file", ".env",
           "mcp/trello-server"
         ]
       }
     }
   }
   ```

4. **Use with Ask Gordon (Docker AI)**:
   Create `gordon-mcp.yml` in your project directory:
   ```yaml
   version: '3.8'
   services:
     trello-mcp:
       image: mcp/trello-server
       environment:
         - TRELLO_API_KEY=${TRELLO_API_KEY}
         - TRELLO_TOKEN=${TRELLO_TOKEN}
       volumes:
         - ./logs:/app/logs
   ```

   Then use Docker AI commands:
   ```bash
   # Ask Gordon to help with Trello management
   docker ai "Show me my Trello boards and create a new development task"
   ```

#### Option 2: Traditional Docker Setup

Create a `Dockerfile` in your project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcp -u 1001
RUN chown -R mcp:nodejs /app
USER mcp

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

Build and run the container:

```bash
# Build the image
docker build -t trello-mcp-server .

# Run with Docker MCP Toolkit (secure credential management)
docker run -d \
  --name trello-mcp \
  --env-file .env \
  -p 3000:3000 \
  trello-mcp-server

# Or use docker-compose.yml:
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  trello-mcp:
    build: .
    container_name: trello-mcp-server
    environment:
      - TRELLO_API_KEY=${TRELLO_API_KEY}
      - TRELLO_TOKEN=${TRELLO_TOKEN}
      - LOG_LEVEL=info
      - API_TIMEOUT=10000
    ports:
      - "3000:3000"
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge
```

Run with Docker Compose:

```bash
# Set environment variables in .env file, then:
docker-compose up -d
```

#### Benefits of Docker Desktop MCP Integration

- **Built-in Security**: OAuth support and secure credential storage
- **One-Click Setup**: Seamless integration with Claude, Cursor, VSCode, and other MCP clients
- **Cross-Platform**: Consistent behavior across different architectures
- **Isolation**: Memory, network, and disk isolation for production-ready security
- **Discovery**: Access to 100+ verified MCP tools from Docker Hub's MCP Catalog

### Cursor IDE Integration

In Cursor, you can set up the MCP server for AI-assisted development:

1. **Install Cursor Extension** (if available):
   - Open Cursor IDE
   - Go to Extensions marketplace
   - Search for "MCP" or "Model Context Protocol"

2. **Configure MCP Server**:
   Create `.cursor/mcp-config.json` in your workspace:

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/path/to/trello-mcp",
      "env": {
        "TRELLO_API_KEY": "your_api_key_here",
        "TRELLO_TOKEN": "your_token_here"
      }
    }
  }
}
```

3. **Use with Cursor AI**:
   - Open Cursor's AI chat panel
   - The Trello MCP tools should be available for context
   - Ask questions like: "Show me my Trello boards and help me organize my tasks"

### Windsurf IDE Integration

For Windsurf IDE integration:

1. **Project Configuration**:
   Create `.windsurf/settings.json`:

```json
{
  "mcp": {
    "servers": {
      "trello": {
        "command": "node",
        "args": ["dist/index.js"],
        "cwd": "${workspaceFolder}",
        "env": {
          "TRELLO_API_KEY": "your_api_key_here",
          "TRELLO_TOKEN": "your_token_here"
        }
      }
    }
  },
  "ai": {
    "providers": {
      "claude": {
        "mcpServers": ["trello"]
      }
    }
  }
}
```

2. **Workspace Setup**:
   Add to your `.windsurf/workspace.json`:

```json
{
  "name": "Trello MCP Development",
  "description": "Development workspace with Trello integration",
  "mcpServers": ["trello"],
  "tools": {
    "trello": {
      "enabled": true,
      "autoStart": true
    }
  }
}
```

3. **Usage in Windsurf**:
   - The AI assistant will have access to Trello tools
   - Use natural language commands in the AI chat
   - Example: "Create a development task board and add cards for the current project features"

### Development Container (DevContainer)

For consistent development environments, create `.devcontainer/devcontainer.json`:

```json
{
  "name": "Trello MCP Development",
  "build": {
    "dockerfile": "../Dockerfile.dev"
  },
  "forwardPorts": [3000],
  "postCreateCommand": "npm install && npm run build",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-vscode.vscode-typescript-next",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss"
      ],
      "settings": {
        "mcp.servers": {
          "trello": {
            "command": "node",
            "args": ["dist/index.js"],
            "env": {
              "TRELLO_API_KEY": "${TRELLO_API_KEY}",
              "TRELLO_TOKEN": "${TRELLO_TOKEN}"
            }
          }
        }
      }
    }
  },
  "remoteEnv": {
    "TRELLO_API_KEY": "${localEnv:TRELLO_API_KEY}",
    "TRELLO_TOKEN": "${localEnv:TRELLO_TOKEN}"
  }
}
```

Create `Dockerfile.dev`:

```dockerfile
FROM node:18

WORKDIR /workspace

# Install global tools
RUN npm install -g @modelcontextprotocol/inspector typescript

# Set up development environment
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose MCP server port
EXPOSE 3000

CMD ["npm", "run", "dev"]
```

## Available Tools

### Board Operations
- `list_boards` - Get all boards accessible to the user
- `get_board` - Get detailed information about a specific board
- `get_board_members` - List members of a board

### List Operations  
- `get_lists` - Get all lists in a board
- `create_list` - Create a new list in a board
- `update_list` - Update list properties (name, position)

### Card Operations
- `get_cards` - Get cards from a board or list
- `create_card` - Create a new card
- `update_card` - Update card properties (name, description, due date)
- `move_card` - Move card to different list
- `delete_card` - Delete a card
- `add_card_member` - Add member to a card
- `remove_card_member` - Remove member from a card

### Label Operations
- `get_labels` - Get available labels for a board
- `add_card_label` - Add label to a card
- `remove_card_label` - Remove label from a card

### Checklist Operations
- `get_card_checklists` - Get checklists on a card
- `create_checklist` - Create a new checklist on a card
- `add_checklist_item` - Add item to a checklist
- `update_checklist_item` - Update checklist item (mark complete/incomplete)

### Reaction Operations
- `get_reactions` - List reactions applied to a Trello action (e.g., a comment)
- `create_reaction` - Add a reaction to a Trello action using emoji identifiers
- `delete_reaction` - Remove an existing reaction from a Trello action

## Development

### Project Structure
```
trello-mcp/
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── trello-client.ts  # Trello API client
│   ├── tools/            # MCP tool implementations
│   │   ├── boards.ts
│   │   ├── lists.ts
│   │   ├── cards.ts
│   │   ├── labels.ts
│   │   ├── checklists.ts
│   │   └── reactions.ts
│   └── types/            # TypeScript type definitions
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts
- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run in development mode with auto-reload
- `npm run start` - Start the MCP server
- `npm run test` - Run tests

### Testing
```bash
# Install the MCP Inspector for testing
npm install -g @modelcontextprotocol/inspector

# Test the server
mcp-inspector node dist/index.js
```

## Usage Examples

Once integrated with Claude Desktop, you can use natural language to interact with Trello:

- "Show me all my Trello boards"
- "Create a new card called 'Fix login bug' in the 'To Do' list of my Development board"
- "Move the card 'Review PR #123' to the 'Done' list"
- "Add the 'Priority' label to the card about the database migration"
- "List all cards in my Personal board that are due this week"

## Error Handling

The server includes comprehensive error handling for:
- Network connectivity issues
- Invalid API credentials
- Rate limiting (429 errors)
- Invalid board/list/card IDs
- Permission errors

## Security Notes

- API credentials are passed via environment variables
- No credentials are logged or stored in plain text
- All API requests use HTTPS
- Rate limiting is respected to avoid API abuse

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the Trello API documentation: https://developer.atlassian.com/cloud/trello/rest
- Review MCP documentation: https://modelcontextprotocol.io
- Open an issue in this repository