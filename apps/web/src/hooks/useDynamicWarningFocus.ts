import { useEffect, useRef } from "react";

export interface UseDynamicWarningFocusOptions {
  restoreOnUnmount?: boolean;
  onFocusMoved?: (target: HTMLElement) => void;
}

export function useDynamicWarningFocus<T extends HTMLElement>(
  active: boolean,
  options: UseDynamicWarningFocusOptions = {}
): React.RefObject<T | null> {
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

    previousFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    const hadExplicitTabIndex = node.hasAttribute("tabindex");
    if (!hadExplicitTabIndex) {
      node.setAttribute("tabindex", "-1");
    }

    try {
      node.focus({ preventScroll: true });
    } catch {
      node.focus();
    }
    onFocusMoved?.(node);

    return () => {
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
  }, [active, onFocusMoved, restoreOnUnmount]);

  return ref;
}

export default useDynamicWarningFocus;
