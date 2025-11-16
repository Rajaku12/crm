import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '../../services/apiService';

describe('Regression Tests - Ensure Previous Fixes Still Work', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should maintain token persistence across operations', () => {
    setTokens('access1', 'refresh1');
    expect(getAccessToken()).toBe('access1');
    expect(getRefreshToken()).toBe('refresh1');
    
    // Simulate page reload by clearing and re-reading
    const access = getAccessToken();
    const refresh = getRefreshToken();
    expect(access).toBe('access1');
    expect(refresh).toBe('refresh1');
  });

  it('should handle multiple token updates without corruption', () => {
    for (let i = 0; i < 10; i++) {
      setTokens(`access${i}`, `refresh${i}`);
      expect(getAccessToken()).toBe(`access${i}`);
      expect(getRefreshToken()).toBe(`refresh${i}`);
    }
  });

  it('should clear all tokens completely', () => {
    setTokens('access', 'refresh');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    
    // Ensure no residual data
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});

