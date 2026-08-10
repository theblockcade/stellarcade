import * as React from "react";
import { SkeletonBase } from "./LoadingSkeletonSet";
import { Card } from "./ui/card";

export type DashboardCardSkeletonVariant = "metric" | "list" | "chart";

export interface DashboardCardSkeletonProps {
  count?: number;
  variant?: DashboardCardSkeletonVariant;
  testId?: string;
}

function MetricSkeletonCard({ cardIndex, testId }: { cardIndex: number; testId: string }) {
  return (
    <Card className="flex flex-col gap-3 p-5" data-testid={`${testId}-card-${cardIndex}`}>
      <SkeletonBase height="16px" width="60%" />
      <SkeletonBase height="36px" width="50%" />
      <SkeletonBase height="12px" width="40%" />
    </Card>
  );
}

function ListSkeletonCard({ cardIndex, testId }: { cardIndex: number; testId: string }) {
  return (
    <Card className="flex flex-col gap-3 p-5" data-testid={`${testId}-card-${cardIndex}`}>
      <SkeletonBase height="16px" width="55%" />
      <div className="flex flex-col gap-2">
        <SkeletonBase height="14px" width="90%" />
        <SkeletonBase height="14px" width="75%" />
        <SkeletonBase height="14px" width="80%" />
      </div>
    </Card>
  );
}

function ChartSkeletonCard({ cardIndex, testId }: { cardIndex: number; testId: string }) {
  return (
    <Card className="flex flex-col gap-3 p-5" data-testid={`${testId}-card-${cardIndex}`}>
      <SkeletonBase height="16px" width="50%" />
      <SkeletonBase height="120px" borderRadius="0.5rem" />
    </Card>
  );
}

const VARIANT_MAP: Record<
  DashboardCardSkeletonVariant,
  React.FC<{ cardIndex: number; testId: string }>
> = {
  metric: MetricSkeletonCard,
  list: ListSkeletonCard,
  chart: ChartSkeletonCard,
};

/** Next.js/shadcn port of frontend/src/components/v1/DashboardCardSkeleton.tsx
 * — same 3 variants, rebuilt on shadcn's Card instead of hand-rolled CSS.
 * SkeletonBase itself (utils/../LoadingSkeletonSet.tsx) is unchanged. */
export const DashboardCardSkeleton: React.FC<DashboardCardSkeletonProps> = ({
  count = 3,
  variant = "metric",
  testId = "dashboard-card-skeleton",
}) => {
  const CardComponent = VARIANT_MAP[variant];
  const safeCount = Math.max(0, count);

  return (
    <div
      className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
      data-testid={testId}
      aria-busy="true"
      aria-label="Loading dashboard cards"
    >
      {Array.from({ length: safeCount }).map((_, i) => (
        <CardComponent key={`${testId}-${variant}-${i}`} cardIndex={i} testId={testId} />
      ))}
    </div>
  );
};

DashboardCardSkeleton.displayName = "DashboardCardSkeleton";

export default DashboardCardSkeleton;
