"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { cn } from "../lib/utils";

export type AlertBannerVariant = "info" | "success" | "warning" | "error";

export interface AlertBannerAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  testId?: string;
}

export interface AlertBannerProps {
  message?: React.ReactNode;
  variant?: AlertBannerVariant;
  title?: string;
  action?: AlertBannerAction;
  actions?: AlertBannerAction[];
  onDismiss?: () => void;
  icon?: React.ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  position?: "inline" | "sticky-top" | "sticky-bottom";
  className?: string;
  testId?: string;
}

const VARIANT_STYLES: Record<AlertBannerVariant, string> = {
  info: "border-[color:var(--sc-info)] text-[color:var(--sc-info)] [&>svg]:text-[color:var(--sc-info)]",
  success:
    "border-[color:var(--sc-success)] text-[color:var(--sc-success)] [&>svg]:text-[color:var(--sc-success)]",
  warning:
    "border-[color:var(--sc-warning)] text-[color:var(--sc-warning)] [&>svg]:text-[color:var(--sc-warning)]",
  error: "border-destructive text-destructive [&>svg]:text-destructive",
};

const POSITION_STYLES: Record<NonNullable<AlertBannerProps["position"]>, string> = {
  inline: "",
  "sticky-top": "sticky top-0 z-50",
  "sticky-bottom": "sticky bottom-0 z-50",
};

function DefaultIcon({ variant }: { variant: AlertBannerVariant }) {
  switch (variant) {
    case "info":
      return <Info />;
    case "success":
      return <CheckCircle2 />;
    case "warning":
      return <AlertTriangle />;
    case "error":
      return <XCircle />;
  }
}

/**
 * Next.js/shadcn port of frontend/src/components/v1/AlertBanner.tsx — same
 * prop API, rebuilt on shadcn's Alert + Button (pulled via 21st.dev) instead
 * of hand-rolled markup and CSS. Semantic colors (info/success/warning) come
 * from @stellarcade/tokens' --sc-info/--sc-success/--sc-warning directly,
 * since only "error" has a shadcn-standard slot (--destructive).
 */
export function AlertBanner({
  message,
  variant = "info",
  title,
  action,
  actions = [],
  onDismiss,
  icon,
  isLoading = false,
  isDisabled = false,
  position = "inline",
  className = "",
  testId = "alert-banner",
}: AlertBannerProps): React.JSX.Element | null {
  if (!message && !isLoading) {
    return null;
  }

  const roleAttr = variant === "error" || variant === "warning" ? "alert" : "status";
  const ariaLiveAttr = variant === "error" || variant === "warning" ? "assertive" : "polite";

  const allActions = [...actions];
  if (action) {
    allActions.unshift(action);
  }

  return (
    <Alert
      variant={variant === "error" ? "destructive" : "default"}
      className={cn(VARIANT_STYLES[variant], POSITION_STYLES[position], className)}
      data-testid={testId}
      role={roleAttr}
      aria-live={ariaLiveAttr}
    >
      {isLoading ? <Loader2 className="animate-spin" /> : icon || <DefaultIcon variant={variant} />}

      {isLoading ? (
        <div className="col-start-2 flex flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : (
        <>
          {title && <AlertTitle data-testid={`${testId}-title`}>{title}</AlertTitle>}
          <AlertDescription data-testid={`${testId}-message`}>{message}</AlertDescription>
        </>
      )}

      {(allActions.length > 0 || onDismiss) && !isLoading && (
        <div className="col-start-2 mt-2 flex items-center gap-2">
          {allActions.map((act, index) => (
            <Button
              key={`${act.label}-${index}`}
              type="button"
              size="sm"
              variant="outline"
              onClick={act.onClick}
              disabled={isDisabled || act.disabled || act.loading}
              data-testid={act.testId ?? `${testId}-action-${index}`}
            >
              {act.loading && <Loader2 className="animate-spin" />}
              {act.label}
            </Button>
          ))}

          {onDismiss && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={onDismiss}
              disabled={isDisabled}
              aria-label="Dismiss alert"
              data-testid={`${testId}-dismiss`}
            >
              <X />
            </Button>
          )}
        </div>
      )}
    </Alert>
  );
}

export default AlertBanner;
