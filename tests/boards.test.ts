import { boardTools } from '../src/tools/boards';
import { TrelloClient } from '../src/trello-client';
import { UnknownToolError } from '../src/error-handler';

// Mock the TrelloClient
jest.mock('../src/trello-client');

const mockTrelloClient = new TrelloClient() as jest.Mocked<TrelloClient>;

describe('Board Tools', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list_boards', () => {
    it('should return a list of boards', async () => {
      const mockBoards = [
        { id: '1', name: 'Board 1', desc: 'desc 1', url: 'url 1', shortUrl: 'shortUrl1', closed: false, starred: false, dateLastActivity: 'date 1', memberships: [], prefs: { permissionLevel: 'private' as 'private', voting: 'disabled' as 'disabled', comments: 'members' as 'members', invitations: 'members' as 'members', selfJoin: false, cardCovers: true, cardAging: 'regular' as 'regular', calendarFeedEnabled: false, background: 'blue', backgroundBrightness: 'dark' as 'dark', backgroundTile: false } },
        { id: '2', name: 'Board 2', desc: 'desc 2', url: 'url 2', shortUrl: 'shortUrl2', closed: true, starred: true, dateLastActivity: 'date 2', memberships: [], prefs: { permissionLevel: 'private' as 'private', voting: 'disabled' as 'disabled', comments: 'members' as 'members', invitations: 'members' as 'members', selfJoin: false, cardCovers: true, cardAging: 'regular' as 'regular', calendarFeedEnabled: false, background: 'blue', backgroundBrightness: 'dark' as 'dark', backgroundTile: false } },
      ];
      mockTrelloClient.getBoards.mockResolvedValue(mockBoards);

      const result = await boardTools.handleToolCall('list_boards', {}, mockTrelloClient);

      expect(mockTrelloClient.getBoards).toHaveBeenCalled();
      expect(JSON.parse(result.content[0].text)).toEqual(mockBoards);
    });
  });

  describe('get_board', () => {
    it('should return board details', async () => {
      const args = { boardId: 'test-board-id' };
      const mockBoard = { id: 'test-board-id', name: 'Test Board', desc: 'd', shortUrl: 's', closed: false, url: 'u', memberships: [], starred: false, dateLastActivity: 'da', prefs: { permissionLevel: 'private' as 'private', voting: 'disabled' as 'disabled', comments: 'members' as 'members', invitations: 'members' as 'members', selfJoin: false, cardCovers: true, cardAging: 'regular' as 'regular', calendarFeedEnabled: false, background: 'blue', backgroundBrightness: 'dark' as 'dark', backgroundTile: false } };
      mockTrelloClient.getBoard.mockResolvedValue(mockBoard);

      const result = await boardTools.handleToolCall('get_board', args, mockTrelloClient);

      expect(mockTrelloClient.getBoard).toHaveBeenCalledWith('test-board-id');
      expect(JSON.parse(result.content[0].text)).toEqual(mockBoard);
    });

    it('should handle errors when getting a board', async () => {
      const args = { boardId: 'test-board-id' };
      mockTrelloClient.getBoard.mockRejectedValue(new Error('Board not found'));

      const result = await boardTools.handleToolCall('get_board', args, mockTrelloClient);

      expect(result.isError).toBe(true);
      expect(result.message).toBe('An unexpected error occurred');
    });
  });

  describe('get_board_members', () => {
    it('should return board members', async () => {
      const args = { boardId: 'test-board-id' };
      const mockMembers = [{ id: '1', username: 'user1', fullName: 'User One', initials: 'UO', avatarUrl: 'url1' }];
      mockTrelloClient.getBoardMembers.mockResolvedValue(mockMembers);

      const result = await boardTools.handleToolCall('get_board_members', args, mockTrelloClient);

      expect(mockTrelloClient.getBoardMembers).toHaveBeenCalledWith('test-board-id');
      expect(JSON.parse(result.content[0].text)).toEqual(mockMembers);
    });

    it('should handle errors when getting board members', async () => {
      const args = { boardId: 'test-board-id' };
      mockTrelloClient.getBoardMembers.mockRejectedValue(new Error('Board not found'));

      const result = await boardTools.handleToolCall('get_board_members', args, mockTrelloClient);

      expect(result.isError).toBe(true);
      expect(result.message).toBe('An unexpected error occurred');
    });
  });

  describe('handleToolCall', () => {
    it('should throw an error for an unknown tool', async () => {
      const result = await boardTools.handleToolCall('unknown_tool', {}, mockTrelloClient);
      expect(result.isError).toBe(true);
      expect(result.message).toBe('Unknown tool: unknown_tool');
    });
  });
});
