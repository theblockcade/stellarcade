"use client";

import React, { useMemo } from "react";
import type { AppError } from "../types/errors";
import { toAppError } from "../utils/errorMapper";
import { useAsyncAction } from "../hooks/useAsyncAction";
import ErrorNotice from "./ErrorNotice";
import { MultiStepProgressIndicator, type ProgressStep } from "./MultiStepProgressIndicator";
import "./ContractActionButton.css";

export interface ContractActionButtonProps<T = unknown> {
  label: string;
  loadingLabel?: string;
  action: () => Promise<T>;
  walletConnected: boolean;
  networkSupported: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onSuccess?: (result: T) => void | Promise<void>;
  onError?: (error: AppError) => void | Promise<void>;
  className?: string;
  testId?: string;
  progressSteps?: ProgressStep[];
  currentStepIndex?: number;
  showProgress?: boolean;
}

export function ContractActionButton<T = unknown>({
  label,
  loadingLabel = "Processing...",
  action,
  walletConnected,
  networkSupported,
  disabled = false,
  disabledReason,
  onSuccess,
  onError,
  className = "",
  testId = "contract-action-button",
  progressSteps,
  currentStepIndex = 0,
  showProgress = false,
}: ContractActionButtonProps<T>) {
  const sanitizedLabel = useMemo(() => {
    const trimmed = label.trim();
    return trimmed.length > 0 ? trimmed : "Run action";
  }, [label]);

  const blockedReason = useMemo(() => {
    if (!walletConnected) {
      return "Connect wallet to continue.";
    }
    if (!networkSupported) {
      return "Switch to a supported network.";
    }
    return null;
  }, [walletConnected, networkSupported]);

  const {
    isPendingSubmit,
    error: rawError,
    run,
  } = useAsyncAction<T, Error>(action, {
    preventConcurrent: true,
    onSuccess: async (result) => {
      await onSuccess?.(result);
    },
    onError: async (err) => {
      const mapped = toAppError(err);
      await onError?.(mapped);
    },
  });

  const error: AppError | null = rawError ? toAppError(rawError) : null;
  const isDisabled = disabled || isPendingSubmit || blockedReason !== null;

  const handleClick = async () => {
    if (isDisabled) return;
    try {
      await run();
    } catch {
      // handled via onError
    }
  };

  return (
    <div className={className} data-testid={`${testId}-container`}>
      {showProgress && progressSteps && progressSteps.length > 1 && (
        <div className="contract-action-button__progress" data-testid={`${testId}-progress`}>
          <MultiStepProgressIndicator
            steps={progressSteps}
            currentStepIndex={currentStepIndex}
            hasError={error !== null}
            size="small"
            showStepNumbers={true}
            testId={`${testId}-progress-indicator`}
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        data-testid={testId}
        aria-busy={isPendingSubmit}
        aria-disabled={isDisabled}
        className="contract-action-button__button"
      >
        {isPendingSubmit ? loadingLabel : sanitizedLabel}
      </button>

      {blockedReason && (
        <p
          data-testid={`${testId}-precondition`}
          role="status"
          aria-live="polite"
          style={{ fontSize: "0.8125rem", color: "var(--sc-text-dim)", marginTop: "0.35rem" }}
        >
          {blockedReason}
        </p>
      )}

      {!blockedReason && disabled && disabledReason && (
        <p
          data-testid={`${testId}-disabled-reason`}
          className="contract-action-button__disabled-reason"
          role="status"
          aria-live="polite"
        >
          {disabledReason}
        </p>
      )}

      {error && (
        <div data-testid={`${testId}-error-region`} style={{ marginTop: "0.5rem" }}>
          <ErrorNotice error={error} testId={`${testId}-error`} />
        </div>
      )}
    </div>
  );
}

export default ContractActionButton;
