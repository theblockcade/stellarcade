"use client";

import React from "react";
import { useErrorStore } from "../store/errorStore";
import { SegmentedControl } from "./SegmentedControl";
import { cn } from "../lib/utils";

/**
 * Ported from frontend/src/components/v1/NotificationCenter.tsx; styling has
 * since moved from NotificationCenter.css to Tailwind utilities. The
 * `toast-center*` class names remain as query/test hooks only.
 */

type NotificationView = "active" | "deferred" | "history";

/** Per-tone border accent on an active toast. */
const TONE_BORDER = {
  success: "border-emerald-500/45",
  info: "border-blue-500/45",
  warning: "border-amber-500/45",
  error: "border-red-500/45",
} as const;

const MUTED_TEXT = "m-0 leading-snug text-muted-foreground";
const UTILITY_BTN =
  "toast-center__utility justify-self-start cursor-pointer border-0 bg-transparent p-0 text-left text-foreground hover:text-primary";
const LIST_ITEM =
  "toast-center__list-item flex items-start justify-between gap-3 rounded-[0.9rem] border border-white/14 bg-[rgba(10,14,18,0.92)] px-4 py-3.5 [&_p]:m-0 [&_p]:leading-snug [&_p]:text-muted-foreground [&_button]:cursor-pointer [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-foreground";

export interface NotificationCenterProps {
  /**
   * When true, render the panel even when there are no notifications so users
   * still have a stable entry point and guidance text.
   */
  showWhenEmpty?: boolean;
}

const toneLabelMap = {
  success: "Success",
  info: "Info",
  warning: "Warning",
  error: "Error",
} as const;

