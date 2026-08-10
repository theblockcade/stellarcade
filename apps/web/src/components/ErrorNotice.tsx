"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, X, XCircle } from "lucide-react";
import type { AppError, ApiErrorDetails } from "../types/errors";
import { isBannerDismissed, persistBannerDismissal } from "../services/global-state-store";
import {
  type ErrorNoticeData,
  type ErrorNoticeOptions,
  normalizeErrorForDisplay,
  shouldAutoDismiss,
  getAutoDismissDelay,
  createFallbackErrorNotice,
} from "../utils/errorMapper";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";

export interface ErrorNoticeProps {
  error?: AppError | unknown;
  options?: ErrorNoticeOptions;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  showDismiss?: boolean;
  showRetry?: boolean;
  autoDismiss?: boolean;
  className?: string;
  testId?: string;
  visible?: boolean;
  persistDismissal?: boolean;
  dismissalKey?: string;
  dismissalIdentity?: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  retryable:
    "border-[color:var(--sc-info)] text-[color:var(--sc-info)] [&>svg]:text-[color:var(--sc-info)]",
  user_actionable:
    "border-[color:var(--sc-warning)] text-[color:var(--sc-warning)] [&>svg]:text-[color:var(--sc-warning)]",
  terminal: "border-destructive text-destructive [&>svg]:text-destructive",
  fatal: "border-destructive text-destructive [&>svg]:text-destructive",
};

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "retryable":
      return <RefreshCw />;
    case "user_actionable":
      return <AlertTriangle />;
    default:
      return <XCircle />;
  }
}

function DebugInfo({ debug, testId }: { debug: NonNullable<ErrorNoticeData["debug"]>; testId?: string }) {
  return (
    <details className="mt-2 text-xs" data-testid={testId ? `${testId}-debug` : "error-notice-debug"}>
      <summary className="cursor-pointer text-muted-foreground">Debug Info</summary>
      <div className="mt-1 space-y-1">
        {!!debug.originalError && (
          <div>
            <strong>Original Error:</strong>
            <pre
              className="overflow-x-auto rounded bg-muted p-2"
              data-testid={testId ? `${testId}-debug-original` : "error-notice-debug-original"}
            >
              {debug.originalError instanceof Error
                ? debug.originalError.stack || debug.originalError.message
                : JSON.stringify(debug.originalError, null, 2)}
            </pre>
          </div>
        )}
        {debug.context && Object.keys(debug.context).length > 0 && (
          <div>
            <strong>Context:</strong>
            <pre className="overflow-x-auto rounded bg-muted p-2">
              {JSON.stringify(debug.context, null, 2)}
            </pre>
          </div>
        )}
        {debug.retryAfterMs && (
          <div>
            <strong>Retry After:</strong> {debug.retryAfterMs}ms
          </div>
        )}
      </div>
    </details>
  );
}

