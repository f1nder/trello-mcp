import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TrelloClient } from '../trello-client.js';

const GetListsSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
});

const CreateListSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  name: z.string().min(1, 'List name is required'),
  position: z.string().optional(),
});

const UpdateListSchema = z.object({
  listId: z.string().min(1, 'List ID is required'),
  name: z.string().optional(),
  closed: z.boolean().optional(),
  position: z.number().optional(),
});

export const listTools = {
  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'get_lists',
        description: 'Get all lists in a board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'The ID of the board',
            },
          },
          required: ['boardId'],
        },
      },
      {
        name: 'create_list',
        description: 'Create a new list in a board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'The ID of the board',
            },
            name: {
              type: 'string',
              description: 'The name of the new list',
            },
            position: {
              type: 'string',
              description: 'Position of the list (top, bottom, or a positive number)',
              default: 'bottom',
            },
          },
          required: ['boardId', 'name'],
        },
      },
      {
        name: 'update_list',
        description: 'Update properties of an existing list',
        inputSchema: {
          type: 'object',
          properties: {
            listId: {
              type: 'string',
              description: 'The ID of the list to update',
            },
            name: {
              type: 'string',
              description: 'New name for the list',
            },
            closed: {
              type: 'boolean',
              description: 'Whether the list should be closed/archived',
            },
            position: {
              type: 'number',
              description: 'New position for the list',
            },
          },
          required: ['listId'],
        },
      },
    ];
  },

  hasToolHandler(name: string): boolean {
    return ['get_lists', 'create_list', 'update_list'].includes(name);
  },

  async handleToolCall(
    name: string,
    args: any,
    trelloClient: TrelloClient
  ): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    switch (name) {
      case 'get_lists':
        return await this.getLists(args, trelloClient);

      case 'create_list':
        return await this.createList(args, trelloClient);

      case 'update_list':
        return await this.updateList(args, trelloClient);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  },

  async getLists(args: any, trelloClient: TrelloClient) {
    const { boardId } = GetListsSchema.parse(args);
    const lists = await trelloClient.getLists(boardId);

    const listInfo = lists.map(list => ({
      id: list.id,
      name: list.name,
      closed: list.closed,
      position: list.pos,
      boardId: list.idBoard,
      subscribed: list.subscribed,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(listInfo, null, 2),
        },
      ],
    };
  },

  async createList(args: any, trelloClient: TrelloClient) {
    const { boardId, name, position } = CreateListSchema.parse(args);
    const list = await trelloClient.createList(boardId, name, position);

    const listInfo = {
      id: list.id,
      name: list.name,
      closed: list.closed,
      position: list.pos,
      boardId: list.idBoard,
      message: `Successfully created list "${name}" in board ${boardId}`,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(listInfo, null, 2),
        },
      ],
    };
  },

  async updateList(args: any, trelloClient: TrelloClient) {
    const { listId, ...updates } = UpdateListSchema.parse(args);
    
    // Convert position to pos for API compatibility
    const apiUpdates: any = { ...updates };
    if (updates.position !== undefined) {
      apiUpdates.pos = updates.position;
      delete apiUpdates.position;
    }

    const list = await trelloClient.updateList(listId, apiUpdates);

    const listInfo = {
      id: list.id,
      name: list.name,
      closed: list.closed,
      position: list.pos,
      boardId: list.idBoard,
      message: `Successfully updated list ${listId}`,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(listInfo, null, 2),
        },
      ],
    };
  },
};