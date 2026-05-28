import { useState, useEffect, useCallback, useRef } from 'react';
import { API_TRACE_EVENT_NAME, ApiTraceEventPayload, ApiTraceCustomEvent } from '../../types/api-trace';

export interface UseApiTraceOptions {
  /** Maximum number of completed/failed traces to retain in memory. Defaults to 50. */
  maxHistory?: number;
  /** Whether tracing is currently active. Defaults to true. */
  enabled?: boolean;
}

export interface ApiTraceState {
  /** Active requests that have started but not yet completed. */
  pending: ApiTraceEventPayload[];
  /** Historical requests that have completed, failed, or been cancelled. Newest first. */
  history: ApiTraceEventPayload[];
  /** Function to clear the complete trace history from state. */
  clearHistory: () => void;
}

/**
 * useApiTrace - v1
 * 
 * Diagnostic hook that captures API request lifecycle metadata 
 * (start, end, duration, status) emitted by the SDK and network services.
 * Integrates hook-friendly CustomEvents into React state.
 */
export function useApiTrace(options: UseApiTraceOptions = {}): ApiTraceState {
  const { maxHistory = 50, enabled = true } = options;

  const [pending, setPending] = useState<ApiTraceEventPayload[]>([]);
  const [history, setHistory] = useState<ApiTraceEventPayload[]>([]);
  
  // Use a ref for maxHistory so it can be used inside the static listener without
  // causing dependency array thrashing on re-renders if passed dynamically.
  const limitRef = useRef(maxHistory);
  useEffect(() => {
    limitRef.current = maxHistory;
  }, [maxHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setPending([]);
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const handleTraceEvent = (event: Event) => {
      const customEvent = event as ApiTraceCustomEvent;
      const detail = customEvent.detail;
      
      if (!detail || !detail.traceId) return;

      if (detail.status === 'pending') {
        setPending((prev) => {
          // Prevent duplicates by checking if it exists
          if (prev.some((p) => p.traceId === detail.traceId)) return prev;
          return [...prev, detail];
        });
      } else {
        // Must be success, error, or cancelled
        setPending((prev) => prev.filter((p) => p.traceId !== detail.traceId));
        
        setHistory((prev) => {
          // Prepend newest to history, cap at maxHistory
          const next = [detail, ...prev];
          return next.slice(0, limitRef.current);
        });
      }
    };

    window.addEventListener(API_TRACE_EVENT_NAME, handleTraceEvent);
    
    return () => {
      window.removeEventListener(API_TRACE_EVENT_NAME, handleTraceEvent);
    };
  }, [enabled]);

  return {
    pending,
    history,
    clearHistory,
  };
}
