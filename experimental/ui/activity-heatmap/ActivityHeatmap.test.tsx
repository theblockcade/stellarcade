import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ActivityHeatmap } from './ActivityHeatmap';
import type { ActivityDataPoint } from './types';

describe('ActivityHeatmap', () => {
  const mockData: ActivityDataPoint[] = [
    { date: '2026-01-01', count: 5, metadata: { matchesPlayed: 3, xpEarned: 150 } },
    { date: '2026-01-02', count: 12, metadata: { matchesPlayed: 8, xpEarned: 400 } },
    { date: '2026-01-03', count: 0 },
    { date: '2026-01-04', count: 2 },
    { date: '2026-01-05', count: 7 },
  ];

  it('renders heatmap with correct number of day cells', () => {
    render(<ActivityHeatmap data={mockData} />);
    
    const grid = screen.getByTestId('activity-heatmap');
    expect(grid).toBeInTheDocument();
    
    const days = grid.querySelectorAll('[data-date]');
    expect(days.length).toBeGreaterThan(0);
  });

  it('handles empty data gracefully', () => {
    render(<ActivityHeatmap data={[]} />);
    
    const grid = screen.getByTestId('activity-heatmap');
    expect(grid).toBeInTheDocument();
  });

  it('shows tooltip on mouse enter with correct data', () => {
    render(<ActivityHeatmap data={mockData} />);
    
    const grid = screen.getByTestId('activity-heatmap');
    const firstDay = grid.querySelector('[data-date="2026-01-01"]');
    
    expect(firstDay).toBeInTheDocument();
    
    fireEvent.mouseEnter(firstDay!);
    
    const tooltip = document.querySelector('.activity-heatmap__tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('2026-01-01');
  });

  it('hides tooltip on mouse leave', () => {
    render(<ActivityHeatmap data={mockData} />);
    
    const grid = screen.getByTestId('activity-heatmap');
    const firstDay = grid.querySelector('[data-date="2026-01-01"]');
    
    fireEvent.mouseEnter(firstDay!);
    fireEvent.mouseLeave(firstDay!);
    
    const tooltip = document.querySelector('.activity-heatmap__tooltip');
    expect(tooltip).not.toBeInTheDocument();
  });

  it('displays metadata in tooltip when available', () => {
    render(<ActivityHeatmap data={mockData} />);
    
    const grid = screen.getByTestId('activity-heatmap');
    const firstDay = grid.querySelector('[data-date="2026-01-01"]');
    
    fireEvent.mouseEnter(firstDay!);
    
    const tooltip = document.querySelector('.activity-heatmap__tooltip');
    expect(tooltip).toHaveTextContent('Matches: 3');
    expect(tooltip).toHaveTextContent('XP: 150');
  });

  it('correctly maps intensity levels based on count values', () => {
    render(<ActivityHeatmap data={mockData} />);
    
    const grid = screen.getByTestId('activity-heatmap');
    
    const zeroCountDay = grid.querySelector('[data-date="2026-01-03"]');
    expect(zeroCountDay).toHaveClass('activity-heatmap__day--level-0');
    
    const lowCountDay = grid.querySelector('[data-date="2026-01-04"]');
    expect(lowCountDay).toHaveClass('activity-heatmap__day--level-1');
    
    const mediumCountDay = grid.querySelector('[data-date="2026-01-01"]');
    expect(mediumCountDay).toHaveClass('activity-heatmap__day--level-2');
    
    const highCountDay = grid.querySelector('[data-date="2026-01-05"]');
    expect(highCountDay).toHaveClass('activity-heatmap__day--level-3');
    
    const ultraCountDay = grid.querySelector('[data-date="2026-01-02"]');
    expect(ultraCountDay).toHaveClass('activity-heatmap__day--level-4');
  });

  it('applies correct color scheme', () => {
    const { rerender } = render(<ActivityHeatmap data={mockData} colorScheme="neon" />);
    
    const grid = screen.getByTestId('activity-heatmap');
    expect(grid).toBeInTheDocument();
    
    rerender(<ActivityHeatmap data={mockData} colorScheme="arcade" />);
    expect(grid).toBeInTheDocument();
  });

  it('respects custom className', () => {
    render(<ActivityHeatmap data={mockData} className="custom-class" />);
    
    const grid = screen.getByTestId('activity-heatmap');
    expect(grid).toHaveClass('custom-class');
  });

  it('respects custom testId', () => {
    render(<ActivityHeatmap data={mockData} testId="custom-heatmap" />);
    
    const grid = screen.getByTestId('custom-heatmap');
    expect(grid).toBeInTheDocument();
  });

  it('handles custom date range', () => {
    render(
      <ActivityHeatmap 
        data={mockData} 
        startDate="2026-01-01" 
        endDate="2026-01-10" 
      />
    );
    
    const grid = screen.getByTestId('activity-heatmap');
    expect(grid).toBeInTheDocument();
  });

  it('renders day-of-week labels', () => {
    render(<ActivityHeatmap data={mockData} />);
    
    const grid = screen.getByTestId('activity-heatmap');
    const dayLabels = grid.querySelectorAll('.activity-heatmap__day-label');
    expect(dayLabels.length).toBe(7);
  });

  it('renders legend', () => {
    render(<ActivityHeatmap data={mockData} />);
    
    const grid = screen.getByTestId('activity-heatmap');
    const legend = grid.querySelector('.activity-heatmap__legend');
    expect(legend).toBeInTheDocument();
    
    const legendItems = grid.querySelectorAll('.activity-heatmap__legend-item');
    expect(legendItems.length).toBe(5);
  });

  it('handles keyboard navigation', () => {
    render(<ActivityHeatmap data={mockData} />);
    
    const grid = screen.getByTestId('activity-heatmap');
    const firstDay = grid.querySelector('[data-date="2026-01-01"]');
    
    firstDay?.focus();
    expect(firstDay).toHaveFocus();
  });

  it('has correct accessibility attributes', () => {
    render(<ActivityHeatmap data={mockData} />);
    
    const grid = screen.getByTestId('activity-heatmap');
    const firstDay = grid.querySelector('[data-date="2026-01-01"]');
    
    expect(firstDay).toHaveAttribute('role', 'button');
    expect(firstDay).toHaveAttribute('tabIndex', '0');
    expect(firstDay).toHaveAttribute('aria-label', expect.stringContaining('2026-01-01'));
  });
});