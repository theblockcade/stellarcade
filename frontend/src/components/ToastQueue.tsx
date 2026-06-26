import React, { useEffect, useRef } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

export interface ToastQueueProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const MAX_VISIBLE = 5;
const DEFAULT_DURATION = 4000;

const TYPE_ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const TYPE_COLORS: Record<
  ToastType,
  { fg: string; bg: string; border: string; iconBg: string }
> = {
  success: {
    fg: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.3)",
    iconBg: "rgba(34,197,94,0.15)",
  },
  error: {
    fg: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
    iconBg: "rgba(239,68,68,0.15)",
  },
  info: {
    fg: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.3)",
    iconBg: "rgba(59,130,246,0.15)",
  },
  warning: {
    fg: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.3)",
    iconBg: "rgba(245,158,11,0.15)",
  },
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const colors = TYPE_COLORS[toast.type];
  const duration = toast.duration ?? DEFAULT_DURATION;
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => {
      dismissRef.current(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration]);

  return (
    <div
      role={toast.type === "error" || toast.type === "warning" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      data-testid={`toast-item-${toast.id}`}
      data-type={toast.type}
      style={{
        ...styles.toastItem,
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <span
        aria-hidden="true"
        data-testid={`toast-icon-${toast.id}`}
        style={{
          ...styles.icon,
          color: colors.fg,
          backgroundColor: colors.iconBg,
        }}
      >
        {TYPE_ICONS[toast.type]}
      </span>
      <span style={styles.message} data-testid={`toast-message-${toast.id}`}>
        {toast.message}
      </span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={`Dismiss notification: ${toast.message}`}
        data-testid={`toast-dismiss-${toast.id}`}
        style={styles.closeButton}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}

/**
 * Renders a fixed-position stack of toast notifications in the bottom-right
 * corner. At most MAX_VISIBLE (5) toasts are shown; additional toasts are
 * queued and displayed as older ones are dismissed.
 *
 * Auto-dismiss is handled per-item via the `duration` field (default 4 s).
 */
export function ToastQueue({ toasts, onDismiss }: ToastQueueProps) {
  if (toasts.length === 0) {
    return null;
  }

  const visible = toasts.slice(-MAX_VISIBLE);

  return (
    <div
      data-testid="toast-queue"
      aria-label="Notifications"
      style={styles.container}
    >
      {visible.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: "fixed" as const,
    bottom: "1.5rem",
    right: "1.5rem",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    width: "22rem",
    maxWidth: "calc(100vw - 3rem)",
    pointerEvents: "auto" as const,
  },
  toastItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.625rem",
    padding: "0.75rem 0.875rem",
    borderRadius: "0.5rem",
    border: "1px solid transparent",
    backgroundColor: "var(--surface-1, #11161e)",
    boxShadow:
      "0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)",
    color: "var(--text-primary, #f5f7fb)",
    fontSize: "0.875rem",
    lineHeight: 1.45,
  },
  icon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "1.375rem",
    height: "1.375rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  message: {
    flex: 1,
    minWidth: 0,
    paddingTop: "0.125rem",
  },
  closeButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "1.375rem",
    height: "1.375rem",
    border: "none",
    borderRadius: "0.25rem",
    background: "transparent",
    color: "var(--text-muted, rgba(245,247,251,0.5))",
    fontSize: "1.125rem",
    lineHeight: 1,
    cursor: "pointer",
    padding: 0,
    transition: "background 0.15s ease",
  },
} as const;
