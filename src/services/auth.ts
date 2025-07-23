import { LoginResponse, UserProfile, AuthError } from '@/types/auth';
import { BaseService } from './base';

class AuthService extends BaseService {
  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  }

  async getUserProfile(token: string): Promise<UserProfile> {
    return this.get<UserProfile>('/users/me', token);
  }
}

export const authService = new AuthService();