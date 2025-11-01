import { reactionTools } from '../src/tools/reactions';
import { TrelloClient } from '../src/trello-client';
import { TrelloReaction } from '../src/types/trello';

jest.mock('../src/trello-client');

const mockTrelloClient = new TrelloClient() as jest.Mocked<TrelloClient>;

const mockReaction: TrelloReaction = {
  id: 'reaction-id',
  idMember: 'member-id',
  idModel: 'action-id',
  idEmoji: 'emoji-id',
  date: '2025-11-01T08:00:00.000Z',
  modelType: 'action',
  type: 'reaction',
  emoji: {
    shortName: 'thumbsup',
    unified: '1F44D',
    native: '👍',
  },
};

describe('Reaction Tools', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get_reactions', () => {
    it('returns reactions for an action', async () => {
      const args = { actionId: 'action-id' };
      mockTrelloClient.getReactions.mockResolvedValue([mockReaction]);

      const result = await reactionTools.handleToolCall(
        'get_reactions',
        args,
        mockTrelloClient
      );

      expect(mockTrelloClient.getReactions).toHaveBeenCalledWith('action-id');
      expect(JSON.parse(result.content[0].text)[0]).toEqual(mockReaction);
    });

    it('handles errors when retrieving reactions', async () => {
      const args = { actionId: 'action-id' };
      mockTrelloClient.getReactions.mockRejectedValue(new Error('Not found'));

      const result = await reactionTools.handleToolCall(
        'get_reactions',
        args,
        mockTrelloClient
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('create_reaction', () => {
    it('creates a reaction for an action', async () => {
      const args = { actionId: 'action-id', shortName: 'thumbsup' };
      mockTrelloClient.createReaction.mockResolvedValue(mockReaction);

      const result = await reactionTools.handleToolCall(
        'create_reaction',
        args,
        mockTrelloClient
      );

      expect(mockTrelloClient.createReaction).toHaveBeenCalledWith(
        'action-id',
        {
          shortName: 'thumbsup',
        }
      );
      expect(JSON.parse(result.content[0].text)).toEqual(mockReaction);
    });

    it('handles errors when creating a reaction', async () => {
      const args = { actionId: 'action-id', shortName: 'thumbsup' };
      mockTrelloClient.createReaction.mockRejectedValue(new Error('Cannot react'));

      const result = await reactionTools.handleToolCall(
        'create_reaction',
        args,
        mockTrelloClient
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('delete_reaction', () => {
    it('removes a reaction from an action', async () => {
      const args = { actionId: 'action-id', reactionId: 'reaction-id' };
      mockTrelloClient.deleteReaction.mockResolvedValue(undefined);

      const result = await reactionTools.handleToolCall(
        'delete_reaction',
        args,
        mockTrelloClient
      );

      expect(mockTrelloClient.deleteReaction).toHaveBeenCalledWith(
        'action-id',
        'reaction-id'
      );
      expect(result.content[0].text).toContain('Successfully removed reaction');
    });

    it('handles errors when removing a reaction', async () => {
      const args = { actionId: 'action-id', reactionId: 'reaction-id' };
      mockTrelloClient.deleteReaction.mockRejectedValue(new Error('Cannot delete'));

      const result = await reactionTools.handleToolCall(
        'delete_reaction',
        args,
        mockTrelloClient
      );

      expect(result.isError).toBe(true);
    });
  });
});
