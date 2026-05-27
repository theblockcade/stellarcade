import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletContractHealthChips } from '../../../src/components/v1/WalletContractHealthChips';
import type { HealthChipSurface } from '../../../src/components/v1/WalletContractHealthChips';

const walletSurface: HealthChipSurface = {
  id: 'wallet',
  label: 'Wallet',
  status: 'connected',
  detail: 'GA...XXXX',
};

const contractSurface: HealthChipSurface = {
  id: 'prize-pool',
  label: 'PrizePool',
  status: 'active',
};

describe('WalletContractHealthChips', () => {
  describe('Rendering', () => {
    it('renders the region with aria-label', () => {
      render(<WalletContractHealthChips surfaces={[walletSurface]} />);
      expect(screen.getByRole('region', { name: /surface health/i })).toBeInTheDocument();
    });

    it('renders a chip per surface', () => {
      render(<WalletContractHealthChips surfaces={[walletSurface, contractSurface]} />);
      expect(screen.getByTestId('wallet-contract-health-chips-chip-wallet')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-contract-health-chips-chip-prize-pool')).toBeInTheDocument();
    });

    it('shows surface label and status text on each chip', () => {
      render(<WalletContractHealthChips surfaces={[walletSurface]} />);
      expect(screen.getByText('Wallet')).toBeInTheDocument();
      expect(screen.getByText('connected')).toBeInTheDocument();
    });
  });

  describe('Tone mapping', () => {
    it('applies success tone for connected status', () => {
      render(<WalletContractHealthChips surfaces={[{ ...walletSurface, status: 'connected' }]} />);
      const chip = screen.getByTestId('wallet-contract-health-chips-chip-wallet');
      expect(chip).toHaveAttribute('data-tone', 'success');
    });

    it('applies pending tone for connecting status', () => {
      render(<WalletContractHealthChips surfaces={[{ ...walletSurface, status: 'connecting' }]} />);
      const chip = screen.getByTestId('wallet-contract-health-chips-chip-wallet');
      expect(chip).toHaveAttribute('data-tone', 'pending');
    });

    it('applies warning tone for degraded status', () => {
      render(<WalletContractHealthChips surfaces={[{ ...walletSurface, status: 'degraded' }]} />);
      const chip = screen.getByTestId('wallet-contract-health-chips-chip-wallet');
      expect(chip).toHaveAttribute('data-tone', 'warning');
    });

    it('applies error tone for error status', () => {
      render(<WalletContractHealthChips surfaces={[{ ...walletSurface, status: 'error' }]} />);
      const chip = screen.getByTestId('wallet-contract-health-chips-chip-wallet');
      expect(chip).toHaveAttribute('data-tone', 'error');
    });

    it('applies neutral tone for unknown status', () => {
      render(<WalletContractHealthChips surfaces={[{ ...walletSurface, status: 'unknown' }]} />);
      const chip = screen.getByTestId('wallet-contract-health-chips-chip-wallet');
      expect(chip).toHaveAttribute('data-tone', 'neutral');
    });
  });

  describe('Loading state', () => {
    it('shows skeleton chips when isLoading is true', () => {
      render(<WalletContractHealthChips surfaces={[]} isLoading skeletonCount={3} />);
      expect(screen.getAllByTestId('wallet-contract-health-chips-skeleton')).toHaveLength(3);
    });

    it('sets aria-busy when loading', () => {
      render(<WalletContractHealthChips surfaces={[]} isLoading />);
      expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
    });

    it('does not render chips when loading', () => {
      render(<WalletContractHealthChips surfaces={[walletSurface]} isLoading />);
      expect(screen.queryByTestId('wallet-contract-health-chips-chip-wallet')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty message when surfaces is empty and not loading', () => {
      render(<WalletContractHealthChips surfaces={[]} />);
      expect(screen.getByTestId('wallet-contract-health-chips-empty')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('each chip has role="status" with aria-label', () => {
      render(<WalletContractHealthChips surfaces={[walletSurface]} />);
      const chip = screen.getByTestId('wallet-contract-health-chips-chip-wallet');
      expect(chip).toHaveAttribute('role', 'status');
      expect(chip).toHaveAttribute('aria-label', 'Wallet: connected');
    });
  });
});
