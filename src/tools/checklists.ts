import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TrelloClient } from '../trello-client.js';
import { UnknownToolError, errorHandler } from '../error-handler.js';
import {
  GetCardChecklistsSchema,
  CreateChecklistSchema,
  AddChecklistItemSchema,
  UpdateChecklistItemSchema,
  DeleteChecklistSchema,
  DeleteChecklistItemSchema,
} from '../validation/checklists.js';

export const checklistTools = {
  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'get_card_checklists',
        description: 'Get all checklists on a card',
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
        name: 'create_checklist',
        description: 'Create a new checklist on a card',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card',
            },
            name: {
              type: 'string',
              description: 'The name of the checklist',
            },
          },
          required: ['cardId', 'name'],
        },
      },
      {
        name: 'add_checklist_item',
        description: 'Add an item to a checklist',
        inputSchema: {
          type: 'object',
          properties: {
            checklistId: {
              type: 'string',
              description: 'The ID of the checklist',
            },
            name: {
              type: 'string',
              description: 'The name of the checklist item',
            },
            position: {
              type: 'string',
              description: 'Position of the item (top, bottom, or a positive number)',
              default: 'bottom',
            },
          },
          required: ['checklistId', 'name'],
        },
      },
      {
        name: 'update_checklist_item',
        description: 'Update the state of a checklist item (mark as complete or incomplete)',
        inputSchema: {
          type: 'object',
          properties: {
            cardId: {
              type: 'string',
              description: 'The ID of the card containing the checklist',
            },
            itemId: {
              type: 'string',
              description: 'The ID of the checklist item',
            },
            state: {
              type: 'string',
              description: 'The new state of the item',
              enum: ['complete', 'incomplete'],
            },
          },
          required: ['cardId', 'itemId', 'state'],
        },
      },
      {
        name: 'delete_checklist',
        description: 'Delete a checklist from a card',
        inputSchema: {
          type: 'object',
          properties: {
            checklistId: {
              type: 'string',
              description: 'The ID of the checklist to delete',
            },
          },
          required: ['checklistId'],
        },
      },
      {
        name: 'delete_checklist_item',
        description: 'Delete a checklist item from a checklist',
        inputSchema: {
          type: 'object',
          properties: {
            checklistId: {
              type: 'string',
              description: 'The ID of the checklist',
            },
            itemId: {
              type: 'string',
              description: 'The ID of the checklist item to delete',
            },
          },
          required: ['checklistId', 'itemId'],
        },
      },
    ];
  },

  hasToolHandler(name: string): boolean {
    return [
      'get_card_checklists',
      'create_checklist',
      'add_checklist_item',
      'update_checklist_item',
      'delete_checklist',
      'delete_checklist_item',
    ].includes(name);
  },

  async handleToolCall(
    name: string,
    args: any,
    trelloClient: TrelloClient
  ): Promise<any> {
    try {
      switch (name) {
        case 'get_card_checklists':
          return await this.getCardChecklists(args, trelloClient);

        case 'create_checklist':
          return await this.createChecklist(args, trelloClient);

        case 'add_checklist_item':
          return await this.addChecklistItem(args, trelloClient);

        case 'update_checklist_item':
          return await this.updateChecklistItem(args, trelloClient);

        case 'delete_checklist':
          return await this.deleteChecklist(args, trelloClient);

        case 'delete_checklist_item':
          return await this.deleteChecklistItem(args, trelloClient);

        default:
          throw new UnknownToolError(name);
      }
    } catch (error) {
      return errorHandler(error);
    }
  },

  async getCardChecklists(args: any, trelloClient: TrelloClient) {
    const { cardId } = GetCardChecklistsSchema.parse(args);
    const checklists = await trelloClient.getCardChecklists(cardId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(checklists, null, 2),
        },
      ],
    };
  },

  async createChecklist(args: any, trelloClient: TrelloClient) {
    const { cardId, name } = CreateChecklistSchema.parse(args);
    const checklist = await trelloClient.createChecklist(cardId, name);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(checklist, null, 2),
        },
      ],
    };
  },

  async addChecklistItem(args: any, trelloClient: TrelloClient) {
    const { checklistId, name, position } = AddChecklistItemSchema.parse(args);
    const item = await trelloClient.addChecklistItem(checklistId, name, position);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(item, null, 2),
        },
      ],
    };
  },

  async updateChecklistItem(args: any, trelloClient: TrelloClient) {
    const { cardId, itemId, state } = UpdateChecklistItemSchema.parse(args);
    await trelloClient.updateChecklistItem(cardId, itemId, state);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully updated checklist item ${itemId} to ${state}`,
        },
      ],
    };
  },

  async deleteChecklist(args: any, trelloClient: TrelloClient) {
    const { checklistId } = DeleteChecklistSchema.parse(args);
    await trelloClient.deleteChecklist(checklistId);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully deleted checklist ${checklistId}`,
        },
      ],
    };
  },

  async deleteChecklistItem(args: any, trelloClient: TrelloClient) {
    const { checklistId, itemId } = DeleteChecklistItemSchema.parse(args);
    await trelloClient.deleteChecklistItem(checklistId, itemId);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully deleted checklist item ${itemId} from checklist ${checklistId}`,
        },
      ],
    };
  },
};
