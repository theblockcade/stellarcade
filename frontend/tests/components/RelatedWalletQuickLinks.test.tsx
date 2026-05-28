/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RelatedWalletQuickLinks, type RelatedWallet } from '@/components/v1/RelatedWalletQuickLinks';

const mockWallets: RelatedWallet[] = [
  {
    id: 'wallet-1',
    address: 'GCKFBEIYTKP7GNCZXMWWKMPOH4KRPVZRAYCVMHZOOQBK4IDZKH4PGWNC',
    label: 'Alice Wallet',
    relationship: 'signer',
    txCount: 12,
    href: '/wallet/alice',
  },
  {
    id: 'wallet-2',
    address: 'GBXGBIMP4HKDQDNPQMCKNDRKIHR3OGNQJCFHYHROG4THA7HRVPZPGWNC',
    label: 'Bob Sponsor',
    relationship: 'sponsor',
    txCount: 5,
  },
  {
    id: 'wallet-3',
    address: 'GCJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEF',
    relationship: 'counterparty',
  },
];

describe('RelatedWalletQuickLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Primary Success Path', () => {
    it('renders all wallet links with correct labels', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} />);

      expect(screen.getByText('Alice Wallet')).toBeInTheDocument();
      expect(screen.getByText('Bob Sponsor')).toBeInTheDocument();
      expect(screen.getByText('Signer')).toBeInTheDocument();
      expect(screen.getByText('Sponsor')).toBeInTheDocument();
    });

    it('truncates address when label is missing', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} />);

      const noLabelWallet = mockWallets[2];
      const expectedTruncated = `${noLabelWallet.address.slice(0, 6)}...${noLabelWallet.address.slice(-4)}`;
      expect(screen.getByText(expectedTruncated)).toBeInTheDocument();
    });

    it('displays tx count badges', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} />);

      expect(screen.getByLabelText('12 transactions')).toBeInTheDocument();
      expect(screen.getByLabelText('5 transactions')).toBeInTheDocument();
    });

    it('handles wallet selection', () => {
      const onSelect = vi.fn();
      render(<RelatedWalletQuickLinks wallets={mockWallets} onSelect={onSelect} />);

      fireEvent.click(screen.getByTestId('related-wallet-quick-links-wallet-wallet-1'));
      expect(onSelect).toHaveBeenCalledWith('wallet-1');
    });

    it('highlights active wallet', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} activeWalletId="wallet-2" />);

      const activeItem = screen.getByTestId('related-wallet-quick-links-wallet-wallet-2');
      expect(activeItem).toHaveClass('related-wallet-links__item--active');
      expect(activeItem).toHaveAttribute('aria-current', 'page');
    });

    it('renders links with href as anchor tags', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} />);

      const link = screen.getByTestId('related-wallet-quick-links-wallet-wallet-1');
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/wallet/alice');
    });

    it('renders wallets without href as buttons', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} />);

      const button = screen.getByTestId('related-wallet-quick-links-wallet-wallet-2');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Edge Cases and Fallback Behavior', () => {
    it('shows empty state when no wallets provided', () => {
      render(<RelatedWalletQuickLinks wallets={[]} />);

      expect(screen.getByTestId('related-wallet-quick-links-empty')).toBeInTheDocument();
      expect(screen.getByText('No related wallets found')).toBeInTheDocument();
    });

    it('shows custom empty message', () => {
      render(
        <RelatedWalletQuickLinks wallets={[]} emptyMessage="No wallets here" />
      );

      expect(screen.getByText('No wallets here')).toBeInTheDocument();
    });

    it('shows loading state with skeletons', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} loading={true} />);

      expect(screen.getByTestId('related-wallet-quick-links-loading')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} className="custom-class" />);

      expect(screen.getByTestId('related-wallet-quick-links')).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has navigation role with aria-label', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} />);

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Related wallets');
    });

    it('has list role', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('Layout Variants', () => {
    it('applies correct CSS class for vertical layout', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} layout="vertical" />);

      expect(screen.getByTestId('related-wallet-quick-links')).toHaveClass('related-wallet-links--vertical');
    });

    it('applies correct CSS class for grid layout', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} layout="grid" />);

      expect(screen.getByTestId('related-wallet-quick-links')).toHaveClass('related-wallet-links--grid');
    });

    it('applies compact class when compact is true', () => {
      render(<RelatedWalletQuickLinks wallets={mockWallets} compact={true} />);

      expect(screen.getByTestId('related-wallet-quick-links')).toHaveClass('related-wallet-links--compact');
    });
  });
});
