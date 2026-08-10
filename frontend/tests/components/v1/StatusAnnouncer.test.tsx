import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { useState } from 'react';
import { StatusAnnouncer, useStatusAnnouncer } from '../../../src/components/v1/StatusAnnouncer';

describe('StatusAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a visually-hidden live region', () => {
    render(<StatusAnnouncer />);
    const region = screen.getByTestId('status-announcer');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
  });

  it('uses assertive politeness when specified', () => {
    render(<StatusAnnouncer politeness="assertive" />);
    expect(screen.getByTestId('status-announcer')).toHaveAttribute('aria-live', 'assertive');
  });

  it('announces a message after the debounce delay', async () => {
    render(<StatusAnnouncer message="Save complete" />);
    const region = screen.getByTestId('status-announcer');
    expect(region).toHaveTextContent('');
    act(() => { vi.advanceTimersByTime(60); });
    expect(region).toHaveTextContent('Save complete');
  });

  it('re-announces the same message when the prop changes away then back', () => {
    const { rerender } = render(<StatusAnnouncer message="Loading" />);
    act(() => { vi.advanceTimersByTime(60); });
    expect(screen.getByTestId('status-announcer')).toHaveTextContent('Loading');

    rerender(<StatusAnnouncer message="" />);
    act(() => { vi.advanceTimersByTime(60); });
    expect(screen.getByTestId('status-announcer')).toHaveTextContent('');

    rerender(<StatusAnnouncer message="Loading" />);
    act(() => { vi.advanceTimersByTime(60); });
    expect(screen.getByTestId('status-announcer')).toHaveTextContent('Loading');
  });

  it('clears the message automatically after clearAfterMs', () => {
    render(<StatusAnnouncer message="Done" clearAfterMs={1000} />);
    act(() => { vi.advanceTimersByTime(60); });
    expect(screen.getByTestId('status-announcer')).toHaveTextContent('Done');
    act(() => { vi.advanceTimersByTime(1100); });
    expect(screen.getByTestId('status-announcer')).toHaveTextContent('');
  });

  it('renders empty without crashing in zero-message state', () => {
    render(<StatusAnnouncer />);
    expect(screen.getByTestId('status-announcer')).toBeInTheDocument();
    expect(screen.getByTestId('status-announcer')).toHaveTextContent('');
  });
});

describe('useStatusAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function HookHarness() {
    const { message, politeness, announce, clear } = useStatusAnnouncer();
    return (
      <>
        <div aria-live={politeness} data-testid="live-region">{message}</div>
        <button onClick={() => announce('Transaction sent')}>announce</button>
        <button onClick={() => announce('Error', 'assertive')}>assertive</button>
        <button onClick={clear}>clear</button>
      </>
    );
  }

  it('announces a message and populates the live region', () => {
    render(<HookHarness />);
    act(() => { screen.getByText('announce').click(); });
    act(() => { vi.advanceTimersByTime(60); });
    expect(screen.getByTestId('live-region')).toHaveTextContent('Transaction sent');
  });

  it('switches to assertive politeness', () => {
    render(<HookHarness />);
    act(() => { screen.getByText('assertive').click(); });
    expect(screen.getByTestId('live-region')).toHaveAttribute('aria-live', 'assertive');
  });

  it('clear empties the live region', () => {
    render(<HookHarness />);
    act(() => { screen.getByText('announce').click(); });
    act(() => { vi.advanceTimersByTime(60); });
    expect(screen.getByTestId('live-region')).toHaveTextContent('Transaction sent');
    act(() => { screen.getByText('clear').click(); });
    expect(screen.getByTestId('live-region')).toHaveTextContent('');
  });
});
