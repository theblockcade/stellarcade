import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CopyButton } from '@/components/v1/CopyButton';
import { useErrorStore } from '@/store/errorStore';

describe('CopyButton', () => {
  const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
    Navigator.prototype,
    'clipboard',
  );
  const originalExecCommandDescriptor = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'execCommand',
  );

  afterEach(() => {
    useErrorStore.getState().clearError();
    useErrorStore.getState().clearHistory();
    vi.useRealTimers();

    if (originalClipboardDescriptor) {
      Object.defineProperty(
        Navigator.prototype,
        'clipboard',
        originalClipboardDescriptor,
      );
    } else {
      Reflect.deleteProperty(Navigator.prototype, 'clipboard');
    }

    if (originalExecCommandDescriptor) {
      Object.defineProperty(
        Document.prototype,
        'execCommand',
        originalExecCommandDescriptor,
      );
    } else {
      Reflect.deleteProperty(Document.prototype, 'execCommand');
    }
  });

  it('shows copied feedback after a successful copy and resets after the timeout', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const onCopy = vi.fn();

    Object.defineProperty(Navigator.prototype, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    });

    render(
      <CopyButton
        text="stellar address"
        idleLabel="Copy address"
        copiedLabel="Address copied"
        feedbackDurationMs={1500}
        onCopy={onCopy}
      />,
    );

    const button = screen.getByTestId('copy-button');
    fireEvent.click(button);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('stellar address'));
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(1));
    expect(button).toHaveTextContent('Address copied');
    expect(screen.getByTestId('copy-button-status')).toHaveTextContent(
      'Copied to clipboard.',
    );

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    await waitFor(() => expect(button).toHaveTextContent('Copy address'));
  });

  it('shows failure feedback and records the error in the global store', async () => {
    const onCopyError = vi.fn();

    Reflect.deleteProperty(Navigator.prototype, 'clipboard');
    Reflect.deleteProperty(Document.prototype, 'execCommand');

    render(
      <CopyButton
        text="stellar address"
        idleLabel="Copy address"
        onCopyError={onCopyError}
      />,
    );

    fireEvent.click(screen.getByTestId('copy-button'));

    await waitFor(() => expect(onCopyError).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('copy-button-error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Copy is not supported in this environment.',
    );
    expect(useErrorStore.getState().current?.message).toBe(
      'Copy is not supported in this environment.',
    );
  });
});
