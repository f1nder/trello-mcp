import { labelTools } from '../src/tools/labels';
import { TrelloClient } from '../src/trello-client';
import { TrelloLabel } from '../src/types/trello';

// Mock the TrelloClient
jest.mock('../src/trello-client');

const mockTrelloClient = new TrelloClient() as jest.Mocked<TrelloClient>;

const mockLabel: TrelloLabel = {
  id: 'test-label-id',
  name: 'Test Label',
  color: 'blue',
  idBoard: 'test-board-id',
  uses: 0,
};

describe('Label Tools', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get_labels', () => {
    it('should return labels for a board', async () => {
      const args = { boardId: 'test-board-id' };
      mockTrelloClient.getLabels.mockResolvedValue([mockLabel]);

      const result = await labelTools.handleToolCall('get_labels', args, mockTrelloClient);

      expect(mockTrelloClient.getLabels).toHaveBeenCalledWith('test-board-id');
      expect(JSON.parse(result.content[0].text)[0]).toEqual(mockLabel);
    });

    it('should handle errors when getting labels', async () => {
      const args = { boardId: 'test-board-id' };
      mockTrelloClient.getLabels.mockRejectedValue(new Error('Not found'));
      const result = await labelTools.handleToolCall('get_labels', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('create_label', () => {
    it('should create a label', async () => {
      const args = { boardId: 'test-board-id', name: 'New Label', color: 'blue' };
      mockTrelloClient.createLabel.mockResolvedValue(mockLabel);

      const result = await labelTools.handleToolCall('create_label', args, mockTrelloClient);

      expect(mockTrelloClient.createLabel).toHaveBeenCalledWith('test-board-id', 'New Label', 'blue');
      expect(JSON.parse(result.content[0].text)).toEqual(mockLabel);
    });

    it('should handle errors when creating a label', async () => {
      const args = { boardId: 'test-board-id', name: 'New Label', color: 'blue' };
      mockTrelloClient.createLabel.mockRejectedValue(new Error('Could not create'));
      const result = await labelTools.handleToolCall('create_label', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('add_card_label', () => {
    it('should add a label to a card', async () => {
      const args = { cardId: 'test-card-id', labelId: 'test-label-id' };
      mockTrelloClient.addCardLabel.mockResolvedValue(undefined);

      const result = await labelTools.handleToolCall('add_card_label', args, mockTrelloClient);

      expect(mockTrelloClient.addCardLabel).toHaveBeenCalledWith('test-card-id', 'test-label-id');
      expect(result.content[0].text).toContain('Successfully added label');
    });

    it('should handle errors when adding a label', async () => {
      const args = { cardId: 'test-card-id', labelId: 'test-label-id' };
      mockTrelloClient.addCardLabel.mockRejectedValue(new Error('Could not add'));
      const result = await labelTools.handleToolCall('add_card_label', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('remove_card_label', () => {
    it('should remove a label from a card', async () => {
      const args = { cardId: 'test-card-id', labelId: 'test-label-id' };
      mockTrelloClient.removeCardLabel.mockResolvedValue(undefined);

      const result = await labelTools.handleToolCall('remove_card_label', args, mockTrelloClient);

      expect(mockTrelloClient.removeCardLabel).toHaveBeenCalledWith('test-card-id', 'test-label-id');
      expect(result.content[0].text).toContain('Successfully removed label');
    });

    it('should handle errors when removing a label', async () => {
      const args = { cardId: 'test-card-id', labelId: 'test-label-id' };
      mockTrelloClient.removeCardLabel.mockRejectedValue(new Error('Could not remove'));
      const result = await labelTools.handleToolCall('remove_card_label', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('handleToolCall', () => {
    it('should throw an error for an unknown tool', async () => {
      const result = await labelTools.handleToolCall('unknown_tool', {}, mockTrelloClient);
      expect(result.isError).toBe(true);
      expect(result.message).toBe('Unknown tool: unknown_tool');
    });
  });
});
