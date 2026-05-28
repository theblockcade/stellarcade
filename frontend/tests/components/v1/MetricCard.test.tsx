import { render, screen, fireEvent } from '@testing-library/react';
import { MetricCard } from '@/components/v1/MetricCard';

describe('MetricCard', () => {
  // ── Basic rendering ────────────────────────────────────────────────────────

  it('renders label and value in success state', () => {
    render(<MetricCard label="Total Bets" value="1,042" testId="mc" />);

    expect(screen.getByTestId('mc-label')).toHaveTextContent('Total Bets');
    expect(screen.getByTestId('mc-value')).toHaveTextContent('1,042');
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('renders loading skeleton and sets aria-busy when status is loading', () => {
    render(<MetricCard label="Revenue" status="loading" testId="mc" />);

    expect(screen.getByTestId('mc')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('mc-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('mc-value')).not.toBeInTheDocument();
  });

  it('does not render the value region while loading', () => {
    render(<MetricCard label="Revenue" value="999" status="loading" testId="mc" />);

    expect(screen.queryByTestId('mc-body')).not.toBeInTheDocument();
  });

  // ── Error state ────────────────────────────────────────────────────────────

  it('renders error region with message', () => {
    render(
      <MetricCard
        label="Revenue"
        status="error"
        error="Network timeout"
        testId="mc"
      />,
    );

    expect(screen.getByTestId('mc-error')).toBeInTheDocument();
    expect(screen.getByTestId('mc-error')).toHaveTextContent('Network timeout');
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(
      <MetricCard
        label="Revenue"
        status="error"
        error="Fetch failed"
        onRetry={onRetry}
        testId="mc"
      />,
    );

    fireEvent.click(screen.getByTestId('mc-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render a retry button when onRetry is not provided', () => {
    render(<MetricCard label="Revenue" status="error" testId="mc" />);

    expect(screen.queryByTestId('mc-retry')).not.toBeInTheDocument();
  });

  // ── Empty / missing data ───────────────────────────────────────────────────

  it('renders empty dash when value is undefined in success state', () => {
    render(<MetricCard label="Active Games" status="success" testId="mc" />);

    expect(screen.getByTestId('mc-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('mc-body')).not.toBeInTheDocument();
  });

  it('renders empty dash when value is empty string', () => {
    render(<MetricCard label="Active Games" value="" status="success" testId="mc" />);

    expect(screen.getByTestId('mc-empty')).toBeInTheDocument();
  });

  // ── Trend / change indicator ───────────────────────────────────────────────

  it('renders trend chip with change text when both are provided', () => {
    render(
      <MetricCard
        label="Revenue"
        value="$4,200"
        change="+12%"
        trend="up"
        testId="mc"
      />,
    );

    const body = screen.getByTestId('mc-body');
    expect(body).toHaveTextContent('+12%');
    const trend = body.querySelector('.mc__trend');
    expect(trend).toHaveClass('mc__trend--up');
  });

  it('does not render trend chip when change is not provided', () => {
    render(<MetricCard label="Revenue" value="$4,200" testId="mc" />);

    expect(screen.getByTestId('mc-body').querySelector('.mc__trend')).not.toBeInTheDocument();
  });

  // ── Caption ────────────────────────────────────────────────────────────────

  it('renders caption when provided', () => {
    render(
      <MetricCard label="Revenue" value="$4,200" caption="Last 30 days" testId="mc" />,
    );

    expect(screen.getByTestId('mc-caption')).toHaveTextContent('Last 30 days');
  });

  it('does not render caption while loading', () => {
    render(
      <MetricCard label="Revenue" status="loading" caption="Last 30 days" testId="mc" />,
    );

    expect(screen.queryByTestId('mc-caption')).not.toBeInTheDocument();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('uses label as aria-label when ariaLabel prop is not provided', () => {
    render(<MetricCard label="Win Rate" value="73%" testId="mc" />);

    expect(screen.getByTestId('mc')).toHaveAttribute('aria-label', 'Win Rate');
  });

  it('prefers explicit ariaLabel over label', () => {
    render(
      <MetricCard
        label="Win Rate"
        value="73%"
        ariaLabel="Win rate metric card"
        testId="mc"
      />,
    );

    expect(screen.getByTestId('mc')).toHaveAttribute('aria-label', 'Win rate metric card');
  });

  // ── Idle state ─────────────────────────────────────────────────────────────

  it('renders the body slot (not empty dash) when status is idle with no value', () => {
    render(<MetricCard label="Revenue" status="idle" testId="mc" />);

    // idle falls through to the value region; empty dash is only for status=success + no value
    expect(screen.getByTestId('mc-body')).toBeInTheDocument();
    expect(screen.queryByTestId('mc-empty')).not.toBeInTheDocument();
  });
});
