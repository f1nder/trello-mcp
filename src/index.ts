#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { TrelloClient } from "./trello-client.js";
import { boardTools } from "./tools/boards.js";
import { listTools } from "./tools/lists.js";
import { cardTools } from "./tools/cards.js";
import { labelTools } from "./tools/labels.js";
import { checklistTools } from "./tools/checklists.js";
import { imageTools } from "./tools/images.js";

class TrelloMcpServer {
  private server: Server;
  private trelloClient: TrelloClient;

  constructor() {
    this.server = new Server(
      {
        name: "trello-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.trelloClient = new TrelloClient();
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          ...boardTools.getToolDefinitions(),
          ...listTools.getToolDefinitions(),
          ...cardTools.getToolDefinitions(),
          ...labelTools.getToolDefinitions(),
          ...checklistTools.getToolDefinitions(),
          ...imageTools.getToolDefinitions(),
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Board tools
        if (boardTools.hasToolHandler(name)) {
          return await boardTools.handleToolCall(name, args, this.trelloClient);
        }

        // List tools
        if (listTools.hasToolHandler(name)) {
          return await listTools.handleToolCall(name, args, this.trelloClient);
        }

        // Card tools
        if (cardTools.hasToolHandler(name)) {
          return await cardTools.handleToolCall(name, args, this.trelloClient);
        }

        // Label tools
        if (labelTools.hasToolHandler(name)) {
          return await labelTools.handleToolCall(name, args, this.trelloClient);
        }

        // Checklist tools
        if (checklistTools.hasToolHandler(name)) {
          return await checklistTools.handleToolCall(
            name,
            args,
            this.trelloClient
          );
        }

        // Image tools
        if (imageTools.hasToolHandler(name)) {
          return await imageTools.handleToolCall(name, args, this.trelloClient);
        }

        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${errorMessage}`
        );
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Server] Error:", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Trello MCP server running on stdio");
  }
}

const server = new TrelloMcpServer();
server.run().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
