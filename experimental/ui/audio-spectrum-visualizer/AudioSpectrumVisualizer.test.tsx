import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { AudioSpectrumVisualizer } from './AudioSpectrumVisualizer';

afterEach(cleanup);

const getAllBars = (): HTMLElement[] => {
  return screen.getAllByTestId(/audio-spectrum-visualizer-bar-/);
};

describe('AudioSpectrumVisualizer', () => {
  it('renders the specified number of frequency bars', () => {
    render(<AudioSpectrumVisualizer isPlaying={false} barCount={32} />);

    expect(getAllBars()).toHaveLength(32);
  });

  it('renders 16 bars by default', () => {
    render(<AudioSpectrumVisualizer isPlaying={false} />);

    expect(getAllBars()).toHaveLength(16);
  });

  it('renders 8 bars when barCount is 8', () => {
    render(<AudioSpectrumVisualizer isPlaying={false} barCount={8} />);

    expect(getAllBars()).toHaveLength(8);
  });

  it('falls back to 16 bars for unsupported counts', () => {
    render(<AudioSpectrumVisualizer isPlaying={false} barCount={10} />);

    expect(getAllBars()).toHaveLength(16);
  });

  it('suppresses bar heights when muted', () => {
    render(<AudioSpectrumVisualizer isPlaying isMuted />);

    const barsContainer = screen.getByTestId('audio-spectrum-visualizer-bars');
    expect(barsContainer).toHaveAttribute('data-muted', 'true');

    const bars = getAllBars();
    expect(bars.length).toBeGreaterThan(0);
    bars.forEach((bar) => {
      expect(bar).toHaveAttribute('data-height', '0');
      expect(bar).toHaveClass('audio-spectrum-visualizer__bar--flat');
    });
  });

  it('flatlines peaks when muted', () => {
    render(<AudioSpectrumVisualizer isPlaying isMuted barCount={8} />);

    screen
      .getAllByTestId(/audio-spectrum-visualizer-peak-/)
      .forEach((peak) => {
        expect(peak).toHaveStyle({ height: '0%' });
      });
  });

  it('halts the animation loop cleanly when paused', async () => {
    const raf = vi.fn(() => 1);
    const caf = vi.fn();
    Object.defineProperty(globalThis, 'requestAnimationFrame', {
      configurable: true,
      value: raf,
    });
    Object.defineProperty(globalThis, 'cancelAnimationFrame', {
      configurable: true,
      value: caf,
    });

    try {
      const { rerender } = render(
        <AudioSpectrumVisualizer isPlaying barCount={8} />,
      );

      expect(
        screen.getByTestId('audio-spectrum-visualizer-bars'),
      ).toHaveAttribute('data-animating', 'true');
      expect(raf).toHaveBeenCalled();
      const scheduledWhilePlaying = raf.mock.calls.length;

      rerender(<AudioSpectrumVisualizer isPlaying={false} barCount={8} />);

      expect(
        screen.getByTestId('audio-spectrum-visualizer-bars'),
      ).toHaveAttribute('data-animating', 'false');
      expect(caf).toHaveBeenCalled();

      await waitFor(() => {
        getAllBars().forEach((bar) => {
          expect(bar).toHaveAttribute('data-height', '0');
        });
      });

      expect(raf.mock.calls.length).toBe(scheduledWhilePlaying);
    } finally {
      // @ts-expect-error restoring test-only stubs
      delete globalThis.requestAnimationFrame;
      // @ts-expect-error restoring test-only stubs
      delete globalThis.cancelAnimationFrame;
    }
  });

  it('does not schedule animation frames when initially paused', () => {
    const raf = vi.fn(() => 1);
    Object.defineProperty(globalThis, 'requestAnimationFrame', {
      configurable: true,
      value: raf,
    });

    try {
      render(<AudioSpectrumVisualizer isPlaying={false} />);
      expect(raf).not.toHaveBeenCalled();
      getAllBars().forEach((bar) => {
        expect(bar).toHaveAttribute('data-height', '0');
      });
    } finally {
      // @ts-expect-error restoring test-only stubs
      delete globalThis.requestAnimationFrame;
    }
  });

  it('marks the decorative visualizer as aria-hidden and provides a text alternative', () => {
    render(<AudioSpectrumVisualizer isPlaying={false} />);

    expect(screen.getByTestId('audio-spectrum-visualizer-bars')).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    const srText = screen
      .getByTestId('audio-spectrum-visualizer')
      .querySelector('.audio-spectrum-visualizer__sr-text') as HTMLElement;
    expect(srText).toHaveAttribute('role', 'status');
    expect(srText).toHaveAttribute('aria-live', 'polite');
  });

  it('applies the configured theme class', () => {
    const { rerender } = render(
      <AudioSpectrumVisualizer isPlaying={false} theme="phosphor" />,
    );
    expect(screen.getByTestId('audio-spectrum-visualizer-bars')).toHaveClass(
      'audio-spectrum-visualizer__bars--theme-phosphor',
    );

    rerender(<AudioSpectrumVisualizer isPlaying={false} theme="synthwave" />);
    expect(screen.getByTestId('audio-spectrum-visualizer-bars')).toHaveClass(
      'audio-spectrum-visualizer__bars--theme-synthwave',
    );
  });
});