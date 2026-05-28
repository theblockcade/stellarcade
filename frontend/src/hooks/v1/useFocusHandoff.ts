/**
 * useFocusHandoff — Hook for managing focus in nested popovers and menus.
 *
 * Provides resilient focus management with proper restoration and trap handling.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
    FocusHandoffManager,
    type FocusHandoffOptions,
} from '../../utils/v1/focus-management';

export interface UseFocusHandoffOptions {
    /** Whether to enable focus management (default: true) */
    enabled?: boolean;
    /** Whether to trap focus within the container (default: true) */
    trapFocus?: boolean;
    /** Callback when focus should be restored */
    onRestoreFocus?: () => void;
}

export interface UseFocusHandoffReturn {
    /** Ref to attach to the container element */
    containerRef: React.RefObject<HTMLElement>;
    /** Restore focus to trigger or previous focus */
    restoreFocus: () => void;
    /** Move focus to next focusable element */
    focusNext: () => void;
    /** Move focus to previous focusable element */
    focusPrevious: () => void;
}

export function useFocusHandoff(
    triggerRef: React.RefObject<HTMLElement>,
    options?: UseFocusHandoffOptions,
): UseFocusHandoffReturn {
    const containerRef = useRef<HTMLElement>(null);
    const managerRef = useRef<FocusHandoffManager | null>(null);

    const { enabled = true, trapFocus = true, onRestoreFocus } = options || {};

    // Initialize focus handoff manager
    useEffect(() => {
        if (!enabled || !containerRef.current) {
            return;
        }

        const handoffOptions: FocusHandoffOptions = {
            container: containerRef.current,
            trigger: triggerRef.current || undefined,
            trapFocus,
            onRestoreFocus,
        };

        managerRef.current = new FocusHandoffManager(handoffOptions);

        return () => {
            managerRef.current?.restore();
            managerRef.current = null;
        };
    }, [enabled, trapFocus, onRestoreFocus]);

    const restoreFocus = useCallback(() => {
        managerRef.current?.restore();
    }, []);

    const focusNext = useCallback(() => {
        managerRef.current?.focusNext();
    }, []);

    const focusPrevious = useCallback(() => {
        managerRef.current?.focusPrevious();
    }, []);

    return {
        containerRef,
        restoreFocus,
        focusNext,
        focusPrevious,
    };
}

export default useFocusHandoff;
