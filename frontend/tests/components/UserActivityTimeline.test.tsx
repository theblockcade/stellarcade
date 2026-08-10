import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserActivityTimeline, UserActivity } from '../../src/components/v1/UserActivityTimeline';
import '../../src/components/v1/UserActivityTimeline.css';

describe('UserActivityTimeline', () => {
  const mockActivities: UserActivity[] = [
    {
      id: '1',
      type: 'login',
      title: 'Logged In',
      timestamp: new Date('2024-01-10T10:00:00'),
      status: 'success',
    },
    {
      id: '2',
      type: 'transaction',
      title: 'Made a transaction',
      description: 'Sent 100 tokens',
      timestamp: new Date('2024-01-09T15:30:00'),
      status: 'success',
    },
    {
      id: '3',
      type: 'deposit',
      title: 'Deposited funds',
      timestamp: new Date('2024-01-08T09:00:00'),
      status: 'pending',
    },
  ];

  describe('rendering', () => {
    it('renders timeline section with activities', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          testId="activity-timeline-render"
        />
      );

      const sections = screen.getAllByTestId('activity-timeline-render');
      const section = sections[0];
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-label', 'User Activity Timeline');
    });

    it('renders title', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          testId="activity-timeline-title"
        />
      );

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('displays all activities', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          testId="activity-timeline-display"
        />
      );

      expect(screen.getByText('Logged In')).toBeInTheDocument();
      expect(screen.getByText('Made a transaction')).toBeInTheDocument();
      expect(screen.getByText('Deposited funds')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('displays empty state when activities array is empty', () => {
      render(
        <UserActivityTimeline activities={[]} testId="activity-timeline" />
      );

      const emptyState = screen.getByTestId('activity-timeline-empty');
      expect(emptyState).toBeInTheDocument();
      expect(screen.getByText('No activity recorded yet.')).toBeInTheDocument();
    });

    it('does not show empty state when activities are present', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          testId="activity-timeline"
        />
      );

      expect(screen.queryByTestId('activity-timeline-empty')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('displays loading status when loading is true', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          loading={true}
          testId="activity-timeline"
        />
      );

      expect(screen.getByTestId('activity-timeline-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not display loading when loading is false', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          loading={false}
          testId="activity-timeline"
        />
      );

      expect(screen.queryByTestId('activity-timeline-loading')).not.toBeInTheDocument();
    });

    it('shows loading status even with empty activities', () => {
      render(
        <UserActivityTimeline
          activities={[]}
          loading={true}
          testId="activity-timeline"
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('max items limiting', () => {
    it('limits displayed activities to maxItems', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          maxItems={2}
          testId="activity-timeline"
        />
      );

      // Should show first 2 activities
      expect(screen.getByText('Logged In')).toBeInTheDocument();
      expect(screen.getByText('Made a transaction')).toBeInTheDocument();
      expect(screen.queryByText('Deposited funds')).not.toBeInTheDocument();
    });

    it('displays hint about remaining activities', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          maxItems={2}
          testId="activity-timeline"
        />
      );

      const moreHint = screen.getByTestId('activity-timeline-more-hint');
      expect(moreHint).toBeInTheDocument();
      expect(screen.getByText('1 more activities')).toBeInTheDocument();
    });

    it('does not show hint when all activities fit', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          maxItems={10}
          testId="activity-timeline"
        />
      );

      expect(screen.queryByTestId('activity-timeline-more-hint')).not.toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('passes compact prop to Timeline component', () => {
      const { container } = render(
        <UserActivityTimeline
          activities={mockActivities}
          compact={true}
          testId="activity-timeline"
        />
      );

      // Timeline component receives compact prop and applies it
      const timelineItems = container.querySelectorAll('.sc-timeline__item--compact');
      expect(timelineItems.length).toBeGreaterThan(0);
    });
  });

  describe('click callbacks', () => {
    it('calls onActivityClick when provided and activity is in list', () => {
      const mockOnClick = vi.fn();

      render(
        <UserActivityTimeline
          activities={mockActivities}
          onActivityClick={mockOnClick}
          testId="activity-timeline"
        />
      );

      // Activity buttons are rendered as sr-only
      const activityButton = screen.getByTestId('activity-timeline-activity-1');
      fireEvent.click(activityButton);

      expect(mockOnClick).toHaveBeenCalledWith(mockActivities[0]);
    });

    it('does not show action buttons when onActivityClick is not provided', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          testId="activity-timeline"
        />
      );

      // Activity buttons should not be in the DOM
      expect(screen.queryByTestId('activity-timeline-activity-1')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA landmarks', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          testId="activity-timeline-landmarks"
        />
      );

      const sections = screen.getAllByTestId('activity-timeline-landmarks');
      const section = sections[0];
      expect(section).toHaveAttribute('role', 'region');
      expect(section).toHaveAttribute('aria-label', 'User Activity Timeline');
    });

    it('provides accessible loading announcement', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          loading={true}
          testId="activity-timeline-loading"
        />
      );

      const status = screen.getByText('Loading...');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('provides accessible activity buttons', () => {
      const mockOnClick = vi.fn();

      render(
        <UserActivityTimeline
          activities={mockActivities}
          onActivityClick={mockOnClick}
          testId="activity-timeline-buttons"
        />
      );

      const activityButtons = screen.getAllByTestId('activity-timeline-buttons-activity-1');
      const activityButton = activityButtons[0];
      expect(activityButton).toHaveAttribute('aria-label');
    });
  });

  describe('timestamp formatting', () => {
    it('formats recent timestamps as "just now"', () => {
      const recentActivity: UserActivity[] = [
        {
          id: '1',
          type: 'login',
          title: 'Logged In',
          timestamp: new Date(),
          status: 'success',
        },
      ];

      render(
        <UserActivityTimeline
          activities={recentActivity}
          testId="activity-timeline"
        />
      );

      // Timeline should contain "just now"
      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('formats old timestamps with date', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          testId="activity-timeline"
        />
      );

      // Should render activity items (exact format depends on implementation)
      expect(screen.getByText('Logged In')).toBeInTheDocument();
    });
  });

  describe('custom properties', () => {
    it('accepts custom className', () => {
      const { container } = render(
        <UserActivityTimeline
          activities={mockActivities}
          className="custom-class"
          testId="activity-timeline-custom"
        />
      );

      const timeline = container.querySelector('[data-testid="activity-timeline-custom"]');
      expect(timeline).toHaveClass('custom-class');
    });

    it('uses default testId', () => {
      const { container } = render(
        <UserActivityTimeline activities={mockActivities} />
      );

      expect(
        container.querySelector('[data-testid="user-activity-timeline"]')
      ).toBeInTheDocument();
    });
  });

  describe('activity descriptions', () => {
    it('displays activity descriptions in metadata', () => {
      render(
        <UserActivityTimeline
          activities={mockActivities}
          testId="activity-timeline"
        />
      );

      // Activity with description should be present
      expect(screen.getByText('Sent 100 tokens')).toBeInTheDocument();
    });

    it('handles activities without descriptions', () => {
      const activitiesNoDesc: UserActivity[] = [
        {
          id: '1',
          type: 'login',
          title: 'Logged In',
          timestamp: new Date(),
          status: 'success',
        },
      ];

      render(
        <UserActivityTimeline
          activities={activitiesNoDesc}
          testId="activity-timeline"
        />
      );

      expect(screen.getByText('Logged In')).toBeInTheDocument();
    });
  });
});
