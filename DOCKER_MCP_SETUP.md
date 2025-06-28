# Docker Desktop MCP Integration Guide

This guide explains how to use the Trello MCP Server with Docker Desktop's built-in MCP support.

## Prerequisites

- Docker Desktop v4.38 or later
- Trello API credentials (API key and token)

## Option 1: Docker MCP Catalog & Toolkit (Recommended)

### Step 1: Enable Docker MCP Extension

1. Open Docker Desktop
2. Navigate to **Extensions** → **Browse**
3. Search for "MCP" or "Model Context Protocol"
4. Install the **Docker MCP Catalog and Toolkit** extension

### Step 2: Prepare Your MCP Server

1. Build your Trello MCP server:
   ```bash
   npm run build
   docker build -t trello-mcp-server .
   ```

2. Tag for Docker Hub MCP namespace (optional):
   ```bash
   docker tag trello-mcp-server mcp/trello-server
   ```

### Step 3: Configure Claude Desktop with Docker MCP

Edit your Claude Desktop configuration to use Docker:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "trello": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--env-file", ".env",
        "trello-mcp-server"
      ],
      "env": {
        "DOCKER_HOST": "unix:///var/run/docker.sock"
      }
    }
  }
}
```

### Step 4: Use with Ask Gordon (Docker AI)

1. Create `gordon-mcp.yml` in your project directory:
   ```yaml
   version: '3.8'
   services:
     trello-mcp:
       image: trello-mcp-server
       environment:
         - TRELLO_API_KEY=${TRELLO_API_KEY}
         - TRELLO_TOKEN=${TRELLO_TOKEN}
         - LOG_LEVEL=info
       volumes:
         - ./logs:/app/logs
   ```

2. Use Docker AI commands:
   ```bash
   # Ask Gordon to interact with Trello
   docker ai "Show me my Trello boards"
   docker ai "Create a new card 'Fix Docker integration' in my Development board"
   docker ai "Move the card about API testing to the Done list"
   ```

## Option 2: Docker Hub MCP Catalog

### Publishing to MCP Catalog

1. **Build for multiple architectures**:
   ```bash
   docker buildx create --use
   docker buildx build --platform linux/amd64,linux/arm64 -t mcp/trello-server --push .
   ```

2. **Add MCP metadata** (create `mcp-metadata.json`):
   ```json
   {
     "name": "trello-server",
     "description": "Trello MCP Server for board and card management",
     "version": "1.0.0",
     "author": "Your Name",
     "license": "MIT",
     "capabilities": [
       "board_management",
       "list_operations", 
       "card_operations",
       "label_management",
       "checklist_management"
     ],
     "environment": {
       "required": ["TRELLO_API_KEY", "TRELLO_TOKEN"],
       "optional": ["LOG_LEVEL", "API_TIMEOUT"]
     },
     "ports": [],
     "volumes": ["./logs:/app/logs"]
   }
   ```

3. **Submit to MCP Catalog**:
   - Visit Docker Hub MCP Catalog
   - Submit your server for verification
   - Once approved, users can discover and use with one-click setup

## Benefits of Docker Desktop MCP

### Security Features
- **Secure Credential Storage**: OAuth support and encrypted environment variables
- **Container Isolation**: Memory, network, and disk isolation by default
- **No Hardcoded Secrets**: Credentials managed through Docker's secure storage

### Developer Experience
- **One-Click Setup**: Install and configure MCP servers from the catalog
- **Cross-Platform**: Consistent behavior across Windows, macOS, and Linux
- **Version Management**: Easy rollback and updates through Docker images
- **Resource Management**: Automatic cleanup and resource limits

### Integration Features
- **Ask Gordon Integration**: Natural language Docker and MCP management
- **IDE Support**: Works with Claude, Cursor, VSCode, Windsurf, and other MCP clients
- **Compose Support**: Use with Docker Compose for complex setups
- **Health Checks**: Built-in monitoring and restart capabilities

## Troubleshooting

### Common Issues

1. **Docker MCP Extension Not Found**:
   - Ensure Docker Desktop v4.38+
   - Check Extensions → Browse → Search for "MCP"
   - Restart Docker Desktop if needed

2. **Permission Errors**:
   ```bash
   # Ensure Docker socket access
   sudo chmod 666 /var/run/docker.sock
   ```

3. **Environment Variables Not Loading**:
   ```bash
   # Verify .env file format
   cat .env
   
   # Test with explicit variables
   docker run --rm -e TRELLO_API_KEY=test -e TRELLO_TOKEN=test trello-mcp-server
   ```

4. **Gordon MCP Not Working**:
   - Ensure `gordon-mcp.yml` is in the current directory
   - Check Docker AI is enabled: `docker ai --help`
   - Verify services are running: `docker compose -f gordon-mcp.yml ps`

### Health Check Commands

```bash
# Check MCP server health
docker exec trello-mcp node -e "console.log('MCP Health Check')"

# Monitor logs
docker logs trello-mcp --follow

# Test MCP connectivity
docker run --rm -i trello-mcp-server
```

## Advanced Configuration

### Custom Network Setup
```yaml
version: '3.8'
services:
  trello-mcp:
    image: trello-mcp-server
    networks:
      - mcp-network
    environment:
      - TRELLO_API_KEY=${TRELLO_API_KEY}
      - TRELLO_TOKEN=${TRELLO_TOKEN}

networks:
  mcp-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Resource Limits
```yaml
version: '3.8'
services:
  trello-mcp:
    image: trello-mcp-server
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Production Setup
```yaml
version: '3.8'
services:
  trello-mcp:
    image: mcp/trello-server:latest
    restart: always
    environment:
      - TRELLO_API_KEY=${TRELLO_API_KEY}
      - TRELLO_TOKEN=${TRELLO_TOKEN}
      - LOG_LEVEL=warn
    volumes:
      - mcp-logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('healthy')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  mcp-logs:
```

This setup provides a robust, secure, and scalable way to run your Trello MCP server using Docker Desktop's native MCP support.