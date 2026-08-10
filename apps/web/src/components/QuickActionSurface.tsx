import React from "react";

export interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  shortcutHint?: string;
  onSelect: () => void | Promise<void>;
  disabled?: boolean;
}

export interface QuickActionSurfaceProps {
  actions: QuickActionItem[];
  testId?: string;
}

export function QuickActionSurface({
  actions,
  testId = "quick-action-surface",
}: QuickActionSurfaceProps): React.JSX.Element {
  return (
    <section
      className="quick-action-surface"
      aria-label="Quick dashboard actions"
      data-testid={testId}
    >
      <div className="quick-action-surface__header">
        <div>
          <p className="quick-action-surface__eyebrow">Quick actions</p>
          <h2 className="quick-action-surface__title">
            Common dashboard tasks, one tap away
          </h2>
          <p className="quick-action-surface__subtitle">
            Use the launcher below or jump into the command center.
          </p>
        </div>
      </div>

      <div className="quick-action-surface__grid">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="quick-action-surface__item"
            onClick={action.onSelect}
            disabled={action.disabled}
            data-testid={`${testId}-${action.id}`}
          >
            <span className="quick-action-surface__item-topline">
              <span className="quick-action-surface__item-label">
                {action.label}
              </span>
              {action.shortcutHint ? (
                <span className="quick-action-surface__item-shortcut">
                  {action.shortcutHint}
                </span>
              ) : null}
            </span>
            <span className="quick-action-surface__item-description">
              {action.description}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActionSurface;
