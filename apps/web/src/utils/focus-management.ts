/**
 * Focus Management Utilities — Resilient focus handoff for nested popovers and menus.
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

export function isFocusable(element: HTMLElement): boolean {
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('tabindex') === '-1') return false;

    const tagName = element.tagName.toLowerCase();
    if (['button', 'input', 'select', 'textarea'].includes(tagName)) return true;
    if (element.hasAttribute('href')) return true;
    if (element.hasAttribute('tabindex')) return true;

    return false;
}

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

        const focusable = findFirstFocusable(element);
        if (focusable) {
            focusable.focus();
            return true;
        }

        if (fallback) {
            return safeFocus(fallback);
        }

        return false;
    } catch (e) {
        console.warn('Failed to focus element:', e);
        return false;
    }
}

export function restoreFocus(previousFocus: HTMLElement | null): boolean {
    if (!previousFocus) return false;

    if (!document.contains(previousFocus)) {
        return false;
    }

    return safeFocus(previousFocus);
}

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
            if (document.activeElement === firstFocusable) {
                event.preventDefault();
                lastFocusable.focus();
            }
        } else {
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

export interface FocusHandoffOptions {
    container: HTMLElement;
    trigger?: HTMLElement;
    trapFocus?: boolean;
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

        this.previousFocus =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;

        if (options.trapFocus) {
            this.focusTrapCleanup = createFocusTrap(this.container);
        }

        this.focusContainer();
    }

    private focusContainer(): void {
        const firstFocusable = findFirstFocusable(this.container);
        if (firstFocusable) {
            queueMicrotask(() => {
                safeFocus(firstFocusable);
            });
        }
    }

    restore(): void {
        if (this.focusTrapCleanup) {
            this.focusTrapCleanup();
            this.focusTrapCleanup = null;
        }

        if (this.trigger && restoreFocus(this.trigger)) {
            this.onRestoreFocus?.();
            return;
        }

        if (restoreFocus(this.previousFocus)) {
            this.onRestoreFocus?.();
            return;
        }

        document.body.focus();
        this.onRestoreFocus?.();
    }

    focusNext(): void {
        const focusables = getAllFocusable(this.container);
        const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);

        if (currentIndex < focusables.length - 1) {
            safeFocus(focusables[currentIndex + 1]);
        } else if (focusables.length > 0) {
            safeFocus(focusables[0]);
        }
    }

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
