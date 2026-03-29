import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AppError } from '../../types/errors';
import { writeToClipboard } from '../../utils/v1/clipboard';
import { ErrorNotice } from './ErrorNotice';
import { useErrorStore } from '../../store/errorStore';

type CopyButtonStatus = 'idle' | 'copying' | 'copied';

export interface CopyButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  text: string;
  children?: React.ReactNode;
  idleLabel?: React.ReactNode;
  copyingLabel?: React.ReactNode;
  copiedLabel?: React.ReactNode;
  feedbackDurationMs?: number;
  variant?: 'icon' | 'text' | 'both';
  onCopy?: () => void | Promise<void>;
  onCopySuccess?: () => void | Promise<void>;
  onCopyError?: (error: AppError) => void | Promise<void>;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  testId?: string;
}

export function CopyButton({
  text,
  children,
  idleLabel,
  copyingLabel,
  copiedLabel,
  feedbackDurationMs = 2000,
  variant = 'icon',
  onCopy,
  onCopySuccess,
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
  const showIcon = variant === 'icon' || variant === 'both';
  const showText = variant === 'text' || variant === 'both';

  const resolvedIdleLabel = idleLabel ?? children ?? 'Copy';
  const resolvedCopyingLabel = copyingLabel ?? 'Copying...';
  const resolvedCopiedLabel = copiedLabel ?? 'Copied!';

  const textLabel = useMemo(() => {
    if (status === 'copying') {
      return resolvedCopyingLabel;
    }

    if (status === 'copied') {
      return resolvedCopiedLabel;
    }

    return resolvedIdleLabel;
  }, [
    resolvedCopiedLabel,
    resolvedCopyingLabel,
    resolvedIdleLabel,
    status,
  ]);

  const statusMessage = status === 'copied' ? 'Copied to clipboard.' : '';
  const iconName = status === 'copied' ? 'check-circle' : 'copy';

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
      await onCopySuccess?.();
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
        aria-label={status === 'copied' ? 'Copied to clipboard' : 'Copy to clipboard'}
        data-testid={testId}
      >
        {showIcon ? (
          <span
            className={`icon icon--${iconName}`}
            aria-hidden="true"
            data-testid={`${testId}-icon`}
          />
        ) : null}

        {showText ? (
          <span data-testid={`${testId}-text`}>{textLabel}</span>
        ) : null}
      </button>

      <span role="status" aria-live="polite" data-testid={`${testId}-status`}>
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