export function NotificationCenter({ showWhenEmpty = false }: NotificationCenterProps): React.JSX.Element | null {
  const toasts = useErrorStore((state) => state.toasts);
  const deferredToasts = useErrorStore((state) => state.deferredToasts);
  const toastHistory = useErrorStore((state) => state.toastHistory);
  const dismissToast = useErrorStore((state) => state.dismissToast);
  const clearToasts = useErrorStore((state) => state.clearToasts);
  const clearDeferredToasts = useErrorStore((state) => state.clearDeferredToasts);
  const clearToastHistory = useErrorStore((state) => state.clearToastHistory);
  const [view, setView] = React.useState<NotificationView>("active");

  const hasContent = toasts.length > 0 || deferredToasts.length > 0 || toastHistory.length > 0;

  React.useEffect(() => {
    if (view === "active" && toasts.length > 0) return;
    if (view === "deferred" && deferredToasts.length > 0) return;
    if (view === "history" && toastHistory.length > 0) return;

    if (toasts.length > 0) {
      setView("active");
    } else if (deferredToasts.length > 0) {
      setView("deferred");
    } else if (toastHistory.length > 0) {
      setView("history");
    }
  }, [deferredToasts.length, toastHistory.length, toasts.length, view]);

  if (!hasContent && !showWhenEmpty) {
    return null;
  }

  return (
    <aside
      className="toast-center fixed top-4 right-4 z-1200 w-[min(26rem,calc(100vw-2rem))] max-sm:inset-x-4 max-sm:top-auto max-sm:bottom-4 max-sm:w-auto"
      aria-label="Notifications"
      data-testid="notification-center"
    >
      <div className="toast-center__panel grid gap-3.5 rounded-2xl border border-border bg-[rgba(7,10,14,0.94)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-[18px]">
        <div className="toast-center__toolbar grid gap-3">
          <div>
            <strong className="text-foreground">Notifications</strong>
            <p className={cn("toast-center__subtitle mt-0.5 text-sm", MUTED_TEXT)}>
              Deferred events wait here until the active stack has room.
            </p>
          </div>
          <SegmentedControl
            label="Notification views"
            options={[
              { value: "active", label: "Active", count: toasts.length },
              { value: "deferred", label: "Deferred", count: deferredToasts.length },
              { value: "history", label: "Recent", count: toastHistory.length },
            ]}
            value={view}
            onChange={(nextView) => setView(nextView)}
            className="toast-center__switcher w-fit"
            testId="notification-center-view"
          />
        </div>

        {!hasContent ? (
          <p className={cn("toast-center__empty", MUTED_TEXT)} data-testid="notification-center-empty-panel">
            No notifications yet. New alerts, deferred items, and recent history will appear here.
          </p>
        ) : null}

        {view === "active" && hasContent ? (
          <>
            {toasts.length > 0 ? (
              <div className="toast-center__stack grid gap-3">
                {toasts.map((toast) => (
                  <section
                    key={toast.id}
                    className={cn(
                      "toast-center__toast rounded-[0.9rem] border bg-[rgba(10,14,18,0.92)] px-4 py-3.5",
                      `toast-center__toast--${toast.tone}`,
                      TONE_BORDER[toast.tone],
                    )}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="toast-center__toast-header flex items-start justify-between gap-3">
                      <span className="toast-center__tone text-[0.72rem] tracking-[0.08em] text-primary uppercase">
                        {toneLabelMap[toast.tone]}
                      </span>
                      <button
                        type="button"
                        className="toast-center__dismiss cursor-pointer border-0 bg-transparent text-foreground hover:text-primary"
                        aria-label={`Dismiss ${toast.title}`}
                        onClick={() => dismissToast(toast.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                    <strong className="toast-center__title mt-1.5 mb-1 block text-foreground">
                      {toast.title}
                    </strong>
                    <p className={cn("toast-center__message", MUTED_TEXT)}>{toast.message}</p>
                  </section>
                ))}
              </div>
            ) : (
              <p className={cn("toast-center__empty", MUTED_TEXT)}>
                No active notifications right now.
              </p>
            )}

            {deferredToasts.length > 0 ? (
              <p className={cn("toast-center__meta", MUTED_TEXT)} data-testid="notification-center-queued-summary">
                {deferredToasts.length} deferred event
                {deferredToasts.length === 1 ? "" : "s"} waiting for display.
              </p>
            ) : null}

            {toasts.length > 0 ? (
              <button type="button" className={UTILITY_BTN} onClick={clearToasts}>
                Dismiss active
              </button>
            ) : null}
          </>
        ) : null}

        {view === "deferred" && hasContent ? (
          deferredToasts.length > 0 ? (
            <>
              <ul
                className="toast-center__list grid list-none gap-3 p-0"
                data-testid="notification-center-deferred-list"
              >
                {deferredToasts.map((toast) => (
                  <li key={toast.id} className={LIST_ITEM}>
                    <div>
                      <strong className="text-foreground">{toast.title}</strong>
                      <p>{toast.message}</p>
                    </div>
                    <button type="button" onClick={() => dismissToast(toast.id)}>
                      Dismiss
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className={UTILITY_BTN} onClick={clearDeferredToasts}>
                Clear deferred
              </button>
            </>
          ) : (
            <p className={cn("toast-center__empty", MUTED_TEXT)}>No deferred notifications queued.</p>
          )
        ) : null}

        {view === "history" && hasContent ? (
          toastHistory.length > 0 ? (
            <>
              <ul
                className="toast-center__list grid list-none gap-3 p-0"
                data-testid="notification-center-history-list"
              >
                {toastHistory.map((toast) => (
                  <li key={toast.id} className={LIST_ITEM}>
                    <div>
                      <strong className="text-foreground">{toast.title}</strong>
                      <p>{toast.message}</p>
                    </div>
                    <span className="toast-center__history-time text-[0.82rem] whitespace-nowrap text-muted-foreground">
                      {toast.dismissedAt
                        ? new Date(toast.dismissedAt).toLocaleTimeString()
                        : "Dismissed"}
                    </span>
                  </li>
                ))}
              </ul>
              <button type="button" className={UTILITY_BTN} onClick={clearToastHistory}>
                Clear recent
              </button>
            </>
          ) : (
            <p className={cn("toast-center__empty", MUTED_TEXT)}>
              No recent notification history yet.
            </p>
          )
        ) : null}
      </div>
    </aside>
  );
}

export default NotificationCenter;
