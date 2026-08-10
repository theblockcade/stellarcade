"use client";

import * as React from "react";
import { useId } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "../lib/utils";

export interface DashboardCardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  description?: string;
  variant?: "default" | "primary" | "elevated";
  loading?: boolean;
  loadingLabel?: string;
  isEmpty?: boolean;
  descriptionId?: string;
  testId?: string;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<NonNullable<DashboardCardContainerProps["variant"]>, string> = {
  default: "",
  primary: "border-primary/40",
  elevated: "shadow-lg",
};

/** Next.js/shadcn port of frontend/src/components/v1/DashboardCardContainer.tsx
 * — same ARIA-enhanced wrapper (label, description, busy/empty state), on
 * shadcn's Card instead of hand-rolled CSS. */
export const DashboardCardContainer: React.FC<DashboardCardContainerProps> = ({
  label,
  description,
  variant = "default",
  loading = false,
  loadingLabel,
  isEmpty = false,
  descriptionId: customDescriptionId,
  testId = "dashboard-card",
  className = "",
  children,
  ...rest
}) => {
  const generatedId = useId();
  const descriptionId = customDescriptionId || `${testId}-desc-${generatedId}`;
  const resolvedLabel = loading && loadingLabel ? loadingLabel : label;

  return (
    <Card
      className={cn("relative gap-0 p-0", VARIANT_STYLES[variant], className)}
      data-testid={testId}
      role="region"
      aria-label={resolvedLabel}
      aria-describedby={description ? descriptionId : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {description && (
        <span id={descriptionId} className="sr-only">
          {description}
        </span>
      )}

      <div className="p-6" data-testid={`${testId}-content`}>
        {children}
      </div>

      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm"
          aria-hidden="true"
          data-testid={`${testId}-loading`}
        >
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}

      {isEmpty && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80"
          data-testid={`${testId}-empty`}
        >
          <p className="m-0 text-sm text-muted-foreground">No data available</p>
        </div>
      )}
    </Card>
  );
};

DashboardCardContainer.displayName = "DashboardCardContainer";
export default DashboardCardContainer;
