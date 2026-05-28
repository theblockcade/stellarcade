import React from "react";
import { type HeadingLevel } from "../../hooks/v1/useHeadingLevel";
import { ContentShell } from "./ContentShell";
import {
  QuickPivotLinks,
  type PivotLink,
} from "./QuickPivotLinks";
import {
  InlineAlertCluster,
  type InlineAlertClusterItem,
} from "./InlineAlertCluster";
import "./EntityActionShortcuts.css";

export interface EntityActionShortcutsProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  links: PivotLink[];
  alerts?: InlineAlertClusterItem[];
  headingLevel?: HeadingLevel;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  testId?: string;
}

export function EntityActionShortcuts({
  title = "Related records",
  description,
  links,
  alerts = [],
  headingLevel,
  loading = false,
  emptyMessage = "No related records available yet.",
  className = "",
  testId = "entity-action-shortcuts",
}: EntityActionShortcutsProps): React.JSX.Element {
  return (
    <div
      className={["entity-action-shortcuts", className].filter(Boolean).join(" ")}
      data-testid={testId}
    >
      <ContentShell
        title={title}
        description={description}
        headingLevel={headingLevel}
        className="entity-action-shortcuts__shell"
        testId={`${testId}-shell`}
      >
        <div className="entity-action-shortcuts__content">
          <QuickPivotLinks
            links={links}
            orientation="vertical"
            size="compact"
            loading={loading}
            emptyMessage={emptyMessage}
            testId={`${testId}-links`}
          />
          <InlineAlertCluster
            alerts={alerts}
            testId={`${testId}-alerts`}
          />
        </div>
      </ContentShell>
    </div>
  );
}

export default EntityActionShortcuts;
