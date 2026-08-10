import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextDivider } from '../../../src/components/v1/TextDivider';

describe('TextDivider', () => {
  it('renders a simple divider without content', () => {
    const { container } = render(<TextDivider />);
    const divider = screen.getByTestId('text-divider');
    expect(divider).toBeInTheDocument();
    expect(divider).toHaveClass('text-divider--no-content');
    expect(container.querySelector('.text-divider__content')).toBeNull();
  });

  it('renders a label and a badge', () => {
    render(<TextDivider label="Match Details" badge="New" />);
    expect(screen.getByText('Match Details')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByTestId('text-divider')).toHaveClass('text-divider--with-content');
  });

  it('handles left, right, and center alignments', () => {
    const { rerender } = render(<TextDivider label="Left" alignment="left" />);
    expect(screen.getByTestId('text-divider')).toHaveClass('text-divider--align-left');

    rerender(<TextDivider label="Right" alignment="right" />);
    expect(screen.getByTestId('text-divider')).toHaveClass('text-divider--align-right');

    rerender(<TextDivider label="Center" alignment="center" />);
    expect(screen.getByTestId('text-divider')).toHaveClass('text-divider--align-center');
  });

  it('applies variant and thickness classes', () => {
    render(<TextDivider label="Styled" variant="dashed" thickness="thick" />);
    const divider = screen.getByTestId('text-divider');
    expect(divider).toHaveClass('text-divider--variant-dashed');
    expect(divider).toHaveClass('text-divider--thickness-thick');
  });
});
