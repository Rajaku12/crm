import { describe, it, expect } from 'vitest';
import {
  getAccessToken,
  setTokens,
  clearTokens,
} from '../../services/apiService';

describe('Sanity Tests - Basic Functionality', () => {
  it('should have working localStorage for tokens', () => {
    setTokens('test-access', 'test-refresh');
    expect(getAccessToken()).toBe('test-access');
    clearTokens();
    expect(getAccessToken()).toBeNull();
  });

  it('should handle empty token storage', () => {
    clearTokens();
    expect(getAccessToken()).toBeNull();
  });

  it('should handle token updates', () => {
    setTokens('token1', 'refresh1');
    expect(getAccessToken()).toBe('token1');
    
    setTokens('token2', 'refresh2');
    expect(getAccessToken()).toBe('token2');
  });
});

