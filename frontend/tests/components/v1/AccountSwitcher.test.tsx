import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountSwitcher } from '@/components/v1/AccountSwitcher';

vi.mock('@/services/account-memory-service', () => ({
  getRecentAccounts: vi.fn(() => []),
  recordAccountUsage: vi.fn(),
  removeAccount: vi.fn(),
  clearRecentAccounts: vi.fn(),
}));

import * as accountMemory from '@/services/account-memory-service';

const ADDR_A = '0x1234567890abcdef';
const ADDR_B = '0xAAAABBBBCCCCDDDD';

describe('AccountSwitcher', () => {
  beforeEach(() => {
    vi.mocked(accountMemory.getRecentAccounts).mockReturnValue([]);
    vi.mocked(accountMemory.recordAccountUsage).mockReset();
    vi.mocked(accountMemory.removeAccount).mockReset();
  });

  it('shows "Connect wallet" when currentAddress is null', () => {
    render(<AccountSwitcher currentAddress={null} />);
    expect(screen.getByText('Connect wallet')).toBeTruthy();
  });

  it('truncates long addresses in the trigger', () => {
    const longAddress = '0xABCDEF1234567890ABCDEF';
    render(<AccountSwitcher currentAddress={longAddress} />);
    const trigger = screen.getByTestId('account-switcher-trigger');
    expect(trigger.textContent).toContain('0xABCD');
    expect(trigger.textContent).toContain('CDEF');
    expect(trigger.textContent).not.toBe(longAddress);
  });

  it('opens menu on trigger click', () => {
    render(<AccountSwitcher currentAddress={ADDR_A} />);
    expect(screen.queryByTestId('account-switcher-menu')).toBeNull();
    fireEvent.click(screen.getByTestId('account-switcher-trigger'));
    expect(screen.getByTestId('account-switcher-menu')).toBeTruthy();
  });

  it('shows "No recent accounts" when disconnected with no history', () => {
    render(<AccountSwitcher />);
    fireEvent.click(screen.getByTestId('account-switcher-trigger'));
    expect(screen.getByTestId('account-switcher-empty')).toBeTruthy();
    expect(screen.getByText('No recent accounts')).toBeTruthy();
  });

  it('clicking a recent account calls onSelectAccount and closes menu', () => {
    vi.mocked(accountMemory.getRecentAccounts).mockReturnValue([
      { address: ADDR_B, lastUsedAt: Date.now() - 1000 },
    ]);

    const onSelectAccount = vi.fn();
    render(<AccountSwitcher currentAddress={ADDR_A} onSelectAccount={onSelectAccount} />);
    fireEvent.click(screen.getByTestId('account-switcher-trigger'));

    fireEvent.click(screen.getByTestId(`account-switcher-recent-${ADDR_B}`));

    expect(onSelectAccount).toHaveBeenCalledWith(
      expect.objectContaining({ address: ADDR_B }),
    );
    expect(screen.queryByTestId('account-switcher-menu')).toBeNull();
  });

  it('closes menu on outside click', () => {
    render(<AccountSwitcher currentAddress={ADDR_A} />);
    fireEvent.click(screen.getByTestId('account-switcher-trigger'));
    expect(screen.getByTestId('account-switcher-menu')).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('account-switcher-menu')).toBeNull();
  });
});
