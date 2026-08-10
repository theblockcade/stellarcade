/**
 * API Trace Types
 * 
 * Centralized type definitions for the API request lifecycle metadata 
 * captured by the diagnostic tracing system.
 */

export interface ApiTraceEventPayload {
  /** Unique ID for the trace, generated when a network operation starts. */
  traceId: string;
  /** Grouping tag for where the request originated (e.g. 'ApiClient', 'NetworkGuard') */
  source: string;
  /** HTTP method or operation name (e.g. 'GET', 'POST', 'GuardCheck') */
  method: string;
  /** The fully qualified URL or endpoint path */
  url: string;
  /** Timestamp when the event started (ms since epoch) */
  startTime: number;
  /** Timestamp when the event completed/failed/cancelled (ms since epoch). Null if still 'pending' */
  endTime: number | null;
  /** The total duration of the operation in ms. Null if still 'pending' */
  durationMs: number | null;
  /** Status of the network operation */
  status: 'pending' | 'success' | 'error' | 'cancelled';
  /** The HTTP status code if applicable and available */
  statusCode?: number;
  /** Error object if the operation failed. Used primarily for diagnostic panel display */
  errorData?: unknown;
}

export type ApiTraceCustomEvent = CustomEvent<ApiTraceEventPayload>;

/** Constant for the window event listener string to ensure consistency. */
export const API_TRACE_EVENT_NAME = 'stellarcade:api-trace';

/** Dispatcher helper to make it easy to fire consistent trace events. */
export function dispatchApiTrace(payload: ApiTraceEventPayload): void {
  // Only dispatch in browser environments
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    const event = new CustomEvent<ApiTraceEventPayload>(API_TRACE_EVENT_NAME, {
      detail: payload,
    });
    window.dispatchEvent(event);
  }
}
