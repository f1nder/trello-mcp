import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TrelloClient } from '../trello-client.js';

const GetCardsSchema = z.object({
  boardId: z.string().optional(),
  listId: z.string().optional(),
}).refine(data => data.boardId || data.listId, {
  message: 'Either boardId or listId must be provided',
});

const GetCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
});

const CreateCardSchema = z.object({
  listId: z.string().min(1, 'List ID is required'),
  name: z.string().min(1, 'Card name is required'),
  description: z.string().optional(),
  due: z.string().optional(),
  position: z.string().optional(),
});

const UpdateCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  due: z.string().optional(),
  dueComplete: z.boolean().optional(),
  closed: z.boolean().optional(),
});

const MoveCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  listId: z.string().min(1, 'Target list ID is required'),
  position: z.string().optional(),
});

const DeleteCardSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
});

const CardMemberSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  memberId: z.string().min(1, 'Member ID is required'),
});

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
  ): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
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
        throw new Error(`Unknown tool: ${name}`);
    }
  },

  async getCards(args: any, trelloClient: TrelloClient) {
    const { boardId, listId } = GetCardsSchema.parse(args);
    const cards = await trelloClient.getCards(boardId, listId);

    const cardsList = cards.map(card => ({
      id: card.id,
      name: card.name,
      description: card.desc,
      listId: card.idList,
      boardId: card.idBoard,
      closed: card.closed,
      position: card.pos,
      url: card.url,
      shortUrl: card.shortUrl,
      due: card.due,
      dueComplete: card.dueComplete,
      lastActivity: card.dateLastActivity,
      members: card.idMembers,
      labels: card.idLabels,
      checklists: card.idChecklists,
      badges: {
        votes: card.badges.votes,
        comments: card.badges.comments,
        attachments: card.badges.attachments,
        checkItems: card.badges.checkItems,
        checkItemsChecked: card.badges.checkItemsChecked,
        description: card.badges.description,
      },
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(cardsList, null, 2),
        },
      ],
    };
  },

  async getCard(args: any, trelloClient: TrelloClient) {
    const { cardId } = GetCardSchema.parse(args);
    const card = await trelloClient.getCard(cardId);

    const cardInfo = {
      id: card.id,
      name: card.name,
      description: card.desc,
      listId: card.idList,
      boardId: card.idBoard,
      closed: card.closed,
      position: card.pos,
      url: card.url,
      shortUrl: card.shortUrl,
      due: card.due,
      dueComplete: card.dueComplete,
      lastActivity: card.dateLastActivity,
      members: card.members?.map(member => ({
        id: member.id,
        username: member.username,
        fullName: member.fullName,
        initials: member.initials,
      })),
      labels: card.labels?.map(label => ({
        id: label.id,
        name: label.name,
        color: label.color,
      })),
      checklists: card.checklists?.map(checklist => ({
        id: checklist.id,
        name: checklist.name,
        position: checklist.pos,
        checkItems: checklist.checkItems.map(item => ({
          id: item.id,
          name: item.name,
          state: item.state,
          position: item.pos,
          due: item.due,
        })),
      })),
      attachments: card.attachments?.map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        bytes: attachment.bytes,
        date: attachment.date,
      })),
      badges: card.badges,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(cardInfo, null, 2),
        },
      ],
    };
  },

  async createCard(args: any, trelloClient: TrelloClient) {
    const { listId, name, description, due, position } = CreateCardSchema.parse(args);
    const card = await trelloClient.createCard(listId, name, description, due, position);

    const cardInfo = {
      id: card.id,
      name: card.name,
      description: card.desc,
      listId: card.idList,
      boardId: card.idBoard,
      url: card.url,
      shortUrl: card.shortUrl,
      due: card.due,
      position: card.pos,
      message: `Successfully created card "${name}" in list ${listId}`,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(cardInfo, null, 2),
        },
      ],
    };
  },

  async updateCard(args: any, trelloClient: TrelloClient) {
    const { cardId, ...updates } = UpdateCardSchema.parse(args);
    
    // Convert description to desc for API compatibility
    const apiUpdates: any = { ...updates };
    if (updates.description !== undefined) {
      apiUpdates.desc = updates.description;
      delete apiUpdates.description;
    }

    const card = await trelloClient.updateCard(cardId, apiUpdates);

    const cardInfo = {
      id: card.id,
      name: card.name,
      description: card.desc,
      listId: card.idList,
      boardId: card.idBoard,
      closed: card.closed,
      due: card.due,
      dueComplete: card.dueComplete,
      url: card.url,
      message: `Successfully updated card ${cardId}`,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(cardInfo, null, 2),
        },
      ],
    };
  },

  async moveCard(args: any, trelloClient: TrelloClient) {
    const { cardId, listId, position } = MoveCardSchema.parse(args);
    const card = await trelloClient.moveCard(cardId, listId, position);

    const cardInfo = {
      id: card.id,
      name: card.name,
      listId: card.idList,
      boardId: card.idBoard,
      position: card.pos,
      url: card.url,
      message: `Successfully moved card "${card.name}" to list ${listId}`,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(cardInfo, null, 2),
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
          text: JSON.stringify({
            cardId,
            message: `Successfully deleted card ${cardId}`,
          }, null, 2),
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
          text: JSON.stringify({
            cardId,
            memberId,
            message: `Successfully added member ${memberId} to card ${cardId}`,
          }, null, 2),
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
          text: JSON.stringify({
            cardId,
            memberId,
            message: `Successfully removed member ${memberId} from card ${cardId}`,
          }, null, 2),
        },
      ],
    };
  },
};