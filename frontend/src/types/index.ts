export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  theme: 'light' | 'dark';
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Message {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

export interface Chat {
  id: number;
  title: string;
  created_at: string;
  messages?: Message[];
  message_count?: number;
}

export interface ChatHistoryResponse {
  chats: Chat[];
  total: number;
}

export interface UserStats {
  total_chats: number;
  total_messages: number;
  total_tokens: number;
  total_requests: number;
}

export interface AIModel {
  id: string;
  name: string;
  default?: boolean;
}

export interface StreamEvent {
  type: 'start' | 'chunk' | 'done' | 'error';
  content?: string;
  chat_id?: number;
  message?: string;
}
