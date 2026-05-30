import React, { useState } from 'react';
import {
  getNotificationPreferences,
  persistNotificationPreferences,
  resetNotificationPreferences,
} from '../../services/global-state-store';
import {
  NOTIFICATION_PREFERENCE_LABELS,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from '../../types/notification';
import { PreferenceDraftIndicator } from './PreferenceDraftIndicator';
import './NotificationPreferencesPanel.css';

export interface NotificationPreferencesPanelProps {
  className?: string;
  testId?: string;
  /** Whether there are unsaved draft changes */
  hasDraft?: boolean;
  /** Handler to resume editing draft */
  onResumeDraft?: () => void;
  /** Handler to discard draft */
  onDiscardDraft?: () => void;
  /** Whether draft is currently being saved */
  isSavingDraft?: boolean;
  /** Timestamp when draft was last modified */
  draftLastModified?: number;
}

const preferenceOrder: NotificationPreferenceKey[] = [
  'productUpdates',
  'gameReminders',
  'securityAlerts',
  'marketing',
];

export function NotificationPreferencesPanel({
  className = '',
  testId = 'notification-preferences-panel',
  hasDraft = false,
  onResumeDraft,
  onDiscardDraft,
  isSavingDraft = false,
  draftLastModified,
}: NotificationPreferencesPanelProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    getNotificationPreferences()
  );

  const handleToggle = (key: NotificationPreferenceKey) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const next = { ...preferences, [key]: event.target.checked };
    setPreferences(next);
    persistNotificationPreferences(next);
  };

  const handleReset = () => {
    const defaults = resetNotificationPreferences();
    setPreferences(defaults);
  };

  return (
    <section
      className={`notification-preferences-panel ${className}`.trim()}
      data-testid={testId}
      aria-labelledby={`${testId}-title`}
    >
      <div className="notification-preferences-panel__header">
        <div className="notification-preferences-panel__header-content">
          <h2 id={`${testId}-title`} className="notification-preferences-panel__title">
            Notification preferences
          </h2>
          <PreferenceDraftIndicator
            hasDraft={hasDraft}
            sectionId={testId}
            onResume={onResumeDraft}
            onDiscard={onDiscardDraft}
            isSaving={isSavingDraft}
            lastModified={draftLastModified}
          />
        </div>
        <button
          type="button"
          className="notification-preferences-panel__reset"
          onClick={handleReset}
          data-testid={`${testId}-reset`}
        >
          Reset to defaults
        </button>
      </div>

      <div className="notification-preferences-panel__list" role="list">
        {preferenceOrder.map((key) => {
          const { label, description } = NOTIFICATION_PREFERENCE_LABELS[key];
          return (
            <label key={key} className="notification-preferences-panel__item">
              <span className="notification-preferences-panel__text">
                <span className="notification-preferences-panel__label">{label}</span>
                <span className="notification-preferences-panel__description">{description}</span>
              </span>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={handleToggle(key)}
                data-testid={`${testId}-toggle-${key}`}
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}

export default NotificationPreferencesPanel;
