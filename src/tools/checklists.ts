import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TrelloClient } from '../trello-client.js';

const GetCardChecklistsSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
});

const CreateChecklistSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  name: z.string().min(1, 'Checklist name is required'),
});

const AddChecklistItemSchema = z.object({
  checklistId: z.string().min(1, 'Checklist ID is required'),
  name: z.string().min(1, 'Item name is required'),
  position: z.string().optional(),
});

const UpdateChecklistItemSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  itemId: z.string().min(1, 'Item ID is required'),
  state: z.enum(['complete', 'incomplete']),
});

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
    ];
  },

  hasToolHandler(name: string): boolean {
    return [
      'get_card_checklists',
      'create_checklist',
      'add_checklist_item',
      'update_checklist_item',
    ].includes(name);
  },

  async handleToolCall(
    name: string,
    args: any,
    trelloClient: TrelloClient
  ): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
    switch (name) {
      case 'get_card_checklists':
        return await this.getCardChecklists(args, trelloClient);

      case 'create_checklist':
        return await this.createChecklist(args, trelloClient);

      case 'add_checklist_item':
        return await this.addChecklistItem(args, trelloClient);

      case 'update_checklist_item':
        return await this.updateChecklistItem(args, trelloClient);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  },

  async getCardChecklists(args: any, trelloClient: TrelloClient) {
    const { cardId } = GetCardChecklistsSchema.parse(args);
    const checklists = await trelloClient.getCardChecklists(cardId);

    const checklistsInfo = checklists.map(checklist => ({
      id: checklist.id,
      name: checklist.name,
      cardId: checklist.idCard,
      boardId: checklist.idBoard,
      position: checklist.pos,
      checkItems: checklist.checkItems.map(item => ({
        id: item.id,
        name: item.name,
        state: item.state,
        position: item.pos,
        due: item.due,
        idMember: item.idMember,
      })),
      progress: {
        total: checklist.checkItems.length,
        completed: checklist.checkItems.filter(item => item.state === 'complete').length,
      },
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(checklistsInfo, null, 2),
        },
      ],
    };
  },

  async createChecklist(args: any, trelloClient: TrelloClient) {
    const { cardId, name } = CreateChecklistSchema.parse(args);
    const checklist = await trelloClient.createChecklist(cardId, name);

    const checklistInfo = {
      id: checklist.id,
      name: checklist.name,
      cardId: checklist.idCard,
      boardId: checklist.idBoard,
      position: checklist.pos,
      checkItems: checklist.checkItems,
      message: `Successfully created checklist "${name}" on card ${cardId}`,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(checklistInfo, null, 2),
        },
      ],
    };
  },

  async addChecklistItem(args: any, trelloClient: TrelloClient) {
    const { checklistId, name, position } = AddChecklistItemSchema.parse(args);
    const item = await trelloClient.addChecklistItem(checklistId, name, position);

    const itemInfo = {
      id: item.id,
      name: item.name,
      state: item.state,
      position: item.pos,
      checklistId: item.idChecklist,
      due: item.due,
      idMember: item.idMember,
      message: `Successfully added item "${name}" to checklist ${checklistId}`,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(itemInfo, null, 2),
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
          text: JSON.stringify({
            cardId,
            itemId,
            state,
            message: `Successfully updated checklist item ${itemId} to ${state}`,
          }, null, 2),
        },
      ],
    };
  },
};