import api from './api';
import type { AIModel, Chat, ChatHistoryResponse, StreamEvent } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const chatService = {
  async getHistory(search?: string): Promise<ChatHistoryResponse> {
    const { data } = await api.get<ChatHistoryResponse>('/chat/history', {
      params: search ? { search } : undefined,
    });
    return data;
  },

  async getChat(chatId: number): Promise<Chat> {
    const { data } = await api.get<Chat>(`/chat/${chatId}`);
    return data;
  },

  async createChat(): Promise<Chat> {
    const { data } = await api.post<Chat>('/chat/create');
    return data;
  },

  async renameChat(chatId: number, title: string): Promise<Chat> {
    const { data } = await api.put<Chat>(`/chat/rename/${chatId}`, { title });
    return data;
  },

  async deleteChat(chatId: number): Promise<void> {
    await api.delete(`/chat/delete/${chatId}`);
  },

  async getModels(): Promise<AIModel[]> {
    const { data } = await api.get<{ models: AIModel[] }>('/chat/models/list');
    return data.models;
  },

  async sendMessageStream(
    payload: {
      chat_id?: number;
      message: string;
      model?: string;
      regenerate?: boolean;
    },
    onEvent: (event: StreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_URL}/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to send message');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6)) as StreamEvent;
            onEvent(event);
          } catch {
            // skip malformed events
          }
        }
      }
    }
  },
};
