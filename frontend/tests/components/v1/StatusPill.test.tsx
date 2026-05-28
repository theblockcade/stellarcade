import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusPill } from '../../../src/components/v1/StatusPill';

describe('StatusPill', () => {
  it('renders the requested label and tone', () => {
    render(<StatusPill tone="success" label="Connected" />);
    expect(screen.getByTestId('status-pill')).toHaveTextContent('Connected');
    expect(screen.getByTestId('status-pill')).toHaveAttribute('data-tone', 'success');
  });

  it('renders icon content when provided', () => {
    render(<StatusPill tone="pending" label="Pending" icon={<span>i</span>} />);
    expect(screen.getByText('i')).toBeInTheDocument();
  });

  it('falls back to neutral tone for unknown status values', () => {
    render(<StatusPill tone={'mystery' as never} label="Unknown" />);
    expect(screen.getByTestId('status-pill')).toHaveAttribute('data-tone', 'neutral');
  });

  it('uses accessible labels when supplied', () => {
    render(<StatusPill tone="warning" label="Needs review" ariaLabel="Queue status: needs review" />);
    expect(screen.getByLabelText('Queue status: needs review')).toBeInTheDocument();
  });

  it('supports compact sizing', () => {
    render(<StatusPill tone="error" label="Failed" size="compact" />);
    expect(screen.getByTestId('status-pill')).toHaveClass('status-pill--compact');
  });
});
