import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { CopyButton } from '../../../src/components/v1/CopyButton';
import * as clipboardUtils from '../../../src/utils/v1/clipboard';
import { useErrorStore } from '../../../src/store/errorStore';

// Mock clipboard utility
vi.mock('../../../src/utils/v1/clipboard', () => ({
  copyToClipboard: vi.fn(),
}));

describe('CopyButton component', () => {
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    useErrorStore.setState({ setError: mockSetError, current: null, history: [], clearError: vi.fn(), clearHistory: vi.fn() });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with default icon variant', () => {
    render(<CopyButton text="hello" />);
    const button = screen.getByTestId('copy-button');
    expect(button).toBeInTheDocument();
    
    // Check for icon
    const icon = screen.getByTestId('copy-button-icon');
    expect(icon).toHaveClass('icon--copy');
  });

  it('renders text variant with provided children', () => {
    render(<CopyButton text="hello" variant="text">Copy ID</CopyButton>);
    
    const textSpan = screen.getByTestId('copy-button-text');
    expect(textSpan).toHaveTextContent('Copy ID');
  });

  it('handles successful copy and transitions state', async () => {
    vi.mocked(clipboardUtils.copyToClipboard).mockResolvedValueOnce({ success: true });
    const onCopySuccess = vi.fn();

    render(
      <CopyButton text="success-text" variant="both" onCopySuccess={onCopySuccess}>
        Copy
      </CopyButton>
    );

    const button = screen.getByTestId('copy-button');
    const textSpan = screen.getByTestId('copy-button-text');
    const icon = screen.getByTestId('copy-button-icon');
    
    expect(textSpan).toHaveTextContent('Copy');
    expect(icon).toHaveClass('icon--copy');

    // Click to copy
    fireEvent.click(button);

    // Initial click verified
    expect(clipboardUtils.copyToClipboard).toHaveBeenCalledWith('success-text');

    // Wait for the async copy task and state update to resolve
    await waitFor(() => {
        expect(screen.getByTestId('copy-button-text')).toHaveTextContent('Copied!');
    });
    
    // Check that success callback triggered
    expect(onCopySuccess).toHaveBeenCalledTimes(1);
    
    // Check class transition on icon
    expect(screen.getByTestId('copy-button-icon')).toHaveClass('icon--check-circle');

    // Advance timer to trigger reset
    vi.advanceTimersByTime(2500);

    // Should revert back to default state
    await waitFor(() => {
        expect(screen.getByTestId('copy-button-text')).toHaveTextContent('Copy');
    });
  });

  it('dispatches global error via store on failure', async () => {
    vi.mocked(clipboardUtils.copyToClipboard).mockResolvedValueOnce({ 
        success: false, 
        error: new Error('Exec failed') 
    });

    render(<CopyButton text="fail-text" />);
    
    const button = screen.getByTestId('copy-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(expect.objectContaining({
        code: 'CLIPBOARD_NOT_SUPPORTED',
        domain: 'ui',
        severity: 'user_actionable',
      }));
    });
  });

  it('handles unexpected exceptions during copy securely', async () => {
    vi.mocked(clipboardUtils.copyToClipboard).mockRejectedValueOnce(new Error('Unexpected Crash'));

    render(<CopyButton text="crash-text" />);
    
    const button = screen.getByTestId('copy-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(expect.objectContaining({
        code: 'CLIPBOARD_ERROR',
        domain: 'ui',
        severity: 'terminal',
      }));
    });
  });
});
