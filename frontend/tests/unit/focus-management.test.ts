import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    findFirstFocusable,
    findLastFocusable,
    isFocusable,
    getAllFocusable,
    safeFocus,
    restoreFocus,
} from '../../src/utils/v1/focus-management';

describe('Focus Management Utilities', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('findFirstFocusable', () => {
        it('should find the first focusable element', () => {
            container.innerHTML = `
        <div>
          <span>Not focusable</span>
          <button>First</button>
          <button>Second</button>
        </div>
      `;

            const first = findFirstFocusable(container);
            expect(first?.textContent).toBe('First');
        });

        it('should return null if no focusable elements', () => {
            container.innerHTML = '<div><span>Not focusable</span></div>';

            const first = findFirstFocusable(container);
            expect(first).toBeNull();
        });

        it('should skip disabled elements', () => {
            container.innerHTML = `
        <div>
          <button disabled>Disabled</button>
          <button>Enabled</button>
        </div>
      `;

            const first = findFirstFocusable(container);
            expect(first?.textContent).toBe('Enabled');
        });
    });

    describe('findLastFocusable', () => {
        it('should find the last focusable element', () => {
            container.innerHTML = `
        <div>
          <button>First</button>
          <button>Second</button>
          <span>Not focusable</span>
        </div>
      `;

            const last = findLastFocusable(container);
            expect(last?.textContent).toBe('Second');
        });

        it('should return null if no focusable elements', () => {
            container.innerHTML = '<div><span>Not focusable</span></div>';

            const last = findLastFocusable(container);
            expect(last).toBeNull();
        });
    });

    describe('isFocusable', () => {
        it('should identify focusable elements', () => {
            const button = document.createElement('button');
            expect(isFocusable(button)).toBe(true);

            const input = document.createElement('input');
            expect(isFocusable(input)).toBe(true);

            const link = document.createElement('a');
            link.href = '#';
            expect(isFocusable(link)).toBe(true);
        });

        it('should identify non-focusable elements', () => {
            const span = document.createElement('span');
            expect(isFocusable(span)).toBe(false);

            const disabledButton = document.createElement('button');
            disabledButton.disabled = true;
            expect(isFocusable(disabledButton)).toBe(false);
        });
    });

    describe('getAllFocusable', () => {
        it('should return all focusable elements', () => {
            container.innerHTML = `
        <div>
          <button>Button 1</button>
          <input type="text" />
          <button>Button 2</button>
          <span>Not focusable</span>
        </div>
      `;

            const focusables = getAllFocusable(container);
            expect(focusables).toHaveLength(3);
        });

        it('should exclude disabled elements', () => {
            container.innerHTML = `
        <div>
          <button>Enabled</button>
          <button disabled>Disabled</button>
        </div>
      `;

            const focusables = getAllFocusable(container);
            expect(focusables).toHaveLength(1);
        });
    });

    describe('safeFocus', () => {
        it('should focus a focusable element', () => {
            const button = document.createElement('button');
            container.appendChild(button);

            safeFocus(button);
            expect(document.activeElement).toBe(button);
        });

        it('should use fallback if element is not focusable', () => {
            const span = document.createElement('span');
            const button = document.createElement('button');
            container.appendChild(span);
            container.appendChild(button);

            safeFocus(span, button);
            expect(document.activeElement).toBe(button);
        });

        it('should return false if focus fails', () => {
            const result = safeFocus(null);
            expect(result).toBe(false);
        });
    });

    describe('restoreFocus', () => {
        it('should restore focus to a previously focused element', () => {
            const button = document.createElement('button');
            container.appendChild(button);

            button.focus();
            expect(document.activeElement).toBe(button);

            // Focus something else
            const input = document.createElement('input');
            container.appendChild(input);
            input.focus();

            // Restore
            restoreFocus(button);
            expect(document.activeElement).toBe(button);
        });

        it('should return false if element is not in DOM', () => {
            const button = document.createElement('button');
            const result = restoreFocus(button);
            expect(result).toBe(false);
        });
    });
});
