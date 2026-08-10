import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardCardSkeleton } from '../../src/components/v1/DashboardCardSkeleton';

describe('DashboardCardSkeleton', () => {
  it('renders default count of 3 cards', () => {
    render(<DashboardCardSkeleton testId="dcs" />);
    expect(screen.getByTestId('dcs-card-0')).toBeInTheDocument();
    expect(screen.getByTestId('dcs-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('dcs-card-2')).toBeInTheDocument();
    expect(screen.queryByTestId('dcs-card-3')).not.toBeInTheDocument();
  });

  it('renders the specified count of skeleton cards', () => {
    render(<DashboardCardSkeleton count={5} testId="dcs" />);
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId(`dcs-card-${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('dcs-card-5')).not.toBeInTheDocument();
  });

  it('renders zero cards when count is 0', () => {
    render(<DashboardCardSkeleton count={0} testId="dcs" />);
    expect(screen.queryByTestId('dcs-card-0')).not.toBeInTheDocument();
  });

  it('applies metric variant class by default', () => {
    render(<DashboardCardSkeleton testId="dcs" />);
    const grid = screen.getByTestId('dcs');
    expect(grid).toHaveClass('dashboard-card-skeleton-grid--metric');
    expect(screen.getByTestId('dcs-card-0')).toHaveClass('dashboard-card-skeleton--metric');
  });

  it('applies list variant class when variant=list', () => {
    render(<DashboardCardSkeleton variant="list" testId="dcs" />);
    const grid = screen.getByTestId('dcs');
    expect(grid).toHaveClass('dashboard-card-skeleton-grid--list');
    expect(screen.getByTestId('dcs-card-0')).toHaveClass('dashboard-card-skeleton--list');
  });

  it('applies chart variant class when variant=chart', () => {
    render(<DashboardCardSkeleton variant="chart" testId="dcs" />);
    const grid = screen.getByTestId('dcs');
    expect(grid).toHaveClass('dashboard-card-skeleton-grid--chart');
    expect(screen.getByTestId('dcs-card-0')).toHaveClass('dashboard-card-skeleton--chart');
  });

  it('grid has aria-busy true', () => {
    render(<DashboardCardSkeleton testId="dcs" />);
    expect(screen.getByTestId('dcs')).toHaveAttribute('aria-busy', 'true');
  });
});
