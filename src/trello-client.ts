import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { config, TRELLO_BASE_URL } from './config.js';
import {
  TrelloBoard,
  TrelloList,
  TrelloCard,
  TrelloMember,
  TrelloLabel,
  TrelloChecklist,
  TrelloChecklistItem,
  TrelloApiCredentials
} from './types/trello.js';

export class TrelloApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'TrelloApiError';
  }
}

export class TrelloClient {
  private client: AxiosInstance;
  private credentials: TrelloApiCredentials;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private rateLimitDelay = 500; // 500ms delay between requests

  constructor() {
    this.credentials = {
      apiKey: config.TRELLO_API_KEY,
      token: config.TRELLO_TOKEN,
    };

    this.client = axios.create({
      baseURL: TRELLO_BASE_URL,
      timeout: config.API_TIMEOUT,
      params: {
        key: this.credentials.apiKey,
        token: this.credentials.token,
      },
    });

    this.setupInterceptors();
  }

  private async requestWithRateLimit<T>(config: any): Promise<AxiosResponse<T>> {
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
    return this.client.request<T>(config);
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.LOG_LEVEL === 'debug') {
          console.log(`[Trello API] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (process.env.LOG_LEVEL === 'debug') {
          console.log(`[Trello API] Response ${response.status} for ${response.config.url}`);
        }
        if (response.config.method === 'get' && response.config.url) {
          this.cache.set(response.config.url, { data: response.data, timestamp: Date.now() });
        }
        return response;
      },
      async (error: any) => {
        const { config, response } = error;
        if (response?.status === 429 && config) {
          // Retry with exponential backoff
          const retryAfter = parseInt(response.headers['retry-after'] || '1', 10) * 1000;
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          return this.client.request(config);
        }
        const message = this.getErrorMessage(error);
        const status = error.response?.status || 500;
        return Promise.reject(new TrelloApiError(message, status, error));
      }
    );
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as any;
      return data.message || data.error || 'Unknown API error';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout';
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'Network connection error';
    }
    return error.message || 'Unknown error';
  }

  // Board operations
  async getBoards(): Promise<TrelloBoard[]> {
    const cacheKey = '/members/me/boards';
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 60000)) { // 1 minute cache
      return cached.data;
    }
    const response = await this.requestWithRateLimit<TrelloBoard[]>({ method: 'get', url: cacheKey });
    return response.data;
  }

  async getBoard(boardId: string): Promise<TrelloBoard> {
    const cacheKey = `/boards/${boardId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 60000)) { // 1 minute cache
      return cached.data;
    }
    const response = await this.requestWithRateLimit<TrelloBoard>({
      method: 'get',
      url: cacheKey,
      params: {
        lists: 'open',
        cards: 'open',
        labels: 'all',
        members: 'all',
        memberships: 'all',
      },
    });
    return response.data;
  }

