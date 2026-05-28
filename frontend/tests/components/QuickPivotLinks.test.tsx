/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickPivotLinks, type PivotLink } from '@/components/v1/QuickPivotLinks';

const mockLinks: PivotLink[] = [
  {
    id: 'wallet',
    label: 'Wallet Details',
    href: '/wallet/123',
    icon: '💰',
    badge: 5,
  },
  {
    id: 'contracts',
    label: 'Related Contracts',
    onClick: vi.fn(),
    badge: 12,
  },
  {
    id: 'transactions',
    label: 'Transaction History',
    href: '/transactions',
    external: true,
  },
  {
    id: 'disabled',
    label: 'Disabled Link',
    href: '/disabled',
    disabled: true,
  },
];

describe('QuickPivotLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Primary Success Path', () => {
    it('renders all links with correct labels and badges', () => {
      render(<QuickPivotLinks links={mockLinks} />);
      
      expect(screen.getByText('Wallet Details')).toBeInTheDocument();
      expect(screen.getByText('Related Contracts')).toBeInTheDocument();
      expect(screen.getByText('Transaction History')).toBeInTheDocument();
      expect(screen.getByText('Disabled Link')).toBeInTheDocument();
      
      // Check badges
      expect(screen.getByLabelText('5 items')).toBeInTheDocument();
      expect(screen.getByLabelText('12 items')).toBeInTheDocument();
    });

    it('handles click events correctly', () => {
      const mockOnClick = vi.fn();
      const linksWithClick = [
        { ...mockLinks[1], onClick: mockOnClick }
      ];
      
      render(<QuickPivotLinks links={linksWithClick} />);
      
      fireEvent.click(screen.getByText('Related Contracts'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('highlights active link when activeId is provided', () => {
      render(<QuickPivotLinks links={mockLinks} activeId="wallet" />);
      
      const activeLink = screen.getByTestId('quick-pivot-links-link-wallet');
      expect(activeLink).toHaveClass('quick-pivot-links__link--active');
      expect(activeLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Edge Cases and Fallback Behavior', () => {
    it('shows empty state when no links provided', () => {
      render(<QuickPivotLinks links={[]} />);
      
      expect(screen.getByTestId('quick-pivot-links-empty')).toBeInTheDocument();
      expect(screen.getByText('No related records available')).toBeInTheDocument();
    });

    it('shows custom empty message', () => {
      render(
        <QuickPivotLinks 
          links={[]} 
          emptyMessage="Custom empty message" 
        />
      );
      
      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(<QuickPivotLinks links={mockLinks} loading={true} />);
      
      expect(screen.getByTestId('quick-pivot-links-loading')).toBeInTheDocument();
      expect(screen.getAllByRole('status')).toHaveLength(1);
    });

    it('prevents click on disabled links', () => {
      const mockOnClick = vi.fn();
      const disabledLink: PivotLink = {
        id: 'disabled',
        label: 'Disabled',
        onClick: mockOnClick,
        disabled: true,
      };
      
      render(<QuickPivotLinks links={[disabledLink]} />);
      
      const link = screen.getByTestId('quick-pivot-links-link-disabled');
      fireEvent.click(link);
      
      expect(mockOnClick).not.toHaveBeenCalled();
      expect(link).toHaveAttribute('aria-disabled', 'true');
    });

    it('handles external links correctly', () => {
      render(<QuickPivotLinks links={mockLinks} />);
      
      const externalLink = screen.getByTestId('quick-pivot-links-link-transactions');
      expect(externalLink).toHaveAttribute('target', '_blank');
      expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(screen.getByText('↗')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<QuickPivotLinks links={mockLinks} />);
      
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Related records');
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      const mockOnClick = vi.fn();
      const linksWithClick = [
        { ...mockLinks[1], onClick: mockOnClick }
      ];
      
      render(<QuickPivotLinks links={linksWithClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout Variants', () => {
    it('applies correct CSS classes for orientation', () => {
      const { rerender } = render(
        <QuickPivotLinks links={mockLinks} orientation="vertical" />
      );
      
      expect(screen.getByTestId('quick-pivot-links')).toHaveClass('quick-pivot-links--vertical');
      
      rerender(<QuickPivotLinks links={mockLinks} orientation="horizontal" />);
      expect(screen.getByTestId('quick-pivot-links')).toHaveClass('quick-pivot-links--horizontal');
    });

    it('applies correct CSS classes for size', () => {
      const { rerender } = render(
        <QuickPivotLinks links={mockLinks} size="compact" />
      );
      
      expect(screen.getByTestId('quick-pivot-links')).toHaveClass('quick-pivot-links--compact');
      
      rerender(<QuickPivotLinks links={mockLinks} size="default" />);
      expect(screen.getByTestId('quick-pivot-links')).toHaveClass('quick-pivot-links--default');
    });
  });
});