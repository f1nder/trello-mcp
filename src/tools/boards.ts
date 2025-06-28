import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TrelloClient } from '../trello-client.js';

const GetBoardSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
});

const GetBoardMembersSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
});

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
  ): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    switch (name) {
      case 'list_boards':
        return await this.listBoards(trelloClient);

      case 'get_board':
        return await this.getBoard(args, trelloClient);

      case 'get_board_members':
        return await this.getBoardMembers(args, trelloClient);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  },

  async listBoards(trelloClient: TrelloClient) {
    const boards = await trelloClient.getBoards();
    
    const boardsList = boards.map(board => ({
      id: board.id,
      name: board.name,
      description: board.desc,
      url: board.url,
      closed: board.closed,
      starred: board.starred,
      lastActivity: board.dateLastActivity,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(boardsList, null, 2),
        },
      ],
    };
  },

  async getBoard(args: any, trelloClient: TrelloClient) {
    const { boardId } = GetBoardSchema.parse(args);
    const board = await trelloClient.getBoard(boardId);

    const boardInfo = {
      id: board.id,
      name: board.name,
      description: board.desc,
      url: board.url,
      shortUrl: board.shortUrl,
      closed: board.closed,
      starred: board.starred,
      lastActivity: board.dateLastActivity,
      lists: board.lists?.map(list => ({
        id: list.id,
        name: list.name,
        closed: list.closed,
        position: list.pos,
      })),
      cards: board.cards?.map(card => ({
        id: card.id,
        name: card.name,
        description: card.desc,
        listId: card.idList,
        closed: card.closed,
        due: card.due,
        dueComplete: card.dueComplete,
        url: card.url,
        members: card.idMembers,
        labels: card.idLabels,
      })),
      labels: board.labels?.map(label => ({
        id: label.id,
        name: label.name,
        color: label.color,
      })),
      members: board.memberships?.map(membership => ({
        id: membership.idMember,
        type: membership.memberType,
        unconfirmed: membership.unconfirmed,
        deactivated: membership.deactivated,
      })),
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(boardInfo, null, 2),
        },
      ],
    };
  },

  async getBoardMembers(args: any, trelloClient: TrelloClient) {
    const { boardId } = GetBoardMembersSchema.parse(args);
    const members = await trelloClient.getBoardMembers(boardId);

    const membersList = members.map(member => ({
      id: member.id,
      username: member.username,
      fullName: member.fullName,
      initials: member.initials,
      avatarUrl: member.avatarUrl,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(membersList, null, 2),
        },
      ],
    };
  },
};