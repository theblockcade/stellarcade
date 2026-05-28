import {
  useRef,
  useState,
  useId,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";

export interface ValidationMessage {
  type: "error" | "warning" | "info";
  text: string;
}

export interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  validation?: ValidationMessage | null;
  /** Called when the open/closed state changes */
  onToggle?: (isOpen: boolean) => void;
  /** Disable the toggle (section stays open) */
  disabled?: boolean;
  className?: string;
}

const ICON_COLOR: Record<ValidationMessage["type"], string> = {
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

const ICON_LABEL: Record<ValidationMessage["type"], string> = {
  error: "Error",
  warning: "Warning",
  info: "Info",
};

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  validation = null,
  onToggle,
  disabled = false,
  className = "",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [validationVisible, setValidationVisible] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const validationRef = useRef<HTMLDivElement>(null);

  const panelId = useId();
  const validationId = useId();

  // Reveal validation inline when section is collapsed and has a message.
  // We surface it on focus of the trigger so keyboard users see it without opening.
  const handleTriggerFocus = useCallback(() => {
    if (!isOpen && validation) {
      setValidationVisible(true);
    }
  }, [isOpen, validation]);

  const handleTriggerBlur = useCallback(
    (e: React.FocusEvent<HTMLButtonElement>) => {
      // Hide only when focus truly leaves the component subtree
      const next = e.relatedTarget as Node | null;
      const root = triggerRef.current?.closest("[data-collapsible-root]");
      if (!root || !next || !root.contains(next)) {
        setValidationVisible(false);
      }
    },
    [],
  );

  const toggle = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      onToggle?.(next);
      // Hide inline validation once user opens the section
      if (next) setValidationVisible(false);
      return next;
    });
  }, [disabled, onToggle]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    },
    [toggle],
  );

  const showInlineValidation = !isOpen && validation && validationVisible;

  return (
    <div
      data-collapsible-root
      className={`collapsible-section ${className}`}
      style={styles.root}
    >
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-describedby={showInlineValidation ? validationId : undefined}
        disabled={disabled}
        onClick={toggle}
        onFocus={handleTriggerFocus}
        onBlur={handleTriggerBlur}
        onKeyDown={handleKeyDown}
        style={{
          ...styles.trigger,
          ...(disabled ? styles.triggerDisabled : {}),
        }}
      >
        <span style={styles.triggerLabel}>{title}</span>

        {/* Validation badge — visible even when collapsed */}
        {validation && !isOpen && (
          <span
            aria-hidden="true"
            style={{
              ...styles.badge,
              backgroundColor: ICON_COLOR[validation.type] + "22",
              color: ICON_COLOR[validation.type],
              borderColor: ICON_COLOR[validation.type] + "55",
            }}
          >
            {ICON_LABEL[validation.type]}
          </span>
        )}

        {/* Chevron */}
        <svg
          aria-hidden="true"
          focusable="false"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          style={{
            ...styles.chevron,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>

      {/* Inline validation — revealed on focus when collapsed */}
      <div
        id={validationId}
        ref={validationRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          ...styles.inlineValidation,
          ...(showInlineValidation ? styles.inlineValidationVisible : {}),
          borderLeftColor: validation
            ? ICON_COLOR[validation.type]
            : "transparent",
        }}
        tabIndex={-1}
      >
        {showInlineValidation && validation && (
          <span style={{ color: ICON_COLOR[validation.type] }}>
            {validation.text}
          </span>
        )}
      </div>

      {/* Collapsible panel */}
      <div
        id={panelId}
        ref={contentRef}
        role="region"
        aria-label={title}
        hidden={!isOpen}
        style={isOpen ? styles.panel : undefined}
      >
        {isOpen && <div style={styles.panelInner}>{children}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles (inline — avoids CSS class collisions in mixed codebases)
// ---------------------------------------------------------------------------
const styles = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
    borderRadius: "0.5rem",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  trigger: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.75rem 1rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left" as const,
    fontSize: "0.9375rem",
    fontWeight: 500,
    color: "#1e293b",
    transition: "background-color 0.15s",
    outline: "none",
  },
  triggerDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  triggerLabel: {
    flex: 1,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.125rem 0.5rem",
    borderRadius: "9999px",
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    border: "1px solid",
  },
  chevron: {
    flexShrink: 0,
    color: "#64748b",
    transition: "transform 0.2s ease",
  },
  inlineValidation: {
    maxHeight: 0,
    overflow: "hidden",
    padding: "0 1rem",
    fontSize: "0.8125rem",
    lineHeight: 1.5,
    borderLeft: "3px solid transparent",
    backgroundColor: "#f8fafc",
    transition: "max-height 0.2s ease, padding 0.2s ease",
  },
  inlineValidationVisible: {
    maxHeight: "6rem",
    padding: "0.5rem 1rem",
  },
  panel: {
    borderTop: "1px solid #e2e8f0",
  },
  panelInner: {
    padding: "1rem",
  },
} as const;
