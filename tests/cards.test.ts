import { cardTools } from '../src/tools/cards';
import { TrelloClient } from '../src/trello-client';
import { TrelloCard } from '../src/types/trello';

// Mock the TrelloClient
jest.mock('../src/trello-client');

const mockTrelloClient = new TrelloClient() as jest.Mocked<TrelloClient>;

const mockCard: TrelloCard = {
  id: 'test-card-id',
  name: 'Test Card',
  idList: 'test-list-id',
  idBoard: 'test-board-id',
  closed: false,
  due: undefined,
  dueComplete: false,
  desc: '',
  pos: 1,
  url: '',
  labels: [],
  idChecklists: [],
  idMembers: [],
  idLabels: [],
  shortUrl: '',
  dateLastActivity: '',
  badges: {
    votes: 0,
    viewingMemberVoted: false,
    subscribed: false,
    fogbugz: '',
    checkItems: 0,
    checkItemsChecked: 0,
    comments: 0,
    attachments: 0,
    description: false,
    due: undefined,
    dueComplete: false,
  },
};

describe('Card Tools', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get_cards', () => {
    it('should return cards from a board', async () => {
      const args = { boardId: 'test-board-id' };
      mockTrelloClient.getCards.mockResolvedValue([mockCard]);

      const result = await cardTools.handleToolCall('get_cards', args, mockTrelloClient);

      expect(mockTrelloClient.getCards).toHaveBeenCalledWith('test-board-id', undefined);
      expect(JSON.parse(result.content[0].text)[0]).toEqual(mockCard);
    });

    it('should handle errors when getting cards', async () => {
      const args = { boardId: 'test-board-id' };
      mockTrelloClient.getCards.mockRejectedValue(new Error('Not found'));
      const result = await cardTools.handleToolCall('get_cards', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('get_card', () => {
    it('should return a card', async () => {
      const args = { cardId: 'test-card-id' };
      mockTrelloClient.getCard.mockResolvedValue(mockCard);

      const result = await cardTools.handleToolCall('get_card', args, mockTrelloClient);

      expect(mockTrelloClient.getCard).toHaveBeenCalledWith('test-card-id');
      expect(JSON.parse(result.content[0].text)).toEqual(mockCard);
    });

    it('should handle errors when getting a card', async () => {
      const args = { cardId: 'test-card-id' };
      mockTrelloClient.getCard.mockRejectedValue(new Error('Not found'));
      const result = await cardTools.handleToolCall('get_card', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('create_card', () => {
    it('should create a card', async () => {
      const args = { listId: 'test-list-id', name: 'New Card' };
      mockTrelloClient.createCard.mockResolvedValue(mockCard);

      const result = await cardTools.handleToolCall('create_card', args, mockTrelloClient);

      expect(mockTrelloClient.createCard).toHaveBeenCalledWith('test-list-id', 'New Card', undefined, undefined, 'bottom');
      expect(JSON.parse(result.content[0].text)).toEqual(mockCard);
    });

    it('should handle errors when creating a card', async () => {
      const args = { listId: 'test-list-id', name: 'New Card' };
      mockTrelloClient.createCard.mockRejectedValue(new Error('Could not create'));
      const result = await cardTools.handleToolCall('create_card', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('update_card', () => {
    it('should update a card', async () => {
      const args = { cardId: 'test-card-id', name: 'Updated Card' };
      mockTrelloClient.updateCard.mockResolvedValue({ ...mockCard, name: 'Updated Card' });

      const result = await cardTools.handleToolCall('update_card', args, mockTrelloClient);

      expect(mockTrelloClient.updateCard).toHaveBeenCalledWith('test-card-id', { name: 'Updated Card' });
      expect(JSON.parse(result.content[0].text).name).toEqual('Updated Card');
    });

    it('should handle errors when updating a card', async () => {
      const args = { cardId: 'test-card-id', name: 'Updated Card' };
      mockTrelloClient.updateCard.mockRejectedValue(new Error('Could not update'));
      const result = await cardTools.handleToolCall('update_card', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('move_card', () => {
    it('should move a card', async () => {
      const args = { cardId: 'test-card-id', listId: 'new-list-id' };
      mockTrelloClient.moveCard.mockResolvedValue({ ...mockCard, idList: 'new-list-id' });

      const result = await cardTools.handleToolCall('move_card', args, mockTrelloClient);

      expect(mockTrelloClient.moveCard).toHaveBeenCalledWith('test-card-id', 'new-list-id', 'bottom');
      expect(JSON.parse(result.content[0].text).idList).toEqual('new-list-id');
    });

    it('should handle errors when moving a card', async () => {
      const args = { cardId: 'test-card-id', listId: 'new-list-id' };
      mockTrelloClient.moveCard.mockRejectedValue(new Error('Could not move'));
      const result = await cardTools.handleToolCall('move_card', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('delete_card', () => {
    it('should delete a card', async () => {
      const args = { cardId: 'test-card-id' };
      mockTrelloClient.deleteCard.mockResolvedValue(undefined);

      const result = await cardTools.handleToolCall('delete_card', args, mockTrelloClient);

      expect(mockTrelloClient.deleteCard).toHaveBeenCalledWith('test-card-id');
      expect(result.content[0].text).toContain('Successfully deleted');
    });

    it('should handle errors when deleting a card', async () => {
      const args = { cardId: 'test-card-id' };
      mockTrelloClient.deleteCard.mockRejectedValue(new Error('Could not delete'));
      const result = await cardTools.handleToolCall('delete_card', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('add_card_member', () => {
    it('should add a member to a card', async () => {
      const args = { cardId: 'test-card-id', memberId: 'test-member-id' };
      mockTrelloClient.addCardMember.mockResolvedValue(undefined);

      const result = await cardTools.handleToolCall('add_card_member', args, mockTrelloClient);

      expect(mockTrelloClient.addCardMember).toHaveBeenCalledWith('test-card-id', 'test-member-id');
      expect(result.content[0].text).toContain('Successfully added member');
    });

    it('should handle errors when adding a member', async () => {
      const args = { cardId: 'test-card-id', memberId: 'test-member-id' };
      mockTrelloClient.addCardMember.mockRejectedValue(new Error('Could not add member'));
      const result = await cardTools.handleToolCall('add_card_member', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('remove_card_member', () => {
    it('should remove a member from a card', async () => {
      const args = { cardId: 'test-card-id', memberId: 'test-member-id' };
      mockTrelloClient.removeCardMember.mockResolvedValue(undefined);

      const result = await cardTools.handleToolCall('remove_card_member', args, mockTrelloClient);

      expect(mockTrelloClient.removeCardMember).toHaveBeenCalledWith('test-card-id', 'test-member-id');
      expect(result.content[0].text).toContain('Successfully removed member');
    });

    it('should handle errors when removing a member', async () => {
      const args = { cardId: 'test-card-id', memberId: 'test-member-id' };
      mockTrelloClient.removeCardMember.mockRejectedValue(new Error('Could not remove member'));
      const result = await cardTools.handleToolCall('remove_card_member', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('handleToolCall', () => {
    it('should throw an error for an unknown tool', async () => {
      const result = await cardTools.handleToolCall('unknown_tool', {}, mockTrelloClient);
      expect(result.isError).toBe(true);
      expect(result.message).toBe('Unknown tool: unknown_tool');
    });
  });
});
