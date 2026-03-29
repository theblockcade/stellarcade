import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommandPalette, { commandStore } from '@/components/v1/CommandPalette';

const commands = [
  {
    id: 'cmd-1',
    label: 'Open Thing',
    description: 'Opens thing',
    action: vi.fn(),
  },
  {
    id: 'cmd-2',
    label: 'Close Thing',
    description: 'Closes thing',
    action: vi.fn(),
  },
];

describe('CommandPalette', () => {
  beforeEach(() => {
    localStorage.clear();
    commandStore.dispatch({ type: 'COMMAND_PALETTE_CLOSE' });
  });

  it('opens with keyboard shortcut and closes with escape', async () => {
    render(<CommandPalette commands={commands} />);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));

    await waitFor(() => {
      expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
    });
  });

  it('filters commands based on query', async () => {
    render(<CommandPalette commands={commands} />);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));

    await waitFor(() => {
      expect(screen.getByTestId('command-palette-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('command-palette-input');
    fireEvent.change(input, { target: { value: 'close' } });

    expect(screen.getByTestId('command-palette-item-cmd-2')).toBeInTheDocument();
    expect(screen.queryByTestId('command-palette-item-cmd-1')).not.toBeInTheDocument();
  });

  it('executes selected command via Enter', async () => {
    render(<CommandPalette commands={commands} />);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));

    await waitFor(() => {
      expect(screen.getByTestId('command-palette-input')).toBeInTheDocument();
    });

    const input = screen.getByTestId('command-palette-input');
    fireEvent.change(input, { target: { value: 'open' } });

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(commands[0].action).toHaveBeenCalled();
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
  });
});
