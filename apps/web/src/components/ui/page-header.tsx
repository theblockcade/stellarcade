import * as React from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps extends React.ComponentProps<"header"> {
  title: string;
  description?: React.ReactNode;
  /** Small pill above the title, e.g. a network or status chip. */
  eyebrow?: React.ReactNode;
  icon?: React.ReactNode;
  /** Buttons/controls pinned to the right on wide viewports. */
  actions?: React.ReactNode;
}

/**
 * The masthead every dashboard route opens with — one glass panel carrying
 * the h1, a short orientation line, and the route's primary actions. Having
 * it in one place is what keeps the routes from drifting into fifteen
 * slightly different heading treatments.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm sm:p-6",
        className,
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          {icon ? (
            <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary [&_svg]:size-5.5">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? <div className="mb-2">{eyebrow}</div> : null}
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="relative mt-5">{children}</div> : null}
    </header>
  );
}

export default PageHeader;
