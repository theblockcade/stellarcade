"use client";

import React, { useMemo } from "react";
import { Timeline, type TimelineItemData } from "./Timeline";
import "./UserActivityTimeline.css";

export type ActivityType =
  | "login"
  | "logout"
  | "transaction"
  | "withdrawal"
  | "deposit"
  | "stake"
  | "claim_reward"
  | "achievement_unlock"
  | "profile_update"
  | "security_change"
  | "error";

export interface UserActivity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date | string;
  status?: "success" | "pending" | "failed";
  metadata?: Record<string, string | number>;
}

export interface UserActivityTimelineProps {
  activities: UserActivity[];
  loading?: boolean;
  compact?: boolean;
  onActivityClick?: (activity: UserActivity) => void;
  maxItems?: number;
  className?: string;
  testId?: string;
}

function getTimelineStatus(
  status?: "success" | "pending" | "failed"
): "completed" | "pending" | "active" | "error" {
  if (status === "pending") return "pending";
  if (status === "failed") return "error";
  return "completed";
}

function formatTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const UserActivityTimeline: React.FC<UserActivityTimelineProps> = ({
  activities,
  loading = false,
  compact = false,
  onActivityClick,
  maxItems,
  className = "",
  testId = "user-activity-timeline",
}) => {
  const timelineItems: TimelineItemData[] = useMemo(() => {
    let items = activities.map((activity) => ({
      id: activity.id,
      label: activity.title,
      status: getTimelineStatus(activity.status),
      timestamp: formatTimestamp(activity.timestamp),
      metadata: activity.description || undefined,
    }));

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

      <div className="user-activity-timeline__container">
        {isEmpty && !loading ? (
          <div className="user-activity-timeline__empty" data-testid={`${testId}-empty`}>
            <p className="user-activity-timeline__empty-text">No activity recorded yet.</p>
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

      {maxItems && activities.length > maxItems && (
        <div className="user-activity-timeline__footer" data-testid={`${testId}-more-hint`}>
          <p className="user-activity-timeline__more-text">
            {activities.length - maxItems} more activities
          </p>
        </div>
      )}
    </section>
  );
};

UserActivityTimeline.displayName = "UserActivityTimeline";
export default UserActivityTimeline;
