/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { GameStatsTrendChart, type TrendDataPoint } from '@/components/v1/GameStatsTrendChart';

const mockDataPoints: TrendDataPoint[] = [
  { label: 'Mon', value: 100 },
  { label: 'Tue', value: 150 },
  { label: 'Wed', value: 120 },
  { label: 'Thu', value: 200 },
  { label: 'Fri', value: 180 },
];

describe('GameStatsTrendChart (#972)', () => {
  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------
  it('renders the default empty message when dataPoints is empty', () => {
    render(<GameStatsTrendChart dataPoints={[]} metricLabel="Win Rate" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders a custom empty message when provided', () => {
    render(
      <GameStatsTrendChart
        dataPoints={[]}
        metricLabel="Win Rate"
        emptyLabel="No stats recorded"
      />
    );
    expect(screen.getByText('No stats recorded')).toBeInTheDocument();
  });

  it('empty state has role=status for accessibility', () => {
    render(<GameStatsTrendChart dataPoints={[]} metricLabel="Win Rate" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  it('renders a loading indicator when isLoading is true', () => {
    render(<GameStatsTrendChart dataPoints={mockDataPoints} metricLabel="Win Rate" isLoading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('loading state has aria-live=polite', () => {
    render(<GameStatsTrendChart dataPoints={mockDataPoints} metricLabel="Win Rate" isLoading />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  // ---------------------------------------------------------------------------
  // Chart rendering
  // ---------------------------------------------------------------------------
  it('renders the metric label as title', () => {
    render(<GameStatsTrendChart dataPoints={mockDataPoints} metricLabel="Win Rate" />);
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
  });

  it('renders all data point labels', () => {
    render(<GameStatsTrendChart dataPoints={mockDataPoints} metricLabel="Win Rate" />);
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
  });

  it('renders range summary', () => {
    render(<GameStatsTrendChart dataPoints={mockDataPoints} metricLabel="Win Rate" />);
    expect(screen.getByText('Range: 100 – 200')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Trend detection
  // ---------------------------------------------------------------------------
  it('detects increasing trend when values increase overall', () => {
    render(<GameStatsTrendChart dataPoints={mockDataPoints} metricLabel="Win Rate" />);
    expect(screen.getByText('Increasing')).toBeInTheDocument();
  });

  it('detects decreasing trend when values decrease overall', () => {
    const decreasingData: TrendDataPoint[] = [
      { label: 'Mon', value: 200 },
      { label: 'Tue', value: 150 },
      { label: 'Wed', value: 100 },
    ];
    render(<GameStatsTrendChart dataPoints={decreasingData} metricLabel="Loss Rate" />);
    expect(screen.getByText('Decreasing')).toBeInTheDocument();
  });

  it('detects stable trend when first and last values are equal', () => {
    const stableData: TrendDataPoint[] = [
      { label: 'Mon', value: 100 },
      { label: 'Tue', value: 150 },
      { label: 'Wed', value: 100 },
    ];
    render(<GameStatsTrendChart dataPoints={stableData} metricLabel="Score" />);
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Custom formatting
  // ---------------------------------------------------------------------------
  it('uses custom formatValue when provided', () => {
    const formatValue = (v: number) => `$${v.toFixed(2)}`;
    render(
      <GameStatsTrendChart
        dataPoints={[{ label: 'A', value: 123.45 }]}
        metricLabel="Revenue"
        formatValue={formatValue}
      />
    );
    const rangeText = screen.getByText(/Range:/);
    expect(rangeText.textContent).toContain('$123.45');
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------
  it('chart has role=figure with descriptive aria-label', () => {
    render(<GameStatsTrendChart dataPoints={mockDataPoints} metricLabel="Win Rate" />);
    const figure = screen.getByRole('figure');
    expect(figure).toHaveAttribute('aria-label');
    expect(figure.getAttribute('aria-label')).toContain('Win Rate');
  });

  it('each bar group is focusable via tabIndex', () => {
    render(<GameStatsTrendChart dataPoints={mockDataPoints} metricLabel="Win Rate" />);
    const barGroups = screen.getAllByRole('listitem');
    expect(barGroups.length).toBe(mockDataPoints.length);
    barGroups.forEach((group) => {
      expect(group).toHaveAttribute('tabindex', '0');
    });
  });
});
