/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsRangeSwitcher, type TimeRange } from '@/components/v1/AnalyticsRangeSwitcher';

const mockRanges: TimeRange[] = [
  { id: '24h', label: '24 Hours', shortLabel: '24H', value: '24h' },
  { id: '7d', label: '7 Days', shortLabel: '7D', value: '7d' },
  { id: '30d', label: '30 Days', shortLabel: '30D', value: '30d' },
  { id: '90d', label: '90 Days', shortLabel: '90D', value: '90d', disabled: true },
];

describe('AnalyticsRangeSwitcher', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Primary Success Path', () => {
    it('renders all range options with correct labels', () => {
      render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange} 
        />
      );
      
      expect(screen.getByText('24 Hours')).toBeInTheDocument();
      expect(screen.getByText('7 Days')).toBeInTheDocument();
      expect(screen.getByText('30 Days')).toBeInTheDocument();
      expect(screen.getByText('90 Days')).toBeInTheDocument();
    });

    it('shows selected state correctly', () => {
      render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange} 
        />
      );
      
      const selectedOption = screen.getByTestId('analytics-range-switcher-option-7d');
      expect(selectedOption).toHaveClass('analytics-range-switcher__option--selected');
      expect(selectedOption).toHaveAttribute('aria-checked', 'true');
    });

    it('calls onChange when option is clicked', () => {
      render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange} 
        />
      );
      
      fireEvent.click(screen.getByTestId('analytics-range-switcher-option-24h'));
      
      expect(mockOnChange).toHaveBeenCalledWith('24h', mockRanges[0]);
    });

    it('updates selection indicator position', () => {
      render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="30d" 
          onChange={mockOnChange} 
        />
      );
      
      const indicator = screen.getByRole('radiogroup').querySelector('.analytics-range-switcher__indicator');
      expect(indicator).toHaveStyle('--indicator-index: 2');
    });
  });

  describe('Edge Cases and Fallback Behavior', () => {
    it('shows loading state', () => {
      render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange}
          loading={true}
        />
      );
      
      expect(screen.getByTestId('analytics-range-switcher-loading')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('handles disabled state', () => {
      render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange}
          disabled={true}
        />
      );
      
      const switcher = screen.getByTestId('analytics-range-switcher');
      expect(switcher).toHaveClass('analytics-range-switcher--disabled');
      
      // All options should be disabled
      mockRanges.forEach(range => {
        const option = screen.getByTestId(`analytics-range-switcher-option-${range.id}`);
        expect(option).toBeDisabled();
      });
    });

    it('handles individual disabled options', () => {
      render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange} 
        />
      );
      
      const disabledOption = screen.getByTestId('analytics-range-switcher-option-90d');
      expect(disabledOption).toBeDisabled();
      expect(disabledOption).toHaveClass('analytics-range-switcher__option--disabled');
      
      fireEvent.click(disabledOption);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('uses default ranges when none provided', () => {
      render(
        <AnalyticsRangeSwitcher 
          selectedId="24h" 
          onChange={mockOnChange} 
        />
      );
      
      // Should render default ranges
      expect(screen.getByText('24 Hours')).toBeInTheDocument();
      expect(screen.getByText('7 Days')).toBeInTheDocument();
      expect(screen.getByText('1 Year')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange} 
        />
      );
      
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('aria-label', 'Select time range for analytics');
      
      const options = screen.getAllByRole('radio');
      expect(options).toHaveLength(mockRanges.length);
    });

    it('supports keyboard navigation', () => {
      render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange} 
        />
      );
      
      const option = screen.getByTestId('analytics-range-switcher-option-24h');
      
      fireEvent.keyDown(option, { key: 'Enter' });
      expect(mockOnChange).toHaveBeenCalledWith('24h', mockRanges[0]);
      
      mockOnChange.mockClear();
      
      fireEvent.keyDown(option, { key: ' ' });
      expect(mockOnChange).toHaveBeenCalledWith('24h', mockRanges[0]);
    });

    it('announces selection changes to screen readers', () => {
      render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange} 
        />
      );
      
      const announcement = screen.getByText('Selected time range: 7 Days');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Responsive Behavior', () => {
    it('shows short labels on mobile when configured', () => {
      render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange}
          showLabelsOnMobile={false}
        />
      );
      
      // Both full and short labels should be present in DOM
      expect(screen.getByText('24 Hours')).toBeInTheDocument();
      expect(screen.getByText('24H')).toBeInTheDocument();
    });

    it('applies size variants correctly', () => {
      const { rerender } = render(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange}
          size="compact"
        />
      );
      
      expect(screen.getByTestId('analytics-range-switcher')).toHaveClass('analytics-range-switcher--compact');
      
      rerender(
        <AnalyticsRangeSwitcher 
          ranges={mockRanges} 
          selectedId="7d" 
          onChange={mockOnChange}
          size="default"
        />
      );
      
      expect(screen.getByTestId('analytics-range-switcher')).toHaveClass('analytics-range-switcher--default');
    });
  });
});