"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const INTERACTIVE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  active: boolean
): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const interactives = Array.from(
        container.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el.tagName === "BODY");

      if (interactives.length === 0) {
        event.preventDefault();
        return;
      }

      const first = interactives[0];
      const last = interactives[interactives.length - 1];
      const focused = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (focused === first || !container.contains(focused)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (focused === last || !container.contains(focused)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const container = containerRef.current;
    container?.addEventListener("keydown", handleKeyDown);
    return () => container?.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, active]);
}

interface ModalStackEntry {
  id: string;
  onRequestClose?: () => void;
  returnFocusTarget: HTMLElement | null;
}

interface ModalStackContextValue {
  registerModal: (entry: Omit<ModalStackEntry, "returnFocusTarget">) => () => void;
  isTopModal: (id: string) => boolean;
  getStackIndex: (id: string) => number;
}

const ModalStackContext = createContext<ModalStackContextValue | null>(null);

export const ModalStackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [stack, setStack] = useState<ModalStackEntry[]>([]);

  const registerModal = useCallback(
    (entry: Omit<ModalStackEntry, "returnFocusTarget">) => {
      const returnFocusTarget =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      setStack((current) => {
        const withoutExisting = current.filter((item) => item.id !== entry.id);
        return [...withoutExisting, { ...entry, returnFocusTarget }];
      });

      return () => {
        setStack((current) => {
          const target = current.find((item) => item.id === entry.id) ?? null;
          const next = current.filter((item) => item.id !== entry.id);
          target?.returnFocusTarget?.focus?.();
          return next;
        });
      };
    },
    []
  );

  const value = useMemo<ModalStackContextValue>(
    () => ({
      registerModal,
      isTopModal: (id: string) => stack[stack.length - 1]?.id === id,
      getStackIndex: (id: string) => stack.findIndex((entry) => entry.id === id),
    }),
    [registerModal, stack]
  );

  return (
    <ModalStackContext.Provider value={value}>
      {children}
    </ModalStackContext.Provider>
  );
};

export function useModalStackRegistration({
  active,
  modalId,
  onRequestClose,
}: {
  active: boolean;
  modalId: string;
  onRequestClose?: () => void;
}) {
  const context = useContext(ModalStackContext);
  const registerModal = context?.registerModal;
  const unregisterRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!registerModal || !active) {
      unregisterRef.current?.();
      unregisterRef.current = null;
      return;
    }

    unregisterRef.current?.();
    unregisterRef.current = registerModal({
      id: modalId,
      onRequestClose,
    });

    return () => {
      unregisterRef.current?.();
      unregisterRef.current = null;
    };
  }, [active, modalId, onRequestClose, registerModal]);

  if (!context) {
    return {
      isTopModal: active,
      stackIndex: active ? 0 : -1,
    };
  }

  return {
    isTopModal: active && context.isTopModal(modalId),
    stackIndex: active ? context.getStackIndex(modalId) : -1,
  };
}
