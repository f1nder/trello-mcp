import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TrelloClient } from '../trello-client.js';
import { UnknownToolError, errorHandler } from '../error-handler.js';
import { GetBoardSchema, GetBoardMembersSchema } from '../validation/boards.js';

export const boardTools = {
  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'list_boards',
        description: 'Get all boards accessible to the authenticated user',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_board',
        description: 'Get detailed information about a specific board including lists, cards, and members',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'The ID of the board to retrieve',
            },
          },
          required: ['boardId'],
        },
      },
      {
        name: 'get_board_members',
        description: 'Get all members of a specific board',
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
    ];
  },

  hasToolHandler(name: string): boolean {
    return ['list_boards', 'get_board', 'get_board_members'].includes(name);
  },

  async handleToolCall(
    name: string,
    args: any,
    trelloClient: TrelloClient
  ): Promise<any> {
    try {
      switch (name) {
        case 'list_boards':
          return await this.listBoards(trelloClient);

        case 'get_board':
          return await this.getBoard(args, trelloClient);

        case 'get_board_members':
          return await this.getBoardMembers(args, trelloClient);

        default:
          throw new UnknownToolError(name);
      }
    } catch (error) {
      return errorHandler(error);
    }
  },

  async listBoards(trelloClient: TrelloClient) {
    const boards = await trelloClient.getBoards();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(boards, null, 2),
        },
      ],
    };
  },

  async getBoard(args: any, trelloClient: TrelloClient) {
    const { boardId } = GetBoardSchema.parse(args);
    const board = await trelloClient.getBoard(boardId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(board, null, 2),
        },
      ],
    };
  },

  async getBoardMembers(args: any, trelloClient: TrelloClient) {
    const { boardId } = GetBoardMembersSchema.parse(args);
    const members = await trelloClient.getBoardMembers(boardId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(members, null, 2),
        },
      ],
    };
  },
};
