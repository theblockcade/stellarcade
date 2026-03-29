import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApiTrace } from '../../../src/hooks/v1/useApiTrace';
import { API_TRACE_EVENT_NAME, ApiTraceEventPayload } from '../../../src/types/api-trace';

describe('useApiTrace Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const dispatchEvent = (payload: ApiTraceEventPayload) => {
    window.dispatchEvent(
      new CustomEvent(API_TRACE_EVENT_NAME, { detail: payload })
    );
  };

  it('initializes with empty trace state', () => {
    const { result } = renderHook(() => useApiTrace());
    expect(result.current.pending).toEqual([]);
    expect(result.current.history).toEqual([]);
  });

  it('captures pending trace events', () => {
    const { result } = renderHook(() => useApiTrace());
    const event: ApiTraceEventPayload = {
      traceId: 'trace-1',
      source: 'test',
      method: 'GET',
      url: '/test',
      startTime: Date.now(),
      endTime: null,
      durationMs: null,
      status: 'pending',
    };

    act(() => {
      dispatchEvent(event);
    });

    expect(result.current.pending).toHaveLength(1);
    expect(result.current.pending[0]).toEqual(event);
    expect(result.current.history).toHaveLength(0);
  });

  it('moves pending event to history on success', () => {
    const { result } = renderHook(() => useApiTrace());
    
    const startEvent: ApiTraceEventPayload = {
      traceId: 'trace-2',
      source: 'test',
      method: 'POST',
      url: '/post',
      startTime: 1000,
      endTime: null,
      durationMs: null,
      status: 'pending',
    };

    act(() => dispatchEvent(startEvent));
    expect(result.current.pending).toHaveLength(1);

    const completeEvent: ApiTraceEventPayload = {
      ...startEvent,
      endTime: 1500,
      durationMs: 500,
      status: 'success',
      statusCode: 200,
    };

    act(() => dispatchEvent(completeEvent));
    
    // Trace moves from pending to history
    expect(result.current.pending).toHaveLength(0);
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]).toEqual(completeEvent);
  });

  it('captures error traces and metadata', () => {
    const { result } = renderHook(() => useApiTrace());
    
    const errorEvent: ApiTraceEventPayload = {
      traceId: 'trace-err',
      source: 'ApiClient',
      method: 'GET',
      url: '/fail',
      startTime: 1000,
      endTime: 1200,
      durationMs: 200,
      status: 'error',
      statusCode: 500,
      errorData: new Error('Server Crash'),
    };

    act(() => dispatchEvent(errorEvent));
    
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].status).toBe('error');
    expect(result.current.history[0].errorData).toBeInstanceOf(Error);
  });

  it('respects the maxHistory option', () => {
    const { result } = renderHook(() => useApiTrace({ maxHistory: 2 }));
    
    for (let i = 0; i < 5; i++) {
        act(() => dispatchEvent({
            traceId: `t-${i}`,
            source: 'test',
            method: 'GET',
            url: `/t${i}`,
            startTime: Date.now(),
            endTime: Date.now(),
            durationMs: 0,
            status: 'success',
        }));
    }

    // Only retains the most recent 2, newer traces are pre-pended, so t-4 and t-3 are kept
    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].traceId).toBe('t-4');
    expect(result.current.history[1].traceId).toBe('t-3');
  });

  it('ignores events when disabled', () => {
    const { result } = renderHook(() => useApiTrace({ enabled: false }));

    act(() => {
        dispatchEvent({
            traceId: 'test-disabled',
            source: 'test',
            method: 'GET',
            url: '/ignored',
            startTime: 0,
            endTime: 0,
            durationMs: 0,
            status: 'success'
        });
    });

    expect(result.current.history).toHaveLength(0);
    expect(result.current.pending).toHaveLength(0);
  });
});
