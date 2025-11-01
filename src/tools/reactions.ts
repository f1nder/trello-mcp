import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TrelloClient } from '../trello-client.js';
import { UnknownToolError, errorHandler } from '../error-handler.js';
import { TrelloCreateReactionInput } from '../types/trello.js';
import {
  GetActionReactionsSchema,
  CreateActionReactionSchema,
  DeleteActionReactionSchema,
} from '../validation/reactions.js';

export const reactionTools = {
  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'get_action_reactions',
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
        name: 'create_action_reaction',
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
        name: 'delete_action_reaction',
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
      'get_action_reactions',
      'create_action_reaction',
      'delete_action_reaction',
    ].includes(name);
  },

  async handleToolCall(name: string, args: any, trelloClient: TrelloClient) {
    try {
      switch (name) {
        case 'get_action_reactions':
          return await this.getActionReactions(args, trelloClient);
        case 'create_action_reaction':
          return await this.createActionReaction(args, trelloClient);
        case 'delete_action_reaction':
          return await this.deleteActionReaction(args, trelloClient);
        default:
          throw new UnknownToolError(name);
      }
    } catch (error) {
      return errorHandler(error);
    }
  },

  async getActionReactions(args: any, trelloClient: TrelloClient) {
    const { actionId } = GetActionReactionsSchema.parse(args);
    const reactions = await trelloClient.getActionReactions(actionId);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(reactions, null, 2),
        },
      ],
    };
  },

  async createActionReaction(args: any, trelloClient: TrelloClient) {
    const { actionId, shortName, unified, native, skinVariation } =
      CreateActionReactionSchema.parse(args);

    const payload = Object.fromEntries(
      Object.entries({ shortName, unified, native, skinVariation }).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    ) as TrelloCreateReactionInput;

    const reaction = await trelloClient.createActionReaction(actionId, payload);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(reaction, null, 2),
        },
      ],
    };
  },

  async deleteActionReaction(args: any, trelloClient: TrelloClient) {
    const { actionId, reactionId } = DeleteActionReactionSchema.parse(args);
    await trelloClient.deleteActionReaction(actionId, reactionId);

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
