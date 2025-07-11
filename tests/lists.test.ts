import { listTools } from '../src/tools/lists';
import { TrelloClient } from '../src/trello-client';
import { TrelloList } from '../src/types/trello';

// Mock the TrelloClient
jest.mock('../src/trello-client');

const mockTrelloClient = new TrelloClient() as jest.Mocked<TrelloClient>;

const mockList: TrelloList = {
  id: 'test-list-id',
  name: 'Test List',
  pos: 1,
  idBoard: 'test-board-id',
  closed: false,
  subscribed: false,
};

describe('List Tools', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get_lists', () => {
    it('should return lists for a board', async () => {
      const args = { boardId: 'test-board-id' };
      mockTrelloClient.getLists.mockResolvedValue([mockList]);

      const result = await listTools.handleToolCall('get_lists', args, mockTrelloClient);

      expect(mockTrelloClient.getLists).toHaveBeenCalledWith('test-board-id');
      expect(JSON.parse(result.content[0].text)[0]).toEqual(mockList);
    });

    it('should handle errors when getting lists', async () => {
      const args = { boardId: 'test-board-id' };
      mockTrelloClient.getLists.mockRejectedValue(new Error('Not found'));
      const result = await listTools.handleToolCall('get_lists', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('create_list', () => {
    it('should create a list', async () => {
      const args = { boardId: 'test-board-id', name: 'New List' };
      mockTrelloClient.createList.mockResolvedValue(mockList);

      const result = await listTools.handleToolCall('create_list', args, mockTrelloClient);

      expect(mockTrelloClient.createList).toHaveBeenCalledWith('test-board-id', 'New List', 'bottom');
      expect(JSON.parse(result.content[0].text)).toEqual(mockList);
    });

    it('should handle errors when creating a list', async () => {
      const args = { boardId: 'test-board-id', name: 'New List' };
      mockTrelloClient.createList.mockRejectedValue(new Error('Could not create'));
      const result = await listTools.handleToolCall('create_list', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('update_list', () => {
    it('should update a list', async () => {
      const args = { listId: 'test-list-id', name: 'Updated List' };
      mockTrelloClient.updateList.mockResolvedValue({ ...mockList, name: 'Updated List' });

      const result = await listTools.handleToolCall('update_list', args, mockTrelloClient);

      expect(mockTrelloClient.updateList).toHaveBeenCalledWith('test-list-id', { name: 'Updated List' });
      expect(JSON.parse(result.content[0].text).name).toEqual('Updated List');
    });

    it('should handle errors when updating a list', async () => {
      const args = { listId: 'test-list-id', name: 'Updated List' };
      mockTrelloClient.updateList.mockRejectedValue(new Error('Could not update'));
      const result = await listTools.handleToolCall('update_list', args, mockTrelloClient);
      expect(result.isError).toBe(true);
    });
  });

  describe('handleToolCall', () => {
    it('should throw an error for an unknown tool', async () => {
      const result = await listTools.handleToolCall('unknown_tool', {}, mockTrelloClient);
      expect(result.isError).toBe(true);
      expect(result.message).toBe('Unknown tool: unknown_tool');
    });
  });
});
