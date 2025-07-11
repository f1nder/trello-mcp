import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TrelloClient } from '../trello-client.js';
import { UnknownToolError, errorHandler } from '../error-handler.js';
import {
  GetLabelsSchema,
  CreateLabelSchema,
  CardLabelSchema,
} from '../validation/labels.js';

export const labelTools = {
  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'get_labels',
        description: 'Get all available labels for a board',
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
        name: 'create_label',
        description: 'Create a new label on a board',
        inputSchema: {
          type: 'object',
          properties: {
            boardId: {
              type: 'string',
              description: 'The ID of the board',
            },
            name: {
              type: 'string',
              description: 'The name of the label',
            },
            color: {
              type: 'string',
              description: 'The color of the label',
              enum: ['yellow', 'purple', 'blue', 'red', 'green', 'orange', 'black', 'sky', 'pink', 'lime'],
            },
          },
          required: ['boardId', 'name', 'color'],
        },
      },
      {
        name: 'add_card_label',
        description: 'Add a label to a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card',
            },
            labelId: {
              type: 'string',
              description: 'The ID of the label to add',
            },
          },
          required: ['cardId', 'labelId'],
        },
      },
      {
        name: 'remove_card_label',
        description: 'Remove a label from a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card',
            },
            labelId: {
              type: 'string',
              description: 'The ID of the label to remove',
            },
          },
          required: ['cardId', 'labelId'],
        },
      },
    ];
  },

  hasToolHandler(name: string): boolean {
    return ['get_labels', 'create_label', 'add_card_label', 'remove_card_label'].includes(name);
  },

  async handleToolCall(
    name: string,
    args: any,
    trelloClient: TrelloClient
  ): Promise<any> {
    try {
      switch (name) {
        case 'get_labels':
          return await this.getLabels(args, trelloClient);

        case 'create_label':
          return await this.createLabel(args, trelloClient);

        case 'add_card_label':
          return await this.addCardLabel(args, trelloClient);

        case 'remove_card_label':
          return await this.removeCardLabel(args, trelloClient);

        default:
          throw new UnknownToolError(name);
      }
    } catch (error) {
      return errorHandler(error);
    }
  },

  async getLabels(args: any, trelloClient: TrelloClient) {
    const { boardId } = GetLabelsSchema.parse(args);
    const labels = await trelloClient.getLabels(boardId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(labels, null, 2),
        },
      ],
    };
  },

  async createLabel(args: any, trelloClient: TrelloClient) {
    const { boardId, name, color } = CreateLabelSchema.parse(args);
    const label = await trelloClient.createLabel(boardId, name, color);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(label, null, 2),
        },
      ],
    };
  },

  async addCardLabel(args: any, trelloClient: TrelloClient) {
    const { cardId, labelId } = CardLabelSchema.parse(args);
    await trelloClient.addCardLabel(cardId, labelId);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully added label ${labelId} to card ${cardId}`,
        },
      ],
    };
  },

  async removeCardLabel(args: any, trelloClient: TrelloClient) {
    const { cardId, labelId } = CardLabelSchema.parse(args);
    await trelloClient.removeCardLabel(cardId, labelId);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully removed label ${labelId} from card ${cardId}`,
        },
      ],
    };
  },
};
