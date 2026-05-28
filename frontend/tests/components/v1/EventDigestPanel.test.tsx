import { render, screen, fireEvent } from '@testing-library/react';
import { EventDigestPanel } from '@/components/v1/EventDigestPanel';
import type { DigestEvent } from '@/components/v1/EventDigestPanel';

function makeEvent(overrides: Partial<DigestEvent> = {}): DigestEvent {
  const id = overrides.id ?? `evt-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    type: 'coin_flip',
    contractId: 'CAAABBBCCC',
    timestamp: new Date('2025-06-01T14:00:00Z').toISOString(),
    summary: 'Bet placed for 10 XLM',
    severity: 'info',
    ...overrides,
  };
}

describe('EventDigestPanel', () => {
  // ── Loading state ──────────────────────────────────────────────────────────

  it('shows loading skeletons when status is loading', () => {
    render(<EventDigestPanel events={[]} status="loading" testId="edp" />);

    expect(screen.getByTestId('edp-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('edp-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edp-empty')).not.toBeInTheDocument();
  });

  it('sets aria-busy while loading', () => {
    render(<EventDigestPanel events={[]} status="loading" testId="edp" />);

    expect(screen.getByTestId('edp')).toHaveAttribute('aria-busy', 'true');
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it('shows empty message when success with no events', () => {
    render(<EventDigestPanel events={[]} status="success" testId="edp" />);

    expect(screen.getByTestId('edp-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('edp-list')).not.toBeInTheDocument();
  });

  // ── Error state ────────────────────────────────────────────────────────────

  it('shows error region with message', () => {
    render(
      <EventDigestPanel
        events={[]}
        status="error"
        error="RPC connection lost"
        testId="edp"
      />,
    );

    expect(screen.getByTestId('edp-error')).toHaveTextContent('RPC connection lost');
    expect(screen.queryByTestId('edp-list')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(
      <EventDigestPanel
        events={[]}
        status="error"
        error="Failed"
        onRetry={onRetry}
        testId="edp"
      />,
    );

    fireEvent.click(screen.getByTestId('edp-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<EventDigestPanel events={[]} status="error" testId="edp" />);

    expect(screen.queryByTestId('edp-retry')).not.toBeInTheDocument();
  });

  // ── Success state ──────────────────────────────────────────────────────────

  it('renders event rows for each event', () => {
    const events = [
      makeEvent({ id: 'e1', type: 'bet_placed' }),
      makeEvent({ id: 'e2', type: 'win' }),
    ];
    render(<EventDigestPanel events={events} status="success" testId="edp" />);

    expect(screen.getByTestId('edp-row-e1')).toBeInTheDocument();
    expect(screen.getByTestId('edp-row-e2')).toBeInTheDocument();
  });

  it('renders event type pills', () => {
    const events = [makeEvent({ id: 'e1', type: 'transfer' })];
    render(<EventDigestPanel events={events} status="success" testId="edp" />);

    expect(screen.getByTestId('edp-pill-e1')).toHaveTextContent('transfer');
  });

  // ── maxItems ───────────────────────────────────────────────────────────────

  it('caps visible events at maxItems', () => {
    const events = Array.from({ length: 10 }, (_, i) => makeEvent({ id: `e${i}` }));
    render(<EventDigestPanel events={events} status="success" maxItems={4} testId="edp" />);

    const list = screen.getByTestId('edp-list');
    expect(list.querySelectorAll('.edp__row')).toHaveLength(4);
  });

  it('shows overflow notice when events exceed maxItems', () => {
    const events = Array.from({ length: 8 }, (_, i) => makeEvent({ id: `e${i}` }));
    render(<EventDigestPanel events={events} status="success" maxItems={4} testId="edp" />);

    expect(screen.getByTestId('edp-overflow')).toHaveTextContent('Showing 4 of 8');
  });

  it('does not show overflow notice when all events fit', () => {
    const events = Array.from({ length: 3 }, (_, i) => makeEvent({ id: `e${i}` }));
    render(<EventDigestPanel events={events} status="success" maxItems={10} testId="edp" />);

    expect(screen.queryByTestId('edp-overflow')).not.toBeInTheDocument();
  });

  // ── Clear all ──────────────────────────────────────────────────────────────

  it('shows clear-all button when onClearAll is provided and there are events', () => {
    const events = [makeEvent({ id: 'e1' })];
    render(
      <EventDigestPanel
        events={events}
        status="success"
        onClearAll={vi.fn()}
        testId="edp"
      />,
    );

    expect(screen.getByTestId('edp-clear')).toBeInTheDocument();
  });

  it('calls onClearAll when clear button is clicked', () => {
    const onClearAll = vi.fn();
    const events = [makeEvent({ id: 'e1' })];
    render(
      <EventDigestPanel
        events={events}
        status="success"
        onClearAll={onClearAll}
        testId="edp"
      />,
    );

    fireEvent.click(screen.getByTestId('edp-clear'));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it('hides clear-all when events array is empty', () => {
    render(
      <EventDigestPanel
        events={[]}
        status="success"
        onClearAll={vi.fn()}
        testId="edp"
      />,
    );

    expect(screen.queryByTestId('edp-clear')).not.toBeInTheDocument();
  });

  // ── Title ──────────────────────────────────────────────────────────────────

  it('renders a custom title', () => {
    render(
      <EventDigestPanel events={[]} status="success" title="Contract Feed" testId="edp" />,
    );

    expect(screen.getByRole('heading', { name: 'Contract Feed' })).toBeInTheDocument();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('has a live region for new-event announcements', () => {
    render(<EventDigestPanel events={[]} status="success" testId="edp" />);

    expect(screen.getByTestId('edp-live')).toBeInTheDocument();
  });
});
