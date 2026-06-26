import { useCallback, useState } from "react";
import type { Toast, ToastType } from "./ToastQueue";

let _counter = 0;
function nextId(): string {
  _counter += 1;
  return `toast-${_counter}-${Date.now()}`;
}

export interface UseToastQueueReturn {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => string;
  dismissToast: (id: string) => void;
}

/**
 * Manages a queue of toast notifications.
 *
 * - `addToast(message, type, duration?)` — enqueues a new toast and returns
 *   its generated id. The ToastQueue component handles auto-dismiss via a
 *   per-item timer; call `dismissToast` from the `onDismiss` prop.
 * - `dismissToast(id)` — removes the toast with the given id immediately.
 */
export function useToastQueue(): UseToastQueueReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType, duration?: number): string => {
      const id = nextId();
      const toast: Toast = { id, message, type, duration };
      setToasts((prev) => [...prev, toast]);
      return id;
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
