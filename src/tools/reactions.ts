import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TrelloClient } from '../trello-client.js';
import { UnknownToolError, errorHandler } from '../error-handler.js';
import { TrelloCreateReactionInput } from '../types/trello.js';
import {
  GetReactionsSchema,
  CreateReactionSchema,
  DeleteReactionSchema,
} from '../validation/reactions.js';

export const reactionTools = {
  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'get_reactions',
        description: 'List all reactions attached to a specific Trello action (e.g., a comment)',
        inputSchema: {
          type: 'object',
          properties: {
            actionId: {
              type: 'string',
              description: 'The Trello action ID (typically the comment action) to inspect',
            },
          },
          required: ['actionId'],
        },
      },
      {
        name: 'create_reaction',
        description: 'Add a reaction to a Trello action using emoji identifiers',
        inputSchema: {
          type: 'object',
          properties: {
            actionId: {
              type: 'string',
              description: 'The Trello action ID to react to',
            },
            shortName: {
              type: 'string',
              description: 'Emoji short name (e.g., thumbsup)',
            },
            unified: {
              type: 'string',
              description: 'Unicode codepoint string (e.g., 1F44D)',
            },
            native: {
              type: 'string',
              description: 'Native emoji character (e.g., 👍)',
            },
            skinVariation: {
              type: 'string',
              description: 'Optional skin tone variation string (e.g., 1F3FD)',
            },
          },
          required: ['actionId'],
        },
      },
      {
        name: 'delete_reaction',
        description: 'Remove a specific reaction from a Trello action',
        inputSchema: {
          type: 'object',
          properties: {
            actionId: {
              type: 'string',
              description: 'The Trello action ID hosting the reaction',
            },
            reactionId: {
              type: 'string',
              description: 'The reaction ID to remove',
            },
          },
          required: ['actionId', 'reactionId'],
        },
      },
    ];
  },

  hasToolHandler(name: string): boolean {
    return [
      'get_reactions',
      'create_reaction',
      'delete_reaction',
    ].includes(name);
  },

  async handleToolCall(name: string, args: any, trelloClient: TrelloClient) {
    try {
      switch (name) {
        case 'get_reactions':
          return await this.getReactions(args, trelloClient);
        case 'create_reaction':
          return await this.createReaction(args, trelloClient);
        case 'delete_reaction':
          return await this.deleteReaction(args, trelloClient);
        default:
          throw new UnknownToolError(name);
      }
    } catch (error) {
      return errorHandler(error);
    }
  },

  async getReactions(args: any, trelloClient: TrelloClient) {
    const { actionId } = GetReactionsSchema.parse(args);
    const reactions = await trelloClient.getReactions(actionId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(reactions, null, 2),
        },
      ],
    };
  },

  async createReaction(args: any, trelloClient: TrelloClient) {
    const { actionId, shortName, unified, native, skinVariation } =
      CreateReactionSchema.parse(args);

    const payload = Object.fromEntries(
      Object.entries({ shortName, unified, native, skinVariation }).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    ) as TrelloCreateReactionInput;

    const reaction = await trelloClient.createReaction(actionId, payload);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(reaction, null, 2),
        },
      ],
    };
  },

  async deleteReaction(args: any, trelloClient: TrelloClient) {
    const { actionId, reactionId } = DeleteReactionSchema.parse(args);
    await trelloClient.deleteReaction(actionId, reactionId);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully removed reaction ${reactionId} from action ${actionId}`,
        },
      ],
    };
  },
};
