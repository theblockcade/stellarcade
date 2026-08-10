import React from 'react';
import { SkeletonBase } from './LoadingSkeletonSet';
import './DashboardCardSkeleton.css';

export type DashboardCardSkeletonVariant = 'metric' | 'list' | 'chart';

export interface DashboardCardSkeletonProps {
  count?: number;
  variant?: DashboardCardSkeletonVariant;
  testId?: string;
}

function MetricSkeletonCard({ cardIndex, testId }: { cardIndex: number; testId: string }) {
  return (
    <div
      className="dashboard-card-skeleton dashboard-card-skeleton--metric"
      data-testid={`${testId}-card-${cardIndex}`}
    >
      <SkeletonBase height="16px" width="60%" className="dashboard-card-skeleton__title" />
      <SkeletonBase height="36px" width="50%" className="dashboard-card-skeleton__number" />
      <SkeletonBase height="12px" width="40%" className="dashboard-card-skeleton__subtitle" />
    </div>
  );
}

function ListSkeletonCard({ cardIndex, testId }: { cardIndex: number; testId: string }) {
  return (
    <div
      className="dashboard-card-skeleton dashboard-card-skeleton--list"
      data-testid={`${testId}-card-${cardIndex}`}
    >
      <SkeletonBase height="16px" width="55%" className="dashboard-card-skeleton__title" />
      <div className="dashboard-card-skeleton__rows">
        <SkeletonBase height="14px" width="90%" />
        <SkeletonBase height="14px" width="75%" />
        <SkeletonBase height="14px" width="80%" />
      </div>
    </div>
  );
}

function ChartSkeletonCard({ cardIndex, testId }: { cardIndex: number; testId: string }) {
  return (
    <div
      className="dashboard-card-skeleton dashboard-card-skeleton--chart"
      data-testid={`${testId}-card-${cardIndex}`}
    >
      <SkeletonBase height="16px" width="50%" className="dashboard-card-skeleton__title" />
      <SkeletonBase
        height="120px"
        className="dashboard-card-skeleton__chart-area"
        borderRadius="0.5rem"
      />
    </div>
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

export const DashboardCardSkeleton: React.FC<DashboardCardSkeletonProps> = ({
  count = 3,
  variant = 'metric',
  testId = 'dashboard-card-skeleton',
}) => {
  const CardComponent = VARIANT_MAP[variant];
  const safeCount = Math.max(0, count);

  return (
    <div
      className={`dashboard-card-skeleton-grid dashboard-card-skeleton-grid--${variant}`}
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

DashboardCardSkeleton.displayName = 'DashboardCardSkeleton';

export default DashboardCardSkeleton;
