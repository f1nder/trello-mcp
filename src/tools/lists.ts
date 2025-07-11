import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TrelloClient } from '../trello-client.js';
import { UnknownToolError, errorHandler } from '../error-handler.js';
import {
  GetListsSchema,
  CreateListSchema,
  UpdateListSchema,
} from '../validation/lists.js';

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
  ): Promise<any> {
    try {
      switch (name) {
        case 'get_lists':
          return await this.getLists(args, trelloClient);

        case 'create_list':
          return await this.createList(args, trelloClient);

        case 'update_list':
          return await this.updateList(args, trelloClient);

        default:
          throw new UnknownToolError(name);
      }
    } catch (error) {
      return errorHandler(error);
    }
  },

  async getLists(args: any, trelloClient: TrelloClient) {
    const { boardId } = GetListsSchema.parse(args);
    const lists = await trelloClient.getLists(boardId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(lists, null, 2),
        },
      ],
    };
  },

  async createList(args: any, trelloClient: TrelloClient) {
    const { boardId, name, position } = CreateListSchema.parse(args);
    const list = await trelloClient.createList(boardId, name, position);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(list, null, 2),
        },
      ],
    };
  },

  async updateList(args: any, trelloClient: TrelloClient) {
    const { listId, ...updates } = UpdateListSchema.parse(args);
    const list = await trelloClient.updateList(listId, updates);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(list, null, 2),
        },
      ],
    };
  },
};
