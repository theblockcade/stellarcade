import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueueStatusOverlay } from '../../../src/components/v1/QueueStatusOverlay';

describe('QueueStatusOverlay', () => {
  const defaultProps = {
    isOpen: true,
    queueName: 'Ranked Matchmaking',
    durationSeconds: 95, // 01:35
    estimatedWaitSeconds: 120, // 02:00
    playersInQueue: 3,
    playersNeeded: 4,
    statusText: 'Searching for opponents...',
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<QueueStatusOverlay {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all queue details, status text, and formatted time', () => {
    render(<QueueStatusOverlay {...defaultProps} />);
    expect(screen.getByText('Ranked Matchmaking')).toBeInTheDocument();
    expect(screen.getByText('Searching for opponents...')).toBeInTheDocument();
    // 95 seconds = 01:35
    expect(screen.getByText('01:35')).toBeInTheDocument();
    // 120 seconds = 02:00
    expect(screen.getByText('02:00')).toBeInTheDocument();
  });

  it('shows and updates players progress bar', () => {
    render(<QueueStatusOverlay {...defaultProps} />);
    expect(screen.getByText('3 / 4')).toBeInTheDocument();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '3');
    expect(progressbar).toHaveAttribute('aria-valuemax', '4');
    expect(progressbar).toHaveStyle({ width: '75%' });
  });

  it('calls onCancel when Cancel Search is clicked', () => {
    render(<QueueStatusOverlay {...defaultProps} />);
    const cancelBtn = screen.getByRole('button', { name: /cancel matchmaking/i });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed', () => {
    render(<QueueStatusOverlay {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('sets keyboard focus to the cancel button on mount', () => {
    render(<QueueStatusOverlay {...defaultProps} />);
    const cancelBtn = screen.getByRole('button', { name: /cancel matchmaking/i });
    expect(cancelBtn).toHaveFocus();
  });
});
