import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyableWalletKeyField } from '../../src/components/v1/CopyableWalletKeyField';
import '../../src/components/v1/CopyableWalletKeyField.css';

// Mock the clipboard utility
vi.mock('../../src/utils/v1/clipboard', () => ({
  copyToClipboard: vi.fn(async (text: string) => ({
    success: true,
    text,
  })),
}));

describe('CopyableWalletKeyField', () => {
  const mockKey = 'SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const mockOnCopySuccess = vi.fn();
  const mockOnCopyError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with label and key', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
        />
      );

      expect(screen.getByText('Private Key')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-key-display')).toBeInTheDocument();
    });

    it('displays the key value', () => {
      render(
        <CopyableWalletKeyField
          label="Address"
          value={mockKey}
          testId="wallet-key"
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      const codeElement = display.querySelector('code');
      expect(codeElement?.textContent).toBe(mockKey);
    });

    it('applies correct ARIA labels', () => {
      render(
        <CopyableWalletKeyField
          label="Wallet Key"
          value={mockKey}
          testId="wallet-key"
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      expect(display).toHaveAttribute('role', 'button');
      expect(display).toHaveAttribute('tabIndex', '0');
      expect(display).toHaveAttribute('aria-label');
    });
  });

  describe('masking behavior', () => {
    it('masks the value when masked prop is true', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          masked={true}
          testId="wallet-key"
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      expect(display.textContent).not.toContain(mockKey);
    });

    it('reveals the value by default when masked is false', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          masked={false}
          testId="wallet-key"
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      const codeElement = display.querySelector('code');
      expect(codeElement?.textContent).toBe(mockKey);
    });

    it('uses custom maskChar when provided', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          masked={true}
          maskChar="#"
          testId="wallet-key"
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      expect(display.textContent).toContain('#');
      expect(display.textContent).not.toContain('*');
    });
  });

  describe('toggle reveal button', () => {
    it('renders toggle button by default', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          masked={true}
          testId="wallet-key"
        />
      );

      expect(screen.getByTestId('wallet-key-toggle')).toBeInTheDocument();
    });

    it('does not render toggle button when showToggle is false', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          showToggle={false}
          testId="wallet-key"
        />
      );

      expect(screen.queryByTestId('wallet-key-toggle')).not.toBeInTheDocument();
    });

    it('toggles value visibility when button is clicked', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          masked={true}
          testId="wallet-key"
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      const toggleButton = screen.getByTestId('wallet-key-toggle');

      // Initially masked
      expect(display.textContent).not.toContain(mockKey);

      // Click toggle
      fireEvent.click(toggleButton);

      // Should be revealed
      const codeElement = display.querySelector('code');
      expect(codeElement?.textContent).toBe(mockKey);

      // Click toggle again
      fireEvent.click(toggleButton);

      // Should be masked again
      expect(display.textContent).not.toContain(mockKey);
    });
  });

  describe('copy functionality', () => {
    it('copies value when display is clicked', async () => {
      const { copyToClipboard } = await import('../../src/utils/v1/clipboard');

      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
          onCopySuccess={mockOnCopySuccess}
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      fireEvent.click(display);

      expect(copyToClipboard).toHaveBeenCalledWith(mockKey);
    });

    it('copies value when Enter key is pressed', async () => {
      const { copyToClipboard } = await import('../../src/utils/v1/clipboard');

      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      fireEvent.keyDown(display, { key: 'Enter' });

      expect(copyToClipboard).toHaveBeenCalledWith(mockKey);
    });

    it('copies value when Space key is pressed', async () => {
      const { copyToClipboard } = await import('../../src/utils/v1/clipboard');

      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      fireEvent.keyDown(display, { key: ' ' });

      expect(copyToClipboard).toHaveBeenCalledWith(mockKey);
    });

    it('calls onCopySuccess callback on successful copy', async () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
          onCopySuccess={mockOnCopySuccess}
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      fireEvent.click(display);

      await waitFor(() => {
        expect(mockOnCopySuccess).toHaveBeenCalled();
      });
    });
  });

  describe('copy feedback', () => {
    it('shows copy icon initially', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
        />
      );

      const icon = screen.getByTestId('wallet-key-icon');
      expect(icon).toHaveClass('copyable-wallet-key-field__icon--copy');
    });

    it('changes to check icon after successful copy', async () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
          feedbackDurationMs={100}
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      fireEvent.click(display);

      const icon = screen.getByTestId('wallet-key-icon');
      await waitFor(() => {
        expect(icon).toHaveClass('copyable-wallet-key-field__icon--check');
      });
    });

    it('reverts to copy icon after feedback duration', async () => {
      vi.useFakeTimers();

      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
          feedbackDurationMs={100}
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      fireEvent.click(display);

      let icon = screen.getByTestId('wallet-key-icon');
      await waitFor(() => {
        expect(icon).toHaveClass('copyable-wallet-key-field__icon--check');
      });

      // Fast-forward time
      vi.advanceTimersByTime(150);

      await waitFor(() => {
        expect(icon).toHaveClass('copyable-wallet-key-field__icon--copy');
      });

      vi.useRealTimers();
    });

    it('sets aria-pressed when copied', async () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
        />
      );

      const display = screen.getByTestId('wallet-key-display');

      // Initially not pressed
      expect(display).not.toHaveAttribute('aria-pressed', 'true');

      // After click
      fireEvent.click(display);
      await waitFor(() => {
        expect(display).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('error handling', () => {
    it('displays error message on copy failure', async () => {
      const { copyToClipboard } = await import('../../src/utils/v1/clipboard');
      vi.mocked(copyToClipboard).mockResolvedValueOnce({ success: false, text: '' });

      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
          onCopyError={mockOnCopyError}
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      fireEvent.click(display);

      await waitFor(() => {
        expect(screen.getByTestId('wallet-key-error')).toBeInTheDocument();
      });
    });

    it('calls onCopyError callback on failure', async () => {
      const { copyToClipboard } = await import('../../src/utils/v1/clipboard');
      vi.mocked(copyToClipboard).mockRejectedValueOnce(new Error('Copy failed'));

      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
          onCopyError={mockOnCopyError}
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      fireEvent.click(display);

      await waitFor(() => {
        expect(mockOnCopyError).toHaveBeenCalled();
      });
    });
  });

  describe('custom properties', () => {
    it('accepts custom className', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          className="custom-class"
          testId="wallet-key"
        />
      );

      const container = screen.getByTestId('wallet-key');
      expect(container).toHaveClass('custom-class');
    });

    it('accepts custom feedbackDurationMs parameter', () => {
      // This test verifies the component accepts custom feedbackDurationMs
      // The actual timing behavior is tested in "reverts to copy icon after feedback duration"
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
          feedbackDurationMs={500}
        />
      );

      expect(screen.getByTestId('wallet-key')).toBeInTheDocument();
    });

    it('renders hint text', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
        />
      );

      expect(
        screen.getByText('Click the field or key to copy to clipboard')
      ).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper label association', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
        />
      );

      const label = screen.getByText('Private Key');
      expect(label).toHaveAttribute('for', 'wallet-key-display');
    });

    it('provides aria-label for display', () => {
      render(
        <CopyableWalletKeyField
          label="Wallet Address"
          value={mockKey}
          testId="wallet-key"
        />
      );

      const display = screen.getByTestId('wallet-key-display');
      const ariaLabel = display.getAttribute('aria-label');
      expect(ariaLabel).toContain('Wallet Address');
    });

    it('hides icon from screen readers', () => {
      render(
        <CopyableWalletKeyField
          label="Private Key"
          value={mockKey}
          testId="wallet-key"
        />
      );

      const icon = screen.getByTestId('wallet-key-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
