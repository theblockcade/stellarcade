/**
 * useFocusRecovery — predictable focus recovery for dynamic error regions.
 *
 * When an error region mounts or updates, focus is moved to the region
 * container so screen readers announce the error immediately. When the
 * error clears the focus is returned to the element that had it before.
 *
 * Usage:
 *   const { regionRef } = useFocusRecovery(hasError);
 *   <div ref={regionRef} tabIndex={-1}>{hasError && <ErrorNotice ... />}</div>
 */

import { useEffect, useRef } from 'react';

export interface UseFocusRecoveryOptions {
  /** Move focus into the error region when it becomes active. @default true */
  focusOnError?: boolean;
  /** Restore focus to the previously focused element when error clears. @default true */
  restoreOnClear?: boolean;
}

export interface UseFocusRecoveryReturn {
  /** Attach to the error region container. */
  regionRef: React.RefObject<HTMLElement | null>;
}

export function useFocusRecovery(
  hasError: boolean,
  options: UseFocusRecoveryOptions = {},
): UseFocusRecoveryReturn {
  const { focusOnError = true, restoreOnClear = true } = options;
  const regionRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (hasError) {
      // Capture where focus was before the error appeared.
      if (document.activeElement instanceof HTMLElement) {
        previousFocusRef.current = document.activeElement;
      }
      if (focusOnError && regionRef.current) {
        regionRef.current.focus();
      }
    } else {
      // Error cleared — restore focus.
      if (restoreOnClear && previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [hasError, focusOnError, restoreOnClear]);

  return { regionRef };
}
