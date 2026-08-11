/**
 * Standardized Error Mapping — core module.
 * Converts raw errors into typed AppError values.
 */

import {
  type AppError,
  ErrorDomain,
  ErrorSeverity,
  type AppErrorCode,
} from "../types/errors";

export function toAppError(
  raw: unknown,
  context?: Record<string, unknown>
): AppError {
  const message =
    raw instanceof Error
      ? raw.message
      : typeof raw === "string"
      ? raw
      : "Unexpected error occurred";

  const lower = message.toLowerCase();

  if (lower.includes("wallet") || lower.includes("freighter") || lower.includes("declined")) {
    return {
      code: "WALLET_UNKNOWN" as AppErrorCode,
      domain: ErrorDomain.WALLET,
      severity: ErrorSeverity.USER_ACTIONABLE,
      message,
      originalError: raw,
      context,
    };
  }

  if (lower.includes("rpc") || lower.includes("network") || lower.includes("fetch")) {
    return {
      code: "RPC_NODE_UNAVAILABLE" as AppErrorCode,
      domain: ErrorDomain.RPC,
      severity: ErrorSeverity.RETRYABLE,
      message,
      originalError: raw,
      context,
    };
  }

  if (lower.includes("contract") || lower.includes("hosterror")) {
    return {
      code: "CONTRACT_UNKNOWN" as AppErrorCode,
      domain: ErrorDomain.CONTRACT,
      severity: ErrorSeverity.TERMINAL,
      message,
      originalError: raw,
      context,
    };
  }

  return {
    code: "UNKNOWN" as AppErrorCode,
    domain: ErrorDomain.UNKNOWN,
    severity: ErrorSeverity.TERMINAL,
    message,
    originalError: raw,
    context,
  };
}

export interface ErrorNoticeData {
  message: string;
  action?: string;
  severity: ErrorSeverity;
  domain: ErrorDomain;
  code: string;
  canRetry: boolean;
  isUserActionable: boolean;
  debug?: {
    originalError?: unknown;
    context?: Record<string, unknown>;
    retryAfterMs?: number;
  };
}

export interface ErrorNoticeOptions {
  includeDebug?: boolean;
  customMessage?: string;
  customAction?: string;
}

export function normalizeErrorForDisplay(
  error: AppError,
  options: ErrorNoticeOptions = {}
): ErrorNoticeData {
  const { includeDebug = false, customMessage, customAction } = options;
  const message = customMessage || error.message;
  const action = customAction || (error.severity === ErrorSeverity.RETRYABLE ? "You can try again." : undefined);

  return {
    message,
    action,
    severity: error.severity,
    domain: error.domain,
    code: error.code,
    canRetry: error.severity === ErrorSeverity.RETRYABLE,
    isUserActionable: error.severity === ErrorSeverity.USER_ACTIONABLE,
    debug: includeDebug
      ? {
          originalError: error.originalError,
          context: error.context,
          retryAfterMs: error.retryAfterMs,
        }
      : undefined,
  };
}

export function shouldAutoDismiss(error: AppError): boolean {
  return (
    error.severity === ErrorSeverity.RETRYABLE &&
    error.domain === ErrorDomain.RPC &&
    error.code === "RPC_CONNECTION_TIMEOUT"
  );
}

export function getAutoDismissDelay(error: AppError): number {
  if (!shouldAutoDismiss(error)) return 0;
  return error.code === "RPC_CONNECTION_TIMEOUT" ? 3000 : 5000;
}

export function createFallbackErrorNotice(error: unknown): ErrorNoticeData {
  return {
    message: "An unexpected error occurred. Please try again.",
    severity: ErrorSeverity.TERMINAL,
    domain: ErrorDomain.UNKNOWN,
    code: "UNKNOWN",
    canRetry: false,
    isUserActionable: false,
    debug: { originalError: error },
  };
}

export default toAppError;
