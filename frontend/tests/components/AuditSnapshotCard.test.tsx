/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditSnapshotCard, type AuditSnapshot } from '@/components/v1/AuditSnapshotCard';

const mockAudit: AuditSnapshot = {
  id: 'audit-1',
  timestamp: '2024-01-15T10:30:00Z',
  action: 'User Login',
  actor: 'john.doe@example.com',
  status: 'success',
  target: 'user:123',
  details: {
    method: 'password',
    sessionId: 'sess_abc123',
  },
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    location: 'New York, US',
    duration: 250,
  },
};

describe('AuditSnapshotCard', () => {
  beforeEach(() => {
    // Mock Date for consistent timestamp formatting
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T11:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Primary Success Path', () => {
    it('renders audit information correctly', () => {
      render(<AuditSnapshotCard audit={mockAudit} />);
      
      expect(screen.getByText('User Login')).toBeInTheDocument();
      expect(screen.getByText('by john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Target:')).toBeInTheDocument();
      expect(screen.getByText('user:123')).toBeInTheDocument();
    });

    it('displays status pill with correct tone', () => {
      render(<AuditSnapshotCard audit={mockAudit} />);
      
      const statusPill = screen.getByTestId('audit-snapshot-card-status');
      expect(statusPill).toHaveAttribute('data-tone', 'success');
      expect(screen.getByText('success')).toBeInTheDocument();
    });

    it('shows relative time by default', () => {
      render(<AuditSnapshotCard audit={mockAudit} />);
      
      expect(screen.getByText('30m ago')).toBeInTheDocument();
    });

    it('handles click events when onClick is provided', () => {
      const mockOnClick = vi.fn();
      render(<AuditSnapshotCard audit={mockAudit} onClick={mockOnClick} />);
      
      fireEvent.click(screen.getByTestId('audit-snapshot-card'));
      expect(mockOnClick).toHaveBeenCalledWith(mockAudit);
    });
  });

  describe('Expandable Functionality', () => {
    it('shows expand toggle when expandable is true', () => {
      render(<AuditSnapshotCard audit={mockAudit} expandable={true} />);
      
      expect(screen.getByTestId('audit-snapshot-card-expand-toggle')).toBeInTheDocument();
      expect(screen.getByLabelText('Expand details')).toBeInTheDocument();
    });

    it('expands and shows details when toggle is clicked', () => {
      render(<AuditSnapshotCard audit={mockAudit} expandable={true} />);
      
      // Initially collapsed
      expect(screen.queryByText('Details')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('audit-snapshot-card-expand-toggle'));
      
      // Now expanded
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('method')).toBeInTheDocument();
      expect(screen.getByText('password')).toBeInTheDocument();
      expect(screen.getByText('Metadata')).toBeInTheDocument();
      expect(screen.getByText('IP Address')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    it('can be initially expanded with defaultExpanded', () => {
      render(
        <AuditSnapshotCard 
          audit={mockAudit} 
          expandable={true} 
          defaultExpanded={true} 
        />
      );
      
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByLabelText('Collapse details')).toBeInTheDocument();
    });

    it('prevents event bubbling when expand toggle is clicked', () => {
      const mockOnClick = vi.fn();
      render(
        <AuditSnapshotCard 
          audit={mockAudit} 
          expandable={true} 
          onClick={mockOnClick} 
        />
      );
      
      fireEvent.click(screen.getByTestId('audit-snapshot-card-expand-toggle'));
      
      // Card onClick should not be called
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Fallback Behavior', () => {
    it('handles audit without details or metadata', () => {
      const minimalAudit: AuditSnapshot = {
        id: 'audit-2',
        timestamp: '2024-01-15T10:30:00Z',
        action: 'Simple Action',
        actor: 'user',
        status: 'pending',
      };
      
      render(
        <AuditSnapshotCard 
          audit={minimalAudit} 
          expandable={true} 
          defaultExpanded={true} 
        />
      );
      
      // Should not show details section
      expect(screen.queryByText('Details')).not.toBeInTheDocument();
      expect(screen.queryByText('Metadata')).not.toBeInTheDocument();
    });

    it('truncates text in minimal variant', () => {
      const longAudit: AuditSnapshot = {
        ...mockAudit,
        action: 'This is a very long action name that should be truncated',
        actor: 'very.long.email.address@example.com',
      };
      
      render(<AuditSnapshotCard audit={longAudit} variant="minimal" />);
      
      // Should show truncated versions
      expect(screen.getByText('This is a very lo...')).toBeInTheDocument();
      expect(screen.getByText('by very.long.em...')).toBeInTheDocument();
    });

    it('hides target in minimal variant', () => {
      render(<AuditSnapshotCard audit={mockAudit} variant="minimal" />);
      
      expect(screen.queryByText('Target:')).not.toBeInTheDocument();
      expect(screen.queryByText('user:123')).not.toBeInTheDocument();
    });

    it('shows absolute time when showRelativeTime is false', () => {
      render(<AuditSnapshotCard audit={mockAudit} showRelativeTime={false} />);
      
      // Should show formatted date instead of relative time
      expect(screen.queryByText('30m ago')).not.toBeInTheDocument();
      // The exact format depends on locale, but should contain date/time info
      const timeElement = screen.getByRole('time');
      expect(timeElement).toHaveAttribute('dateTime', mockAudit.timestamp);
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<AuditSnapshotCard audit={mockAudit} />);
      
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('time')).toBeInTheDocument();
    });

    it('supports keyboard navigation when clickable', () => {
      const mockOnClick = vi.fn();
      render(<AuditSnapshotCard audit={mockAudit} onClick={mockOnClick} />);
      
      const card = screen.getByTestId('audit-snapshot-card');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('role', 'button');
      
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledWith(mockAudit);
      
      mockOnClick.mockClear();
      
      fireEvent.keyDown(card, { key: ' ' });
      expect(mockOnClick).toHaveBeenCalledWith(mockAudit);
    });

    it('supports keyboard navigation for expand toggle', () => {
      render(<AuditSnapshotCard audit={mockAudit} expandable={true} />);
      
      const card = screen.getByTestId('audit-snapshot-card');
      
      fireEvent.keyDown(card, { key: 'Enter' });
      
      // Should expand the card
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('has proper ARIA attributes for expandable state', () => {
      render(<AuditSnapshotCard audit={mockAudit} expandable={true} />);
      
      const card = screen.getByTestId('audit-snapshot-card');
      expect(card).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(screen.getByTestId('audit-snapshot-card-expand-toggle'));
      
      expect(card).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Variants', () => {
    it('applies correct CSS classes for variants', () => {
      const { rerender } = render(
        <AuditSnapshotCard audit={mockAudit} variant="minimal" />
      );
      
      expect(screen.getByTestId('audit-snapshot-card')).toHaveClass('audit-snapshot-card--minimal');
      
      rerender(<AuditSnapshotCard audit={mockAudit} variant="detailed" />);
      expect(screen.getByTestId('audit-snapshot-card')).toHaveClass('audit-snapshot-card--detailed');
    });

    it('applies clickable class when onClick is provided', () => {
      render(<AuditSnapshotCard audit={mockAudit} onClick={() => {}} />);
      
      expect(screen.getByTestId('audit-snapshot-card')).toHaveClass('audit-snapshot-card--clickable');
    });
  });
});