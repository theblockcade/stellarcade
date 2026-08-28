import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SessionRecoveryPrompt } from './SessionRecoveryPrompt';

describe('SessionRecoveryPrompt Component', () => {
  it('renders disconnected status banner correctly', () => {
    render(
      <SessionRecoveryPrompt
        status="disconnected"
        expectedNetwork="testnet"
        onReconnect={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText(/disconnected/i)).toBeDefined();
  });

  it('renders wrong_network status banner with expected network name', () => {
    render(
      <SessionRecoveryPrompt
        status="wrong_network"
        expectedNetwork="mainnet-public"
        onReconnect={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText(/mainnet-public/i)).toBeDefined();
  });

  it('renders expired status banner correctly', () => {
    render(
      <SessionRecoveryPrompt
        status="expired"
        expectedNetwork="testnet"
        onReconnect={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText(/session expired/i)).toBeDefined();
  });

  it('triggers onReconnect when Reconnect Wallet button is clicked', async () => {
    const onReconnectMock = vi.fn().mockResolvedValue(undefined);
    render(
      <SessionRecoveryPrompt
        status="disconnected"
        expectedNetwork="testnet"
        onReconnect={onReconnectMock}
        onDismiss={vi.fn()}
      />
    );
    const button = screen.getByRole('button', { name: /reconnect wallet/i });
    fireEvent.click(button);
    expect(onReconnectMock).toHaveBeenCalledTimes(1);
  });

  it('triggers onDismiss when Dismiss button is clicked', () => {
    const onDismissMock = vi.fn();
    render(
      <SessionRecoveryPrompt
        status="disconnected"
        expectedNetwork="testnet"
        onReconnect={vi.fn()}
        onDismiss={onDismissMock}
      />
    );
    const button = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(button);
    expect(onDismissMock).toHaveBeenCalledTimes(1);
  });
});
