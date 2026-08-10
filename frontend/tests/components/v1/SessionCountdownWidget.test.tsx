import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SessionCountdownWidget } from '@/components/v1/SessionCountdownWidget';

describe('SessionCountdownWidget', () => {
  it('renders a compact countdown label', () => {
    render(<SessionCountdownWidget remainingMs={90_000} />);

    expect(screen.getByTestId('session-countdown-widget')).toHaveTextContent('1m 30s');
  });

  it('switches to warning styling near expiry', () => {
    render(<SessionCountdownWidget remainingMs={45_000} warnBeforeExpiryMs={60_000} />);

    expect(screen.getByTestId('session-countdown-widget')).toHaveClass('session-countdown-widget--warning');
  });

  it('returns nothing when remaining time is unavailable', () => {
    const { container } = render(<SessionCountdownWidget remainingMs={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
