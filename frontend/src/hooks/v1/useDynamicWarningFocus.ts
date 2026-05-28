/**
 * useDynamicWarningFocus — focus handoff for warnings that mount
 * dynamically (#787).
 *
 * The existing `useFocusHandoff` hook is shaped for popovers and menus
 * (focus-trap, restore on close). Warnings are different:
 *   - They appear in response to async state (a request failed, a wallet
 *     dropped, an alert was pushed onto the stack).
 *   - They are not modal — they coexist with the rest of the page.
 *   - The user is most likely keyboard-focused somewhere else when the
 *     warning mounts.
 *
 * The right shape for a warning is "stable focus handoff": when the
 * warning mounts, move focus to the warning container so a screen reader
 * announces it; when the warning unmounts, restore focus to wherever it
 * was before so the user isn't dropped at the document root.
 *
 * Usage:
 *   const ref = useDynamicWarningFocus<HTMLDivElement>(true);
 *   return <div ref={ref} role="alert">…</div>;
 *
 * The hook is opt-in via the `active` flag so warnings that are merely
 * informational can skip the focus move.
 */

import { useEffect, useRef } from "react";

export interface UseDynamicWarningFocusOptions {
  /**
   * If `true`, restore the previously-focused element when the warning
   * unmounts (default `true`). Set to `false` for warnings that survive
   * across navigation and shouldn't yank focus back.
   */
  restoreOnUnmount?: boolean;
  /**
   * Hook for tests / instrumentation. Called after focus is moved to the
   * warning container with the element that received focus.
   */
  onFocusMoved?: (target: HTMLElement) => void;
}

/**
 * Returns a `ref` to attach to the warning container. The container is
 * made programmatically focusable (`tabindex=-1`) so the handoff works
 * even when the warning's contents have no focusable descendant.
 *
 * @param active   Whether focus should move on mount. Pass the same flag
 *                 used to render the warning so a mount that happens
 *                 while the warning is suppressed doesn't steal focus.
 * @param options  See {@link UseDynamicWarningFocusOptions}.
 */
export function useDynamicWarningFocus<T extends HTMLElement>(
  active: boolean,
  options: UseDynamicWarningFocusOptions = {}
): React.RefObject<T> {
  const ref = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { restoreOnUnmount = true, onFocusMoved } = options;

  useEffect(() => {
    if (!active) {
      return;
    }
    const node = ref.current;
    if (!node) {
      return;
    }

    // Save the element that had focus before the warning mounted.
    previousFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    // Ensure the container is focusable even if its children aren't.
    const hadExplicitTabIndex = node.hasAttribute("tabindex");
    if (!hadExplicitTabIndex) {
      node.setAttribute("tabindex", "-1");
    }

    // `preventScroll` keeps the page from jumping just because a small
    // banner appeared somewhere off-screen.
    try {
      node.focus({ preventScroll: true });
    } catch {
      node.focus();
    }
    onFocusMoved?.(node);

    return () => {
      // Restore tabindex first so a re-mount on the same node behaves the
      // same way next time around.
      if (!hadExplicitTabIndex) {
        node.removeAttribute("tabindex");
      }
      if (!restoreOnUnmount) {
        return;
      }
      const previous = previousFocusRef.current;
      if (previous && document.contains(previous)) {
        try {
          previous.focus({ preventScroll: true });
        } catch {
          previous.focus();
        }
      }
    };
    // `active` is the only relevant dependency; the options bag is
    // intentionally read once per mount so callers can pass inline
    // objects without triggering a re-handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return ref;
}

export default useDynamicWarningFocus;
