import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BadgeCarousel, type ProfileBadge } from '../../../src/components/v1/BadgeCarousel';

describe('BadgeCarousel', () => {
  const mockBadges: ProfileBadge[] = [
    { id: 'b1', label: 'First Win', description: 'Won your first matchmaking duel', unlockedAt: '2026-05-10' },
    { id: 'b2', label: 'Stellar Whiz', description: 'Performed 50 contract reads', unlockedAt: '2026-05-15' },
    { id: 'b3', label: 'High Roller', description: 'Wagered over 500 XLM', unlockedAt: '2026-05-20' },
    { id: 'b4', label: 'Streak Master', description: 'Reached 7 days streak', unlockedAt: '2026-05-25' },
    { id: 'b5', label: 'Creator Fan', description: 'Bought a creator drop', unlockedAt: '2026-06-01' },
  ];

  const defaultProps = {
    badges: mockBadges,
    visibleCount: 3,
    onBadgeClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty message when no badges exist', () => {
    render(<BadgeCarousel badges={[]} />);
    expect(screen.getByText('No badges unlocked yet.')).toBeInTheDocument();
  });

  it('renders only up to visibleCount badges initially', () => {
    render(<BadgeCarousel {...defaultProps} />);

    // First 3 should be visible
    expect(screen.getByText('First Win')).toBeInTheDocument();
    expect(screen.getByText('Stellar Whiz')).toBeInTheDocument();
    expect(screen.getByText('High Roller')).toBeInTheDocument();

    // 4th and 5th should not be visible
    expect(screen.queryByText('Streak Master')).toBeNull();
    expect(screen.queryByText('Creator Fan')).toBeNull();
  });

  it('navigates next and prev slides correctly updating bounds', () => {
    render(<BadgeCarousel {...defaultProps} />);
    const prevBtn = screen.getByTestId('badge-carousel-prev-btn');
    const nextBtn = screen.getByTestId('badge-carousel-next-btn');

    // Prev disabled initially, Next is enabled
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Click Next
    fireEvent.click(nextBtn);

    // After click: idx 1 to 3 should be visible (Stellar Whiz, High Roller, Streak Master)
    expect(screen.queryByText('First Win')).toBeNull();
    expect(screen.getByText('Stellar Whiz')).toBeInTheDocument();
    expect(screen.getByText('High Roller')).toBeInTheDocument();
    expect(screen.getByText('Streak Master')).toBeInTheDocument();

    // Prev is now enabled
    expect(prevBtn).not.toBeDisabled();

    // Click Prev
    fireEvent.click(prevBtn);
    expect(screen.getByText('First Win')).toBeInTheDocument();
  });

  it('triggers onBadgeClick callback on click and enter keypress', () => {
    render(<BadgeCarousel {...defaultProps} />);
    const badge1 = screen.getByTestId('badge-carousel-badge-b1');

    // Click badge
    fireEvent.click(badge1);
    expect(defaultProps.onBadgeClick).toHaveBeenCalledWith(mockBadges[0]);

    // Keyboard trigger
    fireEvent.keyDown(badge1, { key: 'Enter', code: 'Enter' });
    expect(defaultProps.onBadgeClick).toHaveBeenCalledTimes(2);
  });
});
