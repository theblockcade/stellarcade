import React from "react";

import { Skeleton } from "../../src/components/ui/skeleton";

/**
 * Route-group loading state. The block layout deliberately mirrors the real
 * dashboard (masthead → four KPI tiles → chart grid) so the page doesn't
 * visibly re-flow when the content swaps in.
 */
export default function DashboardLoading() {
  return (
    <div
      data-testid="dashboard-loading-skeleton"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading dashboard…</span>

      {/* Masthead */}
      <div className="rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-36 rounded-full" />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-28 rounded-full" />
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card/60 p-4">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-4 rounded" />
            </div>
            <Skeleton className="mt-3 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-28" />
            <Skeleton className="mt-3 h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Chart grid */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/60 xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-7 w-32 rounded-lg" />
          </div>
          <div className="p-5">
            <Skeleton className="h-64 w-full sm:h-72" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/60">
          <div className="border-b border-border/70 px-5 py-4">
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex flex-col items-center gap-4 p-5">
            <Skeleton className="size-40 rounded-full" />
            <div className="grid w-full grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
