import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsPanel } from '../../../src/components/v1/SettingsPanel';

describe('SettingsPanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Account Settings',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SettingsPanel {...defaultProps} isOpen={false}>
        <div>Settings Content</div>
      </SettingsPanel>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title and children when open', () => {
    render(
      <SettingsPanel {...defaultProps}>
        <div data-testid="test-content">Settings Content</div>
      </SettingsPanel>
    );

    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('triggers onClose when close button is clicked', () => {
    render(<SettingsPanel {...defaultProps} />);
    const closeBtn = screen.getByTestId('settings-panel-close-btn');

    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when backdrop is clicked', () => {
    render(<SettingsPanel {...defaultProps} />);
    const backdrop = screen.getByTestId('settings-panel-backdrop');

    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onClose when panel itself is clicked', () => {
    render(<SettingsPanel {...defaultProps} />);
    const panel = screen.getByTestId('settings-panel');

    fireEvent.click(panel);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('triggers onClose when Escape key is pressed', () => {
    render(<SettingsPanel {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('auto-focuses the close button on mount', () => {
    render(<SettingsPanel {...defaultProps} />);
    const closeBtn = screen.getByTestId('settings-panel-close-btn');
    expect(closeBtn).toHaveFocus();
  });
});
