import React, { useEffect, useRef } from 'react';
import './SettingsPanel.css';

export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
  testId?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  title = 'Settings',
  children,
  width = 'default',
  className = '',
  testId = 'settings-panel',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Handle Escape key and focus trap return
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      closeBtnRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      previouslyFocusedElement.current?.focus();
    }
  }, [isOpen, onClose]);

  // Focus trap implementation
  const handleTabTrap = (e: React.KeyboardEvent) => {
    if (!panelRef.current) return;
    
    const focusableElements = panelRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="settings-panel-backdrop"
      onClick={onClose}
      role="presentation"
      data-testid={`${testId}-backdrop`}
    >
      <div
        ref={panelRef}
        className={`settings-panel settings-panel--${width} ${className}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking panel
        onKeyDown={handleTabTrap}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-panel-title"
        data-testid={testId}
      >
        <header className="settings-panel__header">
          <h2 id="settings-panel-title" className="settings-panel__title">
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="settings-panel__close-btn"
            onClick={onClose}
            aria-label="Close settings panel"
            data-testid={`${testId}-close-btn`}
          >
            ✕
          </button>
        </header>
        <div className="settings-panel__body">
          {children}
        </div>
      </div>
    </div>
  );
};

SettingsPanel.displayName = 'SettingsPanel';
export default SettingsPanel;
