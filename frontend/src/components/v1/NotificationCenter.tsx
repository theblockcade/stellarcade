import React from "react";
import { useErrorStore } from "../../store/errorStore";
import { SegmentedControl } from "./SegmentedControl";
import "./NotificationCenter.css";

type NotificationView = "active" | "deferred" | "history";

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

export function NotificationCenter({
  showWhenEmpty = false,
}: NotificationCenterProps): React.JSX.Element | null {
  const toasts = useErrorStore((state) => state.toasts);
  const deferredToasts = useErrorStore((state) => state.deferredToasts);
  const toastHistory = useErrorStore((state) => state.toastHistory);
  const dismissToast = useErrorStore((state) => state.dismissToast);
  const clearToasts = useErrorStore((state) => state.clearToasts);
  const clearDeferredToasts = useErrorStore((state) => state.clearDeferredToasts);
  const clearToastHistory = useErrorStore((state) => state.clearToastHistory);
  const [view, setView] = React.useState<NotificationView>("active");

  const hasContent =
    toasts.length > 0 || deferredToasts.length > 0 || toastHistory.length > 0;

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
      className="toast-center"
      aria-label="Notifications"
      data-testid="notification-center"
    >
      <div className="toast-center__panel">
        <div className="toast-center__toolbar">
          <div>
            <strong>Notifications</strong>
            <p className="toast-center__subtitle">
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
            className="toast-center__switcher"
            testId="notification-center-view"
          />
        </div>

        {!hasContent ? (
          <p className="toast-center__empty" data-testid="notification-center-empty-panel">
            No notifications yet. New alerts, deferred items, and recent history will appear
            here.
          </p>
        ) : null}

        {view === "active" && hasContent ? (
          <>
            {toasts.length > 0 ? (
              <div className="toast-center__stack">
                {toasts.map((toast) => (
                  <section
                    key={toast.id}
                    className={`toast-center__toast toast-center__toast--${toast.tone}`}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="toast-center__toast-header">
                      <span className="toast-center__tone">
                        {toneLabelMap[toast.tone]}
                      </span>
                      <button
                        type="button"
                        className="toast-center__dismiss"
                        aria-label={`Dismiss ${toast.title}`}
                        onClick={() => dismissToast(toast.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                    <strong className="toast-center__title">{toast.title}</strong>
                    <p className="toast-center__message">{toast.message}</p>
                  </section>
                ))}
              </div>
            ) : (
              <p className="toast-center__empty">No active notifications right now.</p>
            )}

            {deferredToasts.length > 0 ? (
              <p
                className="toast-center__meta"
                data-testid="notification-center-queued-summary"
              >
                {deferredToasts.length} deferred event
                {deferredToasts.length === 1 ? "" : "s"} waiting for display.
              </p>
            ) : null}

            {toasts.length > 0 ? (
              <button
                type="button"
                className="toast-center__utility"
                onClick={clearToasts}
              >
                Dismiss active
              </button>
            ) : null}
          </>
        ) : null}

        {view === "deferred" && hasContent ? (
          deferredToasts.length > 0 ? (
            <>
              <ul
                className="toast-center__list"
                data-testid="notification-center-deferred-list"
              >
                {deferredToasts.map((toast) => (
                  <li key={toast.id} className="toast-center__list-item">
                    <div>
                      <strong>{toast.title}</strong>
                      <p>{toast.message}</p>
                    </div>
                    <button type="button" onClick={() => dismissToast(toast.id)}>
                      Dismiss
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="toast-center__utility"
                onClick={clearDeferredToasts}
              >
                Clear deferred
              </button>
            </>
          ) : (
            <p className="toast-center__empty">No deferred notifications queued.</p>
          )
        ) : null}

        {view === "history" && hasContent ? (
          toastHistory.length > 0 ? (
            <>
              <ul
                className="toast-center__list"
                data-testid="notification-center-history-list"
              >
                {toastHistory.map((toast) => (
                  <li key={toast.id} className="toast-center__list-item">
                    <div>
                      <strong>{toast.title}</strong>
                      <p>{toast.message}</p>
                    </div>
                    <span className="toast-center__history-time">
                      {toast.dismissedAt
                        ? new Date(toast.dismissedAt).toLocaleTimeString()
                        : "Dismissed"}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="toast-center__utility"
                onClick={clearToastHistory}
              >
                Clear recent
              </button>
            </>
          ) : (
            <p className="toast-center__empty">No recent notification history yet.</p>
          )
        ) : null}
      </div>
    </aside>
  );
}

export default NotificationCenter;
