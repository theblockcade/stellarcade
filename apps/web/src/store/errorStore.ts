/**
 * Global error store — Zustand slice for application-wide error state.
 *
 * Consumers read `current` to display the most recent error, and `history`
 * for an audit trail (e.g. a debug panel). The store is framework-agnostic:
 * it can be read synchronously via `useErrorStore.getState()` in non-React
 * contexts (services, tests) and reactively via the hook in components.
 */

import { create } from 'zustand';
import type { AppError } from '../types/errors';

/** Maximum number of errors retained in history before the oldest is dropped. */
const MAX_HISTORY = 50;
const MAX_TOAST_HISTORY = 20;
const MAX_ACTIVE_TOASTS = 3;
const MAX_DEFERRED_TOASTS = 12;
const DEFAULT_TOAST_DURATION_MS = 5000;

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastNotification {
  id: string;
  tone: ToastTone;
  title: string;
  message: string;
  createdAt: number;
  durationMs: number;
  source?: string;
  dismissedAt?: number;
}

export interface ToastInput {
  tone: ToastTone;
  title?: string;
  message: string;
  durationMs?: number;
  source?: string;
}

const dismissalTimers = new Map<string, ReturnType<typeof setTimeout>>();
let toastCounter = 0;

interface ErrorState {
  /** The most recently recorded error, or null if none is active. */
  current: AppError | null;
  /** Chronological list of all recorded errors (newest first), capped at MAX_HISTORY. */
  history: AppError[];
  /** Active toast notifications in display order. */
  toasts: ToastNotification[];
  /** Deferred notifications waiting for an open slot in the active stack. */
  deferredToasts: ToastNotification[];
  /** Recently dismissed notifications, newest first, capped at MAX_TOAST_HISTORY. */
  toastHistory: ToastNotification[];
  /** Record an error as current and prepend it to history. */
  setError: (error: AppError) => void;
  /** Clear the current error without affecting history. */
  clearError: () => void;
  /** Wipe the full history. */
  clearHistory: () => void;
  /** Enqueue a transient toast notification and return its generated ID. */
  enqueueToast: (toast: ToastInput) => string;
  /** Dismiss an active toast and archive it in bounded history. */
  dismissToast: (id: string) => void;
  /** Clears all active toasts and any pending dismiss timers. */
  clearToasts: () => void;
  /** Clears deferred notifications without promoting them. */
  clearDeferredToasts: () => void;
  /** Clears dismissed toast history. */
  clearToastHistory: () => void;
}

export const useErrorStore = create<ErrorState>()((set) => ({
  current: null,
  history: [],
  toasts: [],
  deferredToasts: [],
  toastHistory: [],

  setError: (error) =>
    set((state) => {
      const toast = createToast({
        tone: 'error',
        title: 'Something went wrong',
        message: error.message,
        source: error.domain,
        durationMs: DEFAULT_TOAST_DURATION_MS,
      });
      const nextToastState = appendToast(state, toast);

      return {
        current: error,
        // Prepend newest; cap at MAX_HISTORY to bound memory usage.
        history: [error, ...state.history].slice(0, MAX_HISTORY),
        ...nextToastState,
      };
    }),

  clearError: () => set({ current: null }),

  clearHistory: () => set({ history: [] }),

  enqueueToast: (toastInput) => {
    const toast = createToast(toastInput);
    set((state) => appendToast(state, toast));
    return toast.id;
  },

  dismissToast: (id) =>
    set((state) => {
      const toast = state.toasts.find((entry) => entry.id === id);
      const deferredToast = state.deferredToasts.find((entry) => entry.id === id);
      if (!toast && !deferredToast) {
        clearDismissalTimer(id);
        return state;
      }

      clearDismissalTimer(id);
      const remainingActive = toast
        ? state.toasts.filter((entry) => entry.id !== id)
        : state.toasts;
      const remainingDeferred = deferredToast
        ? state.deferredToasts.filter((entry) => entry.id !== id)
        : state.deferredToasts;
      const promoted = !deferredToast ? remainingDeferred[0] : undefined;

      if (promoted) {
        scheduleToastDismissal(promoted.id, promoted.durationMs);
      }

      return {
        toasts: promoted ? [...remainingActive, promoted] : remainingActive,
        deferredToasts: promoted ? remainingDeferred.slice(1) : remainingDeferred,
        toastHistory: [
          { ...(toast ?? deferredToast)!, dismissedAt: Date.now() },
          ...state.toastHistory,
        ].slice(0, MAX_TOAST_HISTORY),
      };
    }),

  clearToasts: () =>
    set((state) => {
      state.toasts.forEach((toast) => clearDismissalTimer(toast.id));
      return { toasts: [], deferredToasts: [] };
    }),

  clearDeferredToasts: () => set({ deferredToasts: [] }),

  clearToastHistory: () => set({ toastHistory: [] }),
}));

function appendToast(
  state: Pick<ErrorState, "toasts" | "deferredToasts">,
  toast: ToastNotification,
) {
  if (state.toasts.length < MAX_ACTIVE_TOASTS) {
    scheduleToastDismissal(toast.id, toast.durationMs);
    return {
      toasts: [...state.toasts, toast],
      deferredToasts: state.deferredToasts,
    };
  }

  return {
    toasts: state.toasts,
    deferredToasts: [...state.deferredToasts, toast].slice(-MAX_DEFERRED_TOASTS),
  };
}

function createToast(toast: ToastInput): ToastNotification {
  toastCounter += 1;
  return {
    id: `toast-${toastCounter}`,
    tone: toast.tone,
    title: toast.title ?? defaultTitleForTone(toast.tone),
    message: toast.message,
    createdAt: Date.now(),
    durationMs: toast.durationMs ?? DEFAULT_TOAST_DURATION_MS,
    source: toast.source,
  };
}

function defaultTitleForTone(tone: ToastTone): string {
  switch (tone) {
    case 'success':
      return 'Success';
    case 'warning':
      return 'Warning';
    case 'error':
      return 'Error';
    default:
      return 'Notice';
  }
}

function scheduleToastDismissal(id: string, durationMs: number): void {
  clearDismissalTimer(id);
  dismissalTimers.set(
    id,
    setTimeout(() => {
      useErrorStore.getState().dismissToast(id);
    }, durationMs),
  );
}

function clearDismissalTimer(id: string): void {
  const existing = dismissalTimers.get(id);
  if (existing) {
    clearTimeout(existing);
    dismissalTimers.delete(id);
  }
}
