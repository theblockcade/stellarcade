import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tooltip } from '../../../src/components/v1/Tooltip';

describe('Tooltip', () => {
  const defaultProps = {
    content: 'Helper info text',
    position: 'top' as const,
    delayMs: 0, // Disable delay for synchronous test validation
  };

  it('does not display tooltip bubble initially', () => {
    render(
      <Tooltip {...defaultProps}>
        <button type="button">Hover me</button>
      </Tooltip>
    );

    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('displays tooltip on hover (mouseenter) and hides on leave (mouseleave)', () => {
    render(
      <Tooltip {...defaultProps}>
        <button type="button">Hover me</button>
      </Tooltip>
    );

    const button = screen.getByRole('button', { name: /hover me/i });

    // Hover in
    fireEvent.mouseEnter(button);
    const bubble = screen.getByRole('tooltip');
    expect(bubble).toBeInTheDocument();
    expect(bubble).toHaveTextContent('Helper info text');
    expect(button).toHaveAttribute('aria-describedby', bubble.id);

    // Hover out
    fireEvent.mouseLeave(button);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('displays tooltip on focus and hides on blur', () => {
    render(
      <Tooltip {...defaultProps}>
        <button type="button">Focus me</button>
      </Tooltip>
    );

    const button = screen.getByRole('button', { name: /focus me/i });

    // Focus in
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    // Blur out
    fireEvent.blur(button);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