function ApiErrorDetailsSection({ details, testId }: { details: ApiErrorDetails; testId?: string }) {
  const hasContent =
    details.errorCode || details.requestId || (details.fieldErrors && details.fieldErrors.length > 0);
  if (!hasContent) return null;

  return (
    <details
      className="mt-2 text-xs"
      data-testid={testId ? `${testId}-api-details` : "error-notice-api-details"}
    >
      <summary className="cursor-pointer text-muted-foreground">Error Details</summary>
      <div className="mt-1 space-y-1">
        {details.errorCode && (
          <div>
            <strong>Error Code:</strong> {details.errorCode}
          </div>
        )}
        {details.requestId && (
          <div>
            <strong>Request ID:</strong>{" "}
            <code data-testid={testId ? `${testId}-request-id` : "error-notice-request-id"}>
              {details.requestId}
            </code>
          </div>
        )}
        {details.fieldErrors && details.fieldErrors.length > 0 && (
          <div>
            <strong>Field Errors:</strong>
            <ul className="list-disc pl-4">
              {details.fieldErrors.map((fe, i) => (
                <li key={`${fe.field}-${i}`}>
                  <strong>{fe.field}:</strong> {fe.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

/**
 * Next.js/shadcn port of frontend/src/components/v1/ErrorNotice.tsx — same
 * normalization/dismissal/retry logic (unchanged, from utils/errorMapper.ts
 * and services/global-state-store.ts), rebuilt on shadcn's Alert (pulled via
 * 21st.dev) instead of hand-rolled markup/CSS classes per severity.
 */
export const ErrorNotice: React.FC<ErrorNoticeProps> = ({
  error,
  options = {},
  onRetry,
  onDismiss,
  showDismiss = true,
  showRetry = true,
  autoDismiss = false,
  className = "",
  testId = "error-notice",
  visible = true,
  persistDismissal = false,
  dismissalKey = "error-notice",
  dismissalIdentity,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const errorData: ErrorNoticeData | null = useMemo(() => {
    if (!error) return null;
    try {
      if (error && typeof error === "object" && "code" in error && "domain" in error) {
        return normalizeErrorForDisplay(error as AppError, options);
      }
      return createFallbackErrorNotice(error);
    } catch {
      return createFallbackErrorNotice(error);
    }
  }, [error, options]);

  const resolvedDismissalIdentity =
    dismissalIdentity ?? (errorData ? `${errorData.domain}:${errorData.code}:${errorData.message}` : "no-error");

  useEffect(() => {
    if (!visible || !errorData) {
      setIsVisible(false);
      return;
    }
    if (persistDismissal) {
      setIsVisible(!isBannerDismissed(dismissalKey, resolvedDismissalIdentity));
      return;
    }
    setIsVisible(true);
  }, [visible, errorData, persistDismissal, dismissalKey, resolvedDismissalIdentity]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    if (persistDismissal) {
      persistBannerDismissal(dismissalKey, resolvedDismissalIdentity, true);
    }
    onDismiss?.();
  }, [onDismiss, persistDismissal, dismissalKey, resolvedDismissalIdentity]);

  const handleRetry = useCallback(async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry]);

  useEffect(() => {
    if (!isVisible || !errorData || !autoDismiss) return;

    const isAppError = error && typeof error === "object" && "code" in error && "domain" in error;
    const shouldAuto = isAppError ? shouldAutoDismiss(error as AppError) : false;
    if (!shouldAuto) return;

    const delay = isAppError ? getAutoDismissDelay(error as AppError) : 0;
    if (delay > 0) {
      const timer = setTimeout(() => handleDismiss(), delay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, errorData, autoDismiss, error, handleDismiss]);

  if (!errorData || !isVisible) {
    return null;
  }
  if (!errorData.message || !errorData.severity || !errorData.code) {
    return null;
  }

  const appErrorWithDetails =
    error && typeof error === "object" && "apiDetails" in error ? (error as AppError) : null;

  return (
    <Alert
      variant={errorData.severity === "terminal" || errorData.severity === "fatal" ? "destructive" : "default"}
      className={`${SEVERITY_STYLES[errorData.severity] ?? ""} ${className}`.trim()}
      data-testid={testId}
      data-error-code={errorData.code}
      data-error-severity={errorData.severity}
      data-error-domain={errorData.domain}
    >
      <SeverityIcon severity={errorData.severity} />

      <AlertTitle className="sr-only">Error</AlertTitle>
      <AlertDescription>
        <div role="alert">{String(errorData.message)}</div>
        {errorData.action && <div className="text-muted-foreground">{String(errorData.action)}</div>}
      </AlertDescription>

      {((showRetry && errorData.canRetry && onRetry) || (showDismiss && onDismiss)) && (
        <div className="col-start-2 mt-2 flex items-center gap-2">
          {showRetry && errorData.canRetry && onRetry && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isRetrying}
              data-testid={`${testId}-retry`}
              aria-label="Retry action"
            >
              {isRetrying ? "Retrying..." : "Retry"}
            </Button>
          )}
          {showDismiss && onDismiss && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={handleDismiss}
              data-testid={`${testId}-dismiss`}
              aria-label="Dismiss error"
            >
              <X />
            </Button>
          )}
        </div>
      )}

      {appErrorWithDetails?.apiDetails && (
        <div className="col-start-2">
          <ApiErrorDetailsSection details={appErrorWithDetails.apiDetails} testId={testId} />
        </div>
      )}

      {errorData.debug && (
        <div className="col-start-2">
          <DebugInfo debug={errorData.debug} testId={testId} />
        </div>
      )}
    </Alert>
  );
};

ErrorNotice.displayName = "ErrorNotice";

export const NetworkErrorNotice: React.FC<Omit<ErrorNoticeProps, "error">> = (props) => (
  <ErrorNotice
    error={{
      code: "RPC_NODE_UNAVAILABLE",
      domain: "rpc",
      severity: "retryable",
      message: "Network error occurred",
    } as AppError}
    showRetry
    autoDismiss={false}
    {...props}
  />
);

export const WalletErrorNotice: React.FC<Omit<ErrorNoticeProps, "error">> = (props) => (
  <ErrorNotice
    error={{
      code: "WALLET_NOT_CONNECTED",
      domain: "wallet",
      severity: "user_actionable",
      message: "Wallet not connected",
    } as AppError}
    showRetry={false}
    autoDismiss={false}
    {...props}
  />
);

export const ValidationErrorNotice: React.FC<Omit<ErrorNoticeProps, "error">> = (props) => (
  <ErrorNotice
    error={{
      code: "API_VALIDATION_ERROR",
      domain: "api",
      severity: "user_actionable",
      message: "Validation error occurred",
    } as AppError}
    showRetry={false}
    autoDismiss={false}
    {...props}
  />
);

export default ErrorNotice;
