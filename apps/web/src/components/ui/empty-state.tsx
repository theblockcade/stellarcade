import * as React from "react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.ComponentProps<"div"> {
  icon: React.ElementType;
  title: string;
  /** One or two sentences: what's missing, and what will make it appear. */
  body: string;
  action?: React.ReactNode;
  /** Roomier padding for a panel that owns a whole section. */
  size?: "default" | "lg";
}

/**
 * The "nothing here yet" state.
 *
 * StellarCade has not settled real rounds yet, so most player-facing surfaces
 * have no data behind them. They render this instead of sample figures:
 * placeholder numbers on a wagering UI read as real balances and standings,
 * which is worse than a blank panel. Each instance says what is missing and
 * what will fill it, so an empty screen reads as a stage of the product
 * rather than as a bug.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  size = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 text-center",
        size === "lg" ? "py-16" : "py-10",
        className,
      )}
      {...props}
    >
      <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-background/50 text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
      {action}
    </div>
  );
}

export default EmptyState;
