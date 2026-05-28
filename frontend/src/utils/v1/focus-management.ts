/**
 * Focus Management Utilities — Resilient focus handoff for nested popovers and menus.
 *
 * Provides utilities for managing focus in complex nested UI patterns with
 * proper restoration and trap handling.
 */

/**
 * Find the first focusable element within a container.
 */
export function findFirstFocusable(container: HTMLElement | null): HTMLElement | null {
    if (!container) return null;

    const focusableSelectors = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return container.querySelector<HTMLElement>(focusableSelectors);
}

/**
 * Find the last focusable element within a container.
 */
export function findLastFocusable(container: HTMLElement | null): HTMLElement | null {
    if (!container) return null;

    const focusableSelectors = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusables = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
    return focusables.length > 0 ? focusables[focusables.length - 1] : null;
}

/**
 * Check if an element is focusable.
 */
export function isFocusable(element: HTMLElement): boolean {
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('tabindex') === '-1') return false;

    const tagName = element.tagName.toLowerCase();
    if (['button', 'input', 'select', 'textarea'].includes(tagName)) return true;
    if (element.hasAttribute('href')) return true;
    if (element.hasAttribute('tabindex')) return true;

    return false;
}

/**
 * Get all focusable elements within a container.
 */
export function getAllFocusable(container: HTMLElement | null): HTMLElement[] {
    if (!container) return [];

    const focusableSelectors = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
}

/**
 * Focus an element safely, with optional fallback.
 */
export function safeFocus(
    element: HTMLElement | null,
    fallback?: HTMLElement | null,
): boolean {
    if (!element) {
        if (fallback) {
            return safeFocus(fallback);
        }
        return false;
    }

    try {
        if (isFocusable(element)) {
            element.focus();
            return true;
        }

        // Try to find a focusable child
        const focusable = findFirstFocusable(element);
        if (focusable) {
            focusable.focus();
            return true;
        }

        // Use fallback if provided
        if (fallback) {
            return safeFocus(fallback);
        }

        return false;
    } catch (e) {
        console.warn('Failed to focus element:', e);
        return false;
    }
}

/**
 * Restore focus to a previously focused element.
 */
export function restoreFocus(previousFocus: HTMLElement | null): boolean {
    if (!previousFocus) return false;

    // Check if element is still in the DOM
    if (!document.contains(previousFocus)) {
        return false;
    }

    return safeFocus(previousFocus);
}

/**
 * Create a focus trap for a container (prevent focus from leaving).
 */
export function createFocusTrap(container: HTMLElement): () => void {
    const focusables = getAllFocusable(container);
    if (focusables.length === 0) {
        return () => { };
    }

    const firstFocusable = focusables[0];
    const lastFocusable = focusables[focusables.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                event.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                event.preventDefault();
                firstFocusable.focus();
            }
        }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
}

/**
 * Manage focus for nested popovers/menus with proper restoration.
 */
export interface FocusHandoffOptions {
    /** Container element for the popover/menu */
    container: HTMLElement;
    /** Element that triggered the popover (for focus restoration) */
    trigger?: HTMLElement;
    /** Whether to trap focus within the container */
    trapFocus?: boolean;
    /** Callback when focus should be restored */
    onRestoreFocus?: () => void;
}

export class FocusHandoffManager {
    private previousFocus: HTMLElement | null = null;
    private focusTrapCleanup: (() => void) | null = null;
    private container: HTMLElement;
    private trigger: HTMLElement | null;
    private onRestoreFocus: (() => void) | null;

    constructor(options: FocusHandoffOptions) {
        this.container = options.container;
        this.trigger = options.trigger || null;
        this.onRestoreFocus = options.onRestoreFocus || null;

        // Store current focus
        this.previousFocus =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;

        // Set up focus trap if requested
        if (options.trapFocus) {
            this.focusTrapCleanup = createFocusTrap(this.container);
        }

        // Focus first element in container
        this.focusContainer();
    }

    private focusContainer(): void {
        const firstFocusable = findFirstFocusable(this.container);
        if (firstFocusable) {
            // Use microtask to ensure DOM is ready
            queueMicrotask(() => {
                safeFocus(firstFocusable);
            });
        }
    }

    /**
     * Restore focus to the trigger or previous focus.
     */
    restore(): void {
        // Clean up focus trap
        if (this.focusTrapCleanup) {
            this.focusTrapCleanup();
            this.focusTrapCleanup = null;
        }

        // Try to restore focus to trigger first
        if (this.trigger && restoreFocus(this.trigger)) {
            this.onRestoreFocus?.();
            return;
        }

        // Fall back to previous focus
        if (restoreFocus(this.previousFocus)) {
            this.onRestoreFocus?.();
            return;
        }

        // Last resort: focus body
        document.body.focus();
        this.onRestoreFocus?.();
    }

    /**
     * Move focus to the next focusable element.
     */
    focusNext(): void {
        const focusables = getAllFocusable(this.container);
        const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);

        if (currentIndex < focusables.length - 1) {
            safeFocus(focusables[currentIndex + 1]);
        } else if (focusables.length > 0) {
            safeFocus(focusables[0]);
        }
    }

    /**
     * Move focus to the previous focusable element.
     */
    focusPrevious(): void {
        const focusables = getAllFocusable(this.container);
        const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);

        if (currentIndex > 0) {
            safeFocus(focusables[currentIndex - 1]);
        } else if (focusables.length > 0) {
            safeFocus(focusables[focusables.length - 1]);
        }
    }
}

export default FocusHandoffManager;
