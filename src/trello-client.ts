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
        return response;
      },
      (error: AxiosError) => {
        const message = this.getErrorMessage(error);
        const status = error.response?.status || 500;
        throw new TrelloApiError(message, status, error);
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
    const response = await this.client.get<TrelloBoard[]>('/members/me/boards');
    return response.data;
  }

  async getBoard(boardId: string): Promise<TrelloBoard> {
    const response = await this.client.get<TrelloBoard>(`/boards/${boardId}`, {
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
    const response = await this.client.get<TrelloMember[]>(`/boards/${boardId}/members`);
    return response.data;
  }

  // List operations
  async getLists(boardId: string): Promise<TrelloList[]> {
    const response = await this.client.get<TrelloList[]>(`/boards/${boardId}/lists`);
    return response.data;
  }

  async createList(boardId: string, name: string, pos?: string): Promise<TrelloList> {
    const response = await this.client.post<TrelloList>('/lists', {
      name,
      idBoard: boardId,
      pos: pos || 'bottom',
    });
    return response.data;
  }

  async updateList(listId: string, updates: Partial<TrelloList>): Promise<TrelloList> {
    const response = await this.client.put<TrelloList>(`/lists/${listId}`, updates);
    return response.data;
  }

  // Card operations
  async getCards(boardId?: string, listId?: string): Promise<TrelloCard[]> {
    if (listId) {
      const response = await this.client.get<TrelloCard[]>(`/lists/${listId}/cards`);
      return response.data;
    } else if (boardId) {
      const response = await this.client.get<TrelloCard[]>(`/boards/${boardId}/cards`);
      return response.data;
    } else {
      throw new TrelloApiError('Either boardId or listId must be provided', 400);
    }
  }

  async getCard(cardId: string): Promise<TrelloCard> {
    const response = await this.client.get<TrelloCard>(`/cards/${cardId}`, {
      params: {
        members: 'true',
        labels: 'true',
        checklists: 'all',
        attachments: 'true',
      },
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
    const response = await this.client.post<TrelloCard>('/cards', {
      name,
      desc: desc || '',
      due,
      idList: listId,
      pos: pos || 'bottom',
    });
    return response.data;
  }

  async updateCard(cardId: string, updates: Partial<TrelloCard>): Promise<TrelloCard> {
    const response = await this.client.put<TrelloCard>(`/cards/${cardId}`, updates);
    return response.data;
  }

  async moveCard(cardId: string, listId: string, pos?: string): Promise<TrelloCard> {
    const response = await this.client.put<TrelloCard>(`/cards/${cardId}`, {
      idList: listId,
      pos: pos || 'bottom',
    });
    return response.data;
  }

  async deleteCard(cardId: string): Promise<void> {
    await this.client.delete(`/cards/${cardId}`);
  }

  // Member operations
  async addCardMember(cardId: string, memberId: string): Promise<void> {
    await this.client.post(`/cards/${cardId}/idMembers`, { value: memberId });
  }

  async removeCardMember(cardId: string, memberId: string): Promise<void> {
    await this.client.delete(`/cards/${cardId}/idMembers/${memberId}`);
  }

  // Label operations
  async getLabels(boardId: string): Promise<TrelloLabel[]> {
    const response = await this.client.get<TrelloLabel[]>(`/boards/${boardId}/labels`);
    return response.data;
  }

  async addCardLabel(cardId: string, labelId: string): Promise<void> {
    await this.client.post(`/cards/${cardId}/idLabels`, { value: labelId });
  }

  async removeCardLabel(cardId: string, labelId: string): Promise<void> {
    await this.client.delete(`/cards/${cardId}/idLabels/${labelId}`);
  }

  async createLabel(boardId: string, name: string, color: string): Promise<TrelloLabel> {
    const response = await this.client.post<TrelloLabel>('/labels', {
      name,
      color,
      idBoard: boardId,
    });
    return response.data;
  }

  // Checklist operations
  async getCardChecklists(cardId: string): Promise<TrelloChecklist[]> {
    const response = await this.client.get<TrelloChecklist[]>(`/cards/${cardId}/checklists`);
    return response.data;
  }

  async createChecklist(cardId: string, name: string): Promise<TrelloChecklist> {
    const response = await this.client.post<TrelloChecklist>('/checklists', {
      idCard: cardId,
      name,
    });
    return response.data;
  }

  async addChecklistItem(checklistId: string, name: string, pos?: string): Promise<TrelloChecklistItem> {
    const response = await this.client.post<TrelloChecklistItem>(`/checklists/${checklistId}/checkItems`, {
      name,
      pos: pos || 'bottom',
    });
    return response.data;
  }

  async updateChecklistItem(
    cardId: string,
    itemId: string,
    state: 'complete' | 'incomplete'
  ): Promise<void> {
    await this.client.put(`/cards/${cardId}/checkItem/${itemId}`, { state });
  }
}