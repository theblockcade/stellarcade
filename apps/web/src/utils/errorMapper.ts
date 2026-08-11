/**
 * Standardized Error Mapping — core module.
 * Converts raw errors into typed AppError values.
 */

import {
  type AppError,
  ErrorDomain,
  ErrorSeverity,
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
      code: "WALLET_ERROR",
      domain: ErrorDomain.WALLET,
      severity: ErrorSeverity.USER_ACTIONABLE,
      message,
      originalError: raw,
      context,
    };
  }

  if (lower.includes("rpc") || lower.includes("network") || lower.includes("fetch")) {
    return {
      code: "RPC_ERROR",
      domain: ErrorDomain.RPC,
      severity: ErrorSeverity.RETRYABLE,
      message,
      originalError: raw,
      context,
    };
  }

  if (lower.includes("contract") || lower.includes("hosterror")) {
    return {
      code: "CONTRACT_ERROR",
      domain: ErrorDomain.CONTRACT,
      severity: ErrorSeverity.TERMINAL,
      message,
      originalError: raw,
      context,
    };
  }

  return {
    code: "UNKNOWN",
    domain: ErrorDomain.UNKNOWN,
    severity: ErrorSeverity.TERMINAL,
    message,
    originalError: raw,
    context,
  };
}

export default toAppError;
