"use client";

import React from "react";
import type { AsyncStatus } from "../types/async";
import { RecoverableErrorPanel } from "./RecoverableErrorPanel";

export interface AsyncStateBoundaryProps<T, E = unknown> {
  status: AsyncStatus;
  data?: T | null;
  error?: E | null;
  onRetry?: () => void | Promise<void>;
  renderIdle?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderMissing?: () => React.ReactNode;
  renderError?: (params: { error: E | null | undefined; retry?: () => void | Promise<void> }) => React.ReactNode;
  renderSuccess: (data: T) => React.ReactNode;
  isEmpty?: (data: T) => boolean;
  testId?: string;
  showStale?: boolean;
  staleMessage?: string;
}

const VALID_STATUS: readonly AsyncStatus[] = ["idle", "loading", "success", "error"] as const;

export function AsyncStateBoundary<T, E = unknown>({
  status,
  data,
  error = null,
  onRetry,
  renderIdle,
  renderLoading,
  renderEmpty,
  renderMissing,
  renderError,
  renderSuccess,
  isEmpty,
  testId = "async-state-boundary",
  showStale = false,
  staleMessage = "You are viewing stale data due to a refresh error.",
}: AsyncStateBoundaryProps<T, E>) {
  const safeStatus: AsyncStatus = VALID_STATUS.includes(status) ? status : "idle";

  if (safeStatus === "idle") {
    return <>{renderIdle?.() ?? null}</>;
  }

  if (safeStatus === "loading") {
    return <>{renderLoading?.() ?? <div data-testid={`${testId}-loading`}>Loading...</div>}</>;
  }

  if (safeStatus === "error") {
    if (showStale && data != null) {
      return (
        <div data-testid={`${testId}-stale`}>
          <div
            className="bg-amber-950/40 border-l-4 border-amber-400 p-4 mb-4 text-amber-200"
            role="alert"
            data-testid={`${testId}-stale-banner`}
          >
            <p className="text-sm">
              {staleMessage}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="ml-2 font-medium underline hover:text-amber-100"
                  data-testid={`${testId}-stale-retry`}
                >
                  Retry
                </button>
              )}
            </p>
          </div>
          {renderSuccess(data)}
        </div>
      );
    }

    if (renderError) {
      return <>{renderError({ error, retry: onRetry })}</>;
    }

    return (
      <RecoverableErrorPanel
        title="Something went wrong"
        message="We could not finish loading this content."
        description="Try the request again to recover the page without leaving your current flow."
        onRetry={onRetry}
        testId={`${testId}-error`}
      />
    );
  }

  if (typeof data === "undefined") {
    return <>{renderMissing?.() ?? <div data-testid={`${testId}-missing`}>Data is missing.</div>}</>;
  }

  if (data === null) {
    return <>{renderEmpty?.() ?? <div data-testid={`${testId}-empty`}>No data available.</div>}</>;
  }

  if (isEmpty && isEmpty(data)) {
    return <>{renderEmpty?.() ?? <div data-testid={`${testId}-empty`}>No data available.</div>}</>;
  }

  return <>{renderSuccess(data)}</>;
}

export default AsyncStateBoundary;
