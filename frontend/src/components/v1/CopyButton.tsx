import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AppError } from '../../types/errors';
import { writeToClipboard } from '../../utils/v1/clipboard';
import { ErrorNotice } from './ErrorNotice';
import { useErrorStore } from '../../store/errorStore';

type CopyButtonStatus = 'idle' | 'copying' | 'copied';

export interface CopyButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'onClick'
  > {
  text: string;
  idleLabel?: React.ReactNode;
  copyingLabel?: React.ReactNode;
  copiedLabel?: React.ReactNode;
  feedbackDurationMs?: number;
  onCopy?: () => void | Promise<void>;
  onCopyError?: (error: AppError) => void | Promise<void>;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  testId?: string;
}

export function CopyButton({
  text,
  idleLabel = 'Copy',
  copyingLabel = 'Copying...',
  copiedLabel = 'Copied',
  feedbackDurationMs = 2000,
  onCopy,
  onCopyError,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  testId = 'copy-button',
  ...buttonProps
}: CopyButtonProps) {
  const [status, setStatus] = useState<CopyButtonStatus>('idle');
  const [error, setError] = useState<AppError | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const setGlobalError = useErrorStore((state) => state.setError);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isBusy = status === 'copying';
  const isDisabled = disabled || isBusy;

  const buttonLabel = useMemo(() => {
    if (status === 'copying') {
      return copyingLabel;
    }

    if (status === 'copied') {
      return copiedLabel;
    }

    return idleLabel;
  }, [copiedLabel, copyingLabel, idleLabel, status]);

  const statusMessage = status === 'copied' ? 'Copied to clipboard.' : '';

  const scheduleReset = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setStatus('idle');
      timeoutRef.current = null;
    }, feedbackDurationMs);
  };

  const handleCopy = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    onClick?.(event);

    if (event.defaultPrevented || isDisabled) {
      return;
    }

    setError(null);
    setStatus('copying');

    const result = await writeToClipboard(text);

    if (result.ok) {
      await onCopy?.();
      setStatus('copied');
      scheduleReset();
      return;
    }

    setStatus('idle');
    setError(result.error);
    setGlobalError(result.error);
    await onCopyError?.(result.error);
  };

  return (
    <div className={className} data-testid={`${testId}-container`}>
      <button
        {...buttonProps}
        type={type}
        disabled={isDisabled}
        onClick={handleCopy}
        aria-busy={isBusy}
        aria-disabled={isDisabled}
        data-testid={testId}
      >
        {buttonLabel}
      </button>

      <span
        role="status"
        aria-live="polite"
        data-testid={`${testId}-status`}
      >
        {statusMessage}
      </span>

      {error ? (
        <ErrorNotice
          error={error}
          onDismiss={() => setError(null)}
          testId={`${testId}-error`}
        />
      ) : null}
    </div>
  );
}

export default CopyButton;
