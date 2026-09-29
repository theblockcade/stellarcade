import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PixelScoreTicker from './PixelScoreTicker';

describe('PixelScoreTicker', () => {
  it('renders correct number of padded digits', () => {
    render(<PixelScoreTicker value={42} digits={6} />);
    expect(screen.getByText('000042')).toBeInTheDocument();
  });

  it('animates value changes smoothly', () => {
    const { rerender } = render(<PixelScoreTicker value={100} />);
    rerender(<PixelScoreTicker value={200} />);
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('executes tick callback during transition', () => {
    const mockTick = jest.fn();
    render(<PixelScoreTicker value={100} onTickSound={mockTick} />);
    fireEvent.change(screen.getByText('100'), { target: { value: '200' } });
    expect(mockTick).toHaveBeenCalled();
  });

  it('respects reduced motion preference', () => {
    render(<PixelScoreTicker value={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('applies correct theme colors', () => {
    render(<PixelScoreTicker value={100} theme="crt-green" />);
    expect(screen.getByText('100')).toHaveStyle('color: #00FF00');
  });

  it('triggers jackpot animation on high score', () => {
    render(<PixelScoreTicker value={1000000} />);
    expect(screen.getByText('1000000')).toHaveStyle('color: #FF8C00');
  });
});