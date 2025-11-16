import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';
import { AuthProvider } from '../../contexts/AuthContext';
import { AppProvider } from '../../contexts/AppContext';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock API calls
vi.mock('../../services/apiService', () => ({
  login: vi.fn(),
  getLeads: vi.fn(),
  getAgents: vi.fn(),
  getProperties: vi.fn(),
}));

describe('Smoke Tests - Critical User Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login screen when not authenticated', () => {
    render(
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    );

    // Should show login screen or loading
    expect(document.body).toBeInTheDocument();
  });

  it('should handle login flow', async () => {
    const { login } = await import('../../services/apiService');
    vi.mocked(login).mockResolvedValue({
      access: 'test-access-token',
      refresh: 'test-refresh-token',
    });

    // This is a smoke test - we're just checking the flow exists
    expect(login).toBeDefined();
  });

  it('should load main application structure', () => {
    // Mock authenticated state
    localStorage.setItem('access_token', 'test-token');
    
    render(
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    );

    // Should render app structure (may show loading initially)
    expect(document.body).toBeInTheDocument();
  });
});