  async getBoardMembers(boardId: string): Promise<TrelloMember[]> {
    const cacheKey = `/boards/${boardId}/members`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 60000)) { // 1 minute cache
      return cached.data;
    }
    const response = await this.requestWithRateLimit<TrelloMember[]>({ method: 'get', url: cacheKey });
    return response.data;
  }

  // List operations
  async getLists(boardId: string): Promise<TrelloList[]> {
    const cacheKey = `/boards/${boardId}/lists`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 60000)) { // 1 minute cache
      return cached.data;
    }
    const response = await this.requestWithRateLimit<TrelloList[]>({ method: 'get', url: cacheKey });
    return response.data;
  }

  async createList(boardId: string, name: string, pos?: string): Promise<TrelloList> {
    const response = await this.requestWithRateLimit<TrelloList>({
      method: 'post',
      url: '/lists',
      data: { name, idBoard: boardId, pos: pos || 'bottom' },
    });
    return response.data;
  }

  async updateList(listId: string, updates: Partial<TrelloList>): Promise<TrelloList> {
    const response = await this.requestWithRateLimit<TrelloList>({
      method: 'put',
      url: `/lists/${listId}`,
      data: updates,
    });
    return response.data;
  }

  // Card operations
  async getCards(boardId?: string, listId?: string): Promise<TrelloCard[]> {
    let url: string;
    if (listId) {
      url = `/lists/${listId}/cards`;
    } else if (boardId) {
      url = `/boards/${boardId}/cards`;
    } else {
      throw new TrelloApiError('Either boardId or listId must be provided', 400);
    }
    const cached = this.cache.get(url);
    if (cached && (Date.now() - cached.timestamp < 60000)) { // 1 minute cache
      return cached.data;
    }
    const response = await this.requestWithRateLimit<TrelloCard[]>({ method: 'get', url });
    return response.data;
  }

  async getCard(cardId: string): Promise<TrelloCard> {
    const cacheKey = `/cards/${cardId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 60000)) { // 1 minute cache
      return cached.data;
    }
    const response = await this.requestWithRateLimit<TrelloCard>({
      method: 'get',
      url: cacheKey,
      params: { members: 'true', labels: 'true', checklists: 'all', attachments: 'true' },
    });
    return response.data;
  }

  async createCard(
    listId: string,
    name: string,
    desc?: string,
    due?: string,
    pos?: string
  ): Promise<TrelloCard> {
    const response = await this.requestWithRateLimit<TrelloCard>({
      method: 'post',
      url: '/cards',
      data: { name, desc: desc || '', due, idList: listId, pos: pos || 'bottom' },
    });
    return response.data;
  }

  async updateCard(cardId: string, updates: Partial<TrelloCard>): Promise<TrelloCard> {
    const response = await this.requestWithRateLimit<TrelloCard>({
      method: 'put',
      url: `/cards/${cardId}`,
      data: updates,
    });
    return response.data;
  }

  async moveCard(cardId: string, listId: string, pos?: string): Promise<TrelloCard> {
    const response = await this.requestWithRateLimit<TrelloCard>({
      method: 'put',
      url: `/cards/${cardId}`,
      data: { idList: listId, pos: pos || 'bottom' },
    });
    return response.data;
  }

  async deleteCard(cardId: string): Promise<void> {
    await this.requestWithRateLimit<void>({ method: 'delete', url: `/cards/${cardId}` });
  }

  // Member operations
  async addCardMember(cardId: string, memberId: string): Promise<void> {
    await this.requestWithRateLimit<void>({
      method: 'post',
      url: `/cards/${cardId}/idMembers`,
      data: { value: memberId },
    });
  }

  async removeCardMember(cardId: string, memberId: string): Promise<void> {
    await this.requestWithRateLimit<void>({
      method: 'delete',
      url: `/cards/${cardId}/idMembers/${memberId}`,
    });
  }

  // Label operations
  async getLabels(boardId: string): Promise<TrelloLabel[]> {
    const cacheKey = `/boards/${boardId}/labels`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 60000)) { // 1 minute cache
      return cached.data;
    }
    const response = await this.requestWithRateLimit<TrelloLabel[]>({ method: 'get', url: cacheKey });
    return response.data;
  }

  async addCardLabel(cardId: string, labelId: string): Promise<void> {
    await this.requestWithRateLimit<void>({
      method: 'post',
      url: `/cards/${cardId}/idLabels`,
      data: { value: labelId },
    });
  }

  async removeCardLabel(cardId: string, labelId: string): Promise<void> {
    await this.requestWithRateLimit<void>({
      method: 'delete',
      url: `/cards/${cardId}/idLabels/${labelId}`,
    });
  }

  async createLabel(boardId: string, name: string, color: string): Promise<TrelloLabel> {
    const response = await this.requestWithRateLimit<TrelloLabel>({
      method: 'post',
      url: '/labels',
      data: { name, color, idBoard: boardId },
    });
    return response.data;
  }

  // Checklist operations
  async getCardChecklists(cardId: string): Promise<TrelloChecklist[]> {
    const cacheKey = `/cards/${cardId}/checklists`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 60000)) { // 1 minute cache
      return cached.data;
    }
    const response = await this.requestWithRateLimit<TrelloChecklist[]>({ method: 'get', url: cacheKey });
    return response.data;
  }

  async createChecklist(cardId: string, name: string): Promise<TrelloChecklist> {
    const response = await this.requestWithRateLimit<TrelloChecklist>({
      method: 'post',
      url: '/checklists',
      data: { idCard: cardId, name },
    });
    return response.data;
  }

  async addChecklistItem(checklistId: string, name: string, pos?: string): Promise<TrelloChecklistItem> {
    const response = await this.requestWithRateLimit<TrelloChecklistItem>({
      method: 'post',
      url: `/checklists/${checklistId}/checkItems`,
      data: { name, pos: pos || 'bottom' },
    });
    return response.data;
  }

  async updateChecklistItem(
    cardId: string,
    itemId: string,
    state: 'complete' | 'incomplete'
  ): Promise<void> {
    await this.requestWithRateLimit<void>({
      method: 'put',
      url: `/cards/${cardId}/checkItem/${itemId}`,
      data: { state },
    });
  }

  async deleteChecklist(checklistId: string): Promise<void> {
    await this.requestWithRateLimit<void>({ method: 'delete', url: `/checklists/${checklistId}` });
  }
}
