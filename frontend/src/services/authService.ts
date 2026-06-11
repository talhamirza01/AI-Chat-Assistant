import api from './api';
import type { AuthTokens, User } from '@/types';

export const authService = {
  async register(username: string, email: string, password: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/auth/register', { username, email, password });
    return data;
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/auth/login', { email, password });
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await api.post('/auth/logout', { refresh_token: refreshToken });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async getProfile(): Promise<User> {
    const { data } = await api.get<User>('/user/profile');
    return data;
  },

  async updateProfile(updates: Partial<Pick<User, 'username' | 'email' | 'theme'>>): Promise<User> {
    const { data } = await api.put<User>('/user/profile', updates);
    return data;
  },
};
