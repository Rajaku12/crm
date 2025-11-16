import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  login,
  logout,
} from '../../services/apiService';

describe('API Service - Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should store and retrieve access token', () => {
      setTokens('access123', 'refresh456');
      expect(getAccessToken()).toBe('access123');
    });

    it('should store and retrieve refresh token', () => {
      setTokens('access123', 'refresh456');
      expect(getRefreshToken()).toBe('refresh456');
    });

    it('should clear tokens on logout', () => {
      setTokens('access123', 'refresh456');
      clearTokens();
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it('should return null when no token exists', () => {
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe('API Request', () => {
    // Note: apiRequest is not exported, so we test through login/logout
    it('should handle token storage for API requests', () => {
      setTokens('test-token', 'refresh-token');
      expect(getAccessToken()).toBe('test-token');
      expect(getRefreshToken()).toBe('refresh-token');
    });
  });

  describe('Login', () => {
    it('should login successfully and store tokens', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access: 'access-token',
          refresh: 'refresh-token',
        }),
      });

      const result = await login({ username: 'user', password: 'pass' });
      
      expect(result).toEqual({
        access: 'access-token',
        refresh: 'refresh-token',
      });
      expect(getAccessToken()).toBe('access-token');
      expect(getRefreshToken()).toBe('refresh-token');
    });

    it('should handle login failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      await expect(login({ username: 'user', password: 'wrong' })).rejects.toThrow();
    });
  });

  describe('Logout', () => {
    it('should clear tokens on logout', () => {
      setTokens('access', 'refresh');
      logout();
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });
  });
});

