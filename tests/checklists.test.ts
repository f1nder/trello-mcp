import { checklistTools } from '../src/tools/checklists';
import { TrelloClient } from '../src/trello-client';
import { TrelloChecklist, TrelloChecklistItem } from '../src/types/trello';

// Mock the TrelloClient
jest.mock('../src/trello-client');

const mockTrelloClient = new TrelloClient() as jest.Mocked<TrelloClient>;

const mockChecklistItem: TrelloChecklistItem = {
  id: 'test-item-id',
  name: 'Test Item',
  idChecklist: 'test-checklist-id',
  state: 'incomplete',
  pos: 1,
};

const mockChecklist: TrelloChecklist = {
  id: 'test-checklist-id',
  name: 'Test Checklist',
  idCard: 'test-card-id',
  idBoard: 'test-board-id',
  pos: 1,
  checkItems: [mockChecklistItem],
};

describe('Checklist Tools', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get_card_checklists', () => {
    it('should return checklists for a card', async () => {
      const args = { cardId: 'test-card-id' };
      mockTrelloClient.getCardChecklists.mockResolvedValue([mockChecklist]);

      const result = await checklistTools.handleToolCall('get_card_checklists', args, mockTrelloClient);

      expect(mockTrelloClient.getCardChecklists).toHaveBeenCalledWith('test-card-id');
      expect(JSON.parse(result.content[0].text)[0]).toEqual(mockChecklist);
    });

    it('should handle errors when getting checklists', async () => {
      const args = { cardId: 'test-card-id' };
      mockTrelloClient.getCardChecklists.mockRejectedValue(new Error('Not found'));
      const result = await checklistTools.handleToolCall('get_card_checklists', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('create_checklist', () => {
    it('should create a checklist', async () => {
      const args = { cardId: 'test-card-id', name: 'New Checklist' };
      mockTrelloClient.createChecklist.mockResolvedValue(mockChecklist);

      const result = await checklistTools.handleToolCall('create_checklist', args, mockTrelloClient);

      expect(mockTrelloClient.createChecklist).toHaveBeenCalledWith('test-card-id', 'New Checklist');
      expect(JSON.parse(result.content[0].text)).toEqual(mockChecklist);
    });

    it('should handle errors when creating a checklist', async () => {
      const args = { cardId: 'test-card-id', name: 'New Checklist' };
      mockTrelloClient.createChecklist.mockRejectedValue(new Error('Could not create'));
      const result = await checklistTools.handleToolCall('create_checklist', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('add_checklist_item', () => {
    it('should add an item to a checklist', async () => {
      const args = { checklistId: 'test-checklist-id', name: 'New Item' };
      mockTrelloClient.addChecklistItem.mockResolvedValue(mockChecklistItem);

      const result = await checklistTools.handleToolCall('add_checklist_item', args, mockTrelloClient);

      expect(mockTrelloClient.addChecklistItem).toHaveBeenCalledWith('test-checklist-id', 'New Item', 'bottom');
      expect(JSON.parse(result.content[0].text)).toEqual(mockChecklistItem);
    });

    it('should handle errors when adding an item', async () => {
      const args = { checklistId: 'test-checklist-id', name: 'New Item' };
      mockTrelloClient.addChecklistItem.mockRejectedValue(new Error('Could not add'));
      const result = await checklistTools.handleToolCall('add_checklist_item', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('update_checklist_item', () => {
    it('should update a checklist item', async () => {
      const args = { cardId: 'test-card-id', itemId: 'test-item-id', state: 'complete' as 'complete' };
      mockTrelloClient.updateChecklistItem.mockResolvedValue(undefined);

      const result = await checklistTools.handleToolCall('update_checklist_item', args, mockTrelloClient);

      expect(mockTrelloClient.updateChecklistItem).toHaveBeenCalledWith('test-card-id', 'test-item-id', 'complete');
      expect(result.content[0].text).toContain('Successfully updated');
    });

    it('should handle errors when updating an item', async () => {
      const args = { cardId: 'test-card-id', itemId: 'test-item-id', state: 'complete' as 'complete' };
      mockTrelloClient.updateChecklistItem.mockRejectedValue(new Error('Could not update'));
      const result = await checklistTools.handleToolCall('update_checklist_item', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('delete_checklist', () => {
    it('should delete a checklist', async () => {
      const args = { checklistId: 'test-checklist-id' };
      mockTrelloClient.deleteChecklist.mockResolvedValue(undefined);

      const result = await checklistTools.handleToolCall('delete_checklist', args, mockTrelloClient);

      expect(mockTrelloClient.deleteChecklist).toHaveBeenCalledWith('test-checklist-id');
      expect(result.content[0].text).toContain('Successfully deleted');
    });

    it('should handle errors when deleting a checklist', async () => {
      const args = { checklistId: 'test-checklist-id' };
      mockTrelloClient.deleteChecklist.mockRejectedValue(new Error('Could not delete'));
      const result = await checklistTools.handleToolCall('delete_checklist', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('handleToolCall', () => {
    it('should throw an error for an unknown tool', async () => {
      const result = await checklistTools.handleToolCall('unknown_tool', {}, mockTrelloClient);
      expect(result.isError).toBe(true);
      expect(result.message).toBe('Unknown tool: unknown_tool');
    });
  });
});
