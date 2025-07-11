import { TrelloClient, TrelloApiError } from '../src/trello-client';
import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockRequest = jest.fn();

// A more realistic mock for the axios instance that captures interceptors
const mockAxiosInstance = {
    interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
    },
    request: mockRequest,
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

describe('TrelloClient', () => {
  let client: TrelloClient;
  let responseSuccessHandler: (resp: any) => any;
  let responseErrorHandler: (err: any) => any;

  beforeEach(() => {
    // Reset mocks before each test
    (mockAxiosInstance.interceptors.response.use as jest.Mock).mockClear();
    mockRequest.mockReset();
    
    // This instantiation will register the interceptors on our mock
    client = new TrelloClient();
    
    // Capture the handlers registered by the TrelloClient
    const useMock = mockAxiosInstance.interceptors.response.use as jest.Mock;
    if (useMock.mock.calls.length > 0) {
        responseSuccessHandler = useMock.mock.calls[0][0];
        responseErrorHandler = useMock.mock.calls[0][1];
    }
    
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Error Handling', () => {
    it('should throw TrelloApiError on API error', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 404, data: { message: 'Not Found' } },
      };
      
      // Simulate a request that rejects, and ensure the error handler is applied
      mockRequest.mockImplementation(async () => {
        // This simulates the promise from axios.request rejecting,
        // and then being processed by the interceptor's error handler.
        return Promise.reject(error).catch(responseErrorHandler);
      });
      await expect(client.getBoards()).rejects.toThrow(TrelloApiError);
    });
  });

  describe('Board Operations', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    it('should get boards', async () => {
      const boards = [{ id: '1', name: 'Test Board' }];
      
      // Simulate a successful request that resolves with the data
      mockRequest.mockResolvedValue({ data: boards });

      const promise = client.getBoards();
      await jest.runAllTimersAsync();
      const result = await promise;
      
      // The client method should return the data directly
      expect(result).toEqual(boards);
      expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ url: '/members/me/boards' }));
    });
  });

  describe('List Operations', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    it('should get lists', async () => {
        const lists = [{ id: '1', name: 'Test List' }];
        mockRequest.mockResolvedValue({ data: lists });

        const promise = client.getLists('board-id-123');
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result).toEqual(lists);
        expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ url: '/boards/board-id-123/lists' }));
    });
  });

  describe('Card Operations', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    it('should get cards from a list', async () => {
        const cards = [{ id: '1', name: 'Test Card' }];
        mockRequest.mockResolvedValue({ data: cards });
        
        const promise = client.getCards(undefined, 'list-id-123');
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result).toEqual(cards);
        expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ url: '/lists/list-id-123/cards' }));
    });
  });
});
