import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileSettings, { profileStore } from './ProfileSettings';

const walletStatusState = vi.hoisted((): any => ({
  address: 'GTEST1234567890',
  network: 'TESTNET',
  provider: 'WalletProvider',
  capabilities: { isConnected: true },
  status: 'connected',
  error: null,
  lastUpdatedAt: Date.now(),
  refresh: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  isRefreshing: false,
}));

vi.mock('@/hooks/useWalletStatus', () => ({
  useWalletStatus: () => walletStatusState,
}));

const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();
const mockGetWalletBalance = vi.fn().mockResolvedValue({
  success: true,
  data: { address: 'GTEST1234567890', balances: { XLM: '0.0000000' } },
});

vi.mock('@/services/typed-api-sdk', () => ({
  ApiClient: class {
    async getProfile() {
      return mockGetProfile();
    }
    async updateProfile(input: unknown) {
      return mockUpdateProfile(input);
    }
    async getWalletBalance() {
      return mockGetWalletBalance();
    }
  },
}))

describe('ProfileSettings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletStatusState.address = 'GTEST1234567890';
    walletStatusState.network = 'TESTNET';
    walletStatusState.provider = 'WalletProvider';
    walletStatusState.capabilities = { isConnected: true };
    walletStatusState.status = 'connected';
    walletStatusState.error = null;
    walletStatusState.lastUpdatedAt = Date.now();
    profileStore.dispatch({ type: 'AUTH_SET', payload: { userId: 'test', token: 'test-jwt-token' } });
    profileStore.dispatch({ type: 'PROFILE_CLEAR' });
  });

  it('loads profile data and displays username in the input', async () => {
    mockGetProfile.mockResolvedValueOnce({
      success: true,
      data: {
        address: 'GABC123',
        username: 'alice',
        createdAt: '2025-01-01T12:00:00Z',
      },
    });

    render(<ProfileSettings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('alice')).toBeInTheDocument();
    });
  });

  it('exposes profile settings as a labelled page section with a top-level heading', async () => {
    mockGetProfile.mockResolvedValueOnce({
      success: true,
      data: {
        address: 'GABC123',
        username: 'alice',
        createdAt: '2025-01-01T12:00:00Z',
      },
    });

    render(<ProfileSettings />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Profile Settings' }),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('profile-identity-card'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('profile-stats-grid'),
      ).toBeInTheDocument();
    });
  });

  it('renders wallet info and stats grid when connected', async () => {
    mockGetProfile.mockResolvedValueOnce({
      success: true,
      data: {
        address: 'GABC123',
        username: 'alice',
        createdAt: '2025-01-01T12:00:00Z',
      },
    });

    render(<ProfileSettings />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-wallet-row')).toBeInTheDocument();
      expect(screen.getByTestId('profile-network-badge')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('saves successfully and shows success state', async () => {
    mockGetProfile.mockResolvedValueOnce({
      success: true,
      data: {
        address: 'GABC123',
        username: 'alice',
        createdAt: '2025-01-01T12:00:00Z',
      },
    });
    mockUpdateProfile.mockResolvedValueOnce({
      success: true,
      data: {
        address: 'GABC123',
        username: 'alice_updated',
        createdAt: '2025-01-01T12:00:00Z',
      },
    });

    render(<ProfileSettings />);

    await waitFor(() => expect(screen.getByDisplayValue('alice')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('profile-username-input'), {
      target: { value: 'alice_updated' },
    });
    expect(screen.getByDisplayValue('alice_updated')).toBeInTheDocument();

    // Save button appears when there are draft changes — no checklist needed
    fireEvent.click(screen.getByTestId('profile-settings-save'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('profile-settings-success')).toHaveTextContent(/Profile saved successfully/i);
      expect(screen.getByDisplayValue('alice_updated')).toBeInTheDocument();
    });
  });

  it('shows error banner when cloud update fails', async () => {
    mockGetProfile.mockResolvedValueOnce({
      success: true,
      data: {
        address: 'GABC123',
        username: 'alice',
        createdAt: '2025-01-01T12:00:00Z',
      },
    });
    mockUpdateProfile.mockResolvedValueOnce({
      success: false,
      error: {
        code: 'API_SERVER_ERROR',
        domain: 'api',
        message: 'Server failure',
        severity: 'terminal',
      },
    });

    render(<ProfileSettings />);

    await waitFor(() => expect(screen.getByDisplayValue('alice')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('profile-username-input'), {
      target: { value: 'alice_offline' },
    });

    fireEvent.click(screen.getByTestId('profile-settings-save'));

    await waitFor(() => {
      expect(screen.getByTestId('profile-settings-error')).toHaveTextContent(/Server failure/i);
    });
  });

  it('shows avatar initial from username', async () => {
    mockGetProfile.mockResolvedValueOnce({
      success: true,
      data: {
        address: 'GABC123',
        username: 'alice',
        createdAt: '2025-01-01T12:00:00Z',
      },
    });

    render(<ProfileSettings />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-avatar')).toHaveTextContent('A');
    });
  });

  it('displays member since date from profile createdAt', async () => {
    mockGetProfile.mockResolvedValueOnce({
      success: true,
      data: {
        address: 'GABC123',
        username: 'alice',
        createdAt: '2025-01-01T12:00:00Z',
      },
    });

    render(<ProfileSettings />);

    await waitFor(() => {
      const memberSince = screen.getByTestId('profile-member-since');
      // Should show a formatted date, not "—"
      expect(memberSince.textContent).not.toBe('—');
    });
  });
});
