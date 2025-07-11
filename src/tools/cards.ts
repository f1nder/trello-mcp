import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TrelloClient } from '../trello-client.js';
import { UnknownToolError, errorHandler } from '../error-handler.js';
import {
  GetCardsSchema,
  GetCardSchema,
  CreateCardSchema,
  UpdateCardSchema,
  MoveCardSchema,
  DeleteCardSchema,
  CardMemberSchema,
} from '../validation/cards.js';

export const cardTools = {
  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'get_cards',
        description: 'Get cards from a board or list',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'The ID of the board (if getting all cards from board)',
            },
            listId: {
              type: 'string',
              description: 'The ID of the list (if getting cards from specific list)',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_card',
        description: 'Get detailed information about a specific card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card',
            },
          },
          required: ['cardId'],
        },
      },
      {
        name: 'create_card',
        description: 'Create a new card in a list',
        inputSchema: {
          type: 'object',
          properties: {
            listId: {
              type: 'string',
              description: 'The ID of the list where the card will be created',
            },
            name: {
              type: 'string',
              description: 'The name/title of the card',
            },
            description: {
              type: 'string',
              description: 'The description of the card',
            },
            due: {
              type: 'string',
              description: 'Due date for the card (ISO 8601 format)',
            },
            position: {
              type: 'string',
              description: 'Position of the card (top, bottom, or a positive number)',
              default: 'bottom',
            },
          },
          required: ['listId', 'name'],
        },
      },
      {
        name: 'update_card',
        description: 'Update properties of an existing card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card to update',
            },
            name: {
              type: 'string',
              description: 'New name for the card',
            },
            description: {
              type: 'string',
              description: 'New description for the card',
            },
            due: {
              type: 'string',
              description: 'New due date (ISO 8601 format)',
            },
            dueComplete: {
              type: 'boolean',
              description: 'Whether the due date is complete',
            },
            closed: {
              type: 'boolean',
              description: 'Whether the card should be closed/archived',
            },
          },
          required: ['cardId'],
        },
      },
      {
        name: 'move_card',
        description: 'Move a card to a different list',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card to move',
            },
            listId: {
              type: 'string',
              description: 'The ID of the target list',
            },
            position: {
              type: 'string',
              description: 'Position in the target list (top, bottom, or a positive number)',
              default: 'bottom',
            },
          },
          required: ['cardId', 'listId'],
        },
      },
      {
        name: 'delete_card',
        description: 'Delete a card permanently',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card to delete',
            },
          },
          required: ['cardId'],
        },
      },
      {
        name: 'add_card_member',
        description: 'Add a member to a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card',
            },
            memberId: {
              type: 'string',
              description: 'The ID of the member to add',
            },
          },
          required: ['cardId', 'memberId'],
        },
      },
      {
        name: 'remove_card_member',
        description: 'Remove a member from a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card',
            },
            memberId: {
              type: 'string',
              description: 'The ID of the member to remove',
            },
          },
          required: ['cardId', 'memberId'],
        },
      },
    ];
  },

  hasToolHandler(name: string): boolean {
    return [
      'get_cards',
      'get_card',
      'create_card',
      'update_card',
      'move_card',
      'delete_card',
      'add_card_member',
      'remove_card_member',
    ].includes(name);
  },

  async handleToolCall(
    name: string,
    args: any,
    trelloClient: TrelloClient
  ): Promise<any> {
    try {
      switch (name) {
        case 'get_cards':
          return await this.getCards(args, trelloClient);

        case 'get_card':
          return await this.getCard(args, trelloClient);

        case 'create_card':
          return await this.createCard(args, trelloClient);

        case 'update_card':
          return await this.updateCard(args, trelloClient);

        case 'move_card':
          return await this.moveCard(args, trelloClient);

        case 'delete_card':
          return await this.deleteCard(args, trelloClient);

        case 'add_card_member':
          return await this.addCardMember(args, trelloClient);

        case 'remove_card_member':
          return await this.removeCardMember(args, trelloClient);

        default:
          throw new UnknownToolError(name);
      }
    } catch (error) {
      return errorHandler(error);
    }
  },

  async getCards(args: any, trelloClient: TrelloClient) {
    const { boardId, listId } = GetCardsSchema.parse(args);
    const cards = await trelloClient.getCards(boardId, listId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(cards, null, 2),
        },
      ],
    };
  },

  async getCard(args: any, trelloClient: TrelloClient) {
    const { cardId } = GetCardSchema.parse(args);
    const card = await trelloClient.getCard(cardId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(card, null, 2),
        },
      ],
    };
  },

  async createCard(args: any, trelloClient: TrelloClient) {
    const { listId, name, description, due, position } = CreateCardSchema.parse(args);
    const card = await trelloClient.createCard(listId, name, description, due, position);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(card, null, 2),
        },
      ],
    };
  },

  async updateCard(args: any, trelloClient: TrelloClient) {
    const { cardId, ...updates } = UpdateCardSchema.parse(args);
    const card = await trelloClient.updateCard(cardId, updates);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(card, null, 2),
        },
      ],
    };
  },

  async moveCard(args: any, trelloClient: TrelloClient) {
    const { cardId, listId, position } = MoveCardSchema.parse(args);
    const card = await trelloClient.moveCard(cardId, listId, position);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(card, null, 2),
        },
      ],
    };
  },

  async deleteCard(args: any, trelloClient: TrelloClient) {
    const { cardId } = DeleteCardSchema.parse(args);
    await trelloClient.deleteCard(cardId);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully deleted card ${cardId}`,
        },
      ],
    };
  },

  async addCardMember(args: any, trelloClient: TrelloClient) {
    const { cardId, memberId } = CardMemberSchema.parse(args);
    await trelloClient.addCardMember(cardId, memberId);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully added member ${memberId} to card ${cardId}`,
        },
      ],
    };
  },

  async removeCardMember(args: any, trelloClient: TrelloClient) {
    const { cardId, memberId } = CardMemberSchema.parse(args);
    await trelloClient.removeCardMember(cardId, memberId);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully removed member ${memberId} from card ${cardId}`,
        },
      ],
    };
  },
};
