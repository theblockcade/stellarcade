import React, { useMemo } from 'react';
import { Timeline, TimelineItemData } from './Timeline';
import './UserActivityTimeline.css';

/**
 * Activity type definitions for common user activities.
 */
export type ActivityType =
  | 'login'
  | 'logout'
  | 'transaction'
  | 'withdrawal'
  | 'deposit'
  | 'stake'
  | 'claim_reward'
  | 'achievement_unlock'
  | 'profile_update'
  | 'security_change'
  | 'error';

/**
 * Activity data structure for UserActivityTimeline.
 */
export interface UserActivity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date | string;
  status?: 'success' | 'pending' | 'failed';
  metadata?: Record<string, string | number>;
}

/**
 * UserActivityTimeline - Displays user activity history in chronological order.
 *
 * Features:
 * - Converts user activities to timeline items
 * - Automatic icon mapping based on activity type
 * - Status-based visual treatment (success, pending, failed)
 * - Responsive vertical layout
 * - Full accessibility with ARIA landmarks
 * - Empty state handling
 * - Loading state support
 *
 * Usage:
 * <UserActivityTimeline
 *   activities={activities}
 *   loading={isLoading}
 *   onActivityClick={(activity) => console.log(activity)}
 * />
 */

export interface UserActivityTimelineProps {
  /** Array of user activities to display. */
  activities: UserActivity[];
  /** Whether the activity list is currently loading. */
  loading?: boolean;
  /** Whether to show activities in compact mode. */
  compact?: boolean;
  /** Optional callback when an activity item is clicked. */
  onActivityClick?: (activity: UserActivity) => void;
  /** Maximum number of activities to show. Remaining are hidden. */
  maxItems?: number;
  /** Additional CSS class names. */
  className?: string;
  /** Test ID for component testing. */
  testId?: string;
}

/**
 * Maps activity types to readable labels and icons.
 */
function getActivityLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    login: 'Logged In',
    logout: 'Logged Out',
    transaction: 'Transaction',
    withdrawal: 'Withdrawal',
    deposit: 'Deposit',
    stake: 'Staked',
    claim_reward: 'Claimed Reward',
    achievement_unlock: 'Achievement Unlocked',
    profile_update: 'Profile Updated',
    security_change: 'Security Changed',
    error: 'Error Occurred',
  };
  return labels[type] || type;
}

/**
 * Converts user activity status to timeline status.
 */
function getTimelineStatus(
  status?: 'success' | 'pending' | 'failed'
): 'completed' | 'pending' | 'active' | 'error' {
  if (status === 'pending') return 'pending';
  if (status === 'failed') return 'error';
  return 'completed';
}

/**
 * Formats timestamp for display.
 */
function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const UserActivityTimeline: React.FC<UserActivityTimelineProps> = ({
  activities,
  loading = false,
  compact = false,
  onActivityClick,
  maxItems,
  className = '',
  testId = 'user-activity-timeline',
}) => {
  // Convert user activities to timeline items
  const timelineItems: TimelineItemData[] = useMemo(() => {
    let items = activities.map((activity) => ({
      id: activity.id,
      label: activity.title,
      status: getTimelineStatus(activity.status),
      timestamp: formatTimestamp(activity.timestamp),
      metadata: activity.description || undefined,
    }));

    // Limit items if maxItems is specified
    if (maxItems && items.length > maxItems) {
      items = items.slice(0, maxItems);
    }

    return items;
  }, [activities, maxItems]);

  const isEmpty = activities.length === 0;

  return (
    <section
      className={`user-activity-timeline ${className}`.trim()}
      role="region"
      aria-label="User Activity Timeline"
      data-testid={testId}
    >
      {/* Header with title and status */}
      <div className="user-activity-timeline__header">
        <h2 className="user-activity-timeline__title">Recent Activity</h2>
        {loading && (
          <span
            className="user-activity-timeline__status"
            aria-live="polite"
            data-testid={`${testId}-loading`}
          >
            Loading...
          </span>
        )}
      </div>

      {/* Timeline or empty state */}
      <div className="user-activity-timeline__container">
        {isEmpty && !loading ? (
          <div
            className="user-activity-timeline__empty"
            data-testid={`${testId}-empty`}
          >
            <p className="user-activity-timeline__empty-text">
              No activity recorded yet.
            </p>
          </div>
        ) : (
          <Timeline
            items={timelineItems}
            orientation="vertical"
            compact={compact}
            testId={testId}
          />
        )}
      </div>

      {/* Items count and view more hint */}
      {maxItems && activities.length > maxItems && (
        <div
          className="user-activity-timeline__footer"
          data-testid={`${testId}-more-hint`}
        >
          <p className="user-activity-timeline__more-text">
            {activities.length - maxItems} more activities
          </p>
        </div>
      )}

      {/* Clickable activity region (if callback provided) */}
      {onActivityClick && activities.length > 0 && (
        <div className="user-activity-timeline__actions" role="region" aria-label="Activity actions">
          {activities.map((activity) => (
            <button
              key={activity.id}
              className="user-activity-timeline__activity-button sr-only"
              onClick={() => onActivityClick(activity)}
              aria-label={`View details for ${activity.title}`}
              data-testid={`${testId}-activity-${activity.id}`}
            >
              Details
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

UserActivityTimeline.displayName = 'UserActivityTimeline';
export default UserActivityTimeline;
