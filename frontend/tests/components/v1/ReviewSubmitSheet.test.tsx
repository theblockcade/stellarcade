import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewSubmitSheet } from '@/components/v1/ReviewSubmitSheet';
import type { ReviewField } from '@/components/v1/ReviewSubmitSheet';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: 'Withdraw Prize Pool',
};

function renderSheet(props: Partial<typeof defaultProps> & Record<string, unknown> = {}) {
  return render(<ReviewSubmitSheet {...defaultProps} {...props} />);
}

describe('ReviewSubmitSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Visibility ─────────────────────────────────────────────────────────────

  it('renders nothing when open is false', () => {
    const { container } = render(
      <ReviewSubmitSheet
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Withdraw"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the sheet when open is true', () => {
    renderSheet();

    expect(screen.getByTestId('review-submit-sheet')).toBeInTheDocument();
  });

  // ── Title + description ────────────────────────────────────────────────────

  it('renders the title', () => {
    renderSheet({ title: 'Burn Tokens' });

    expect(screen.getByTestId('review-submit-sheet-title')).toHaveTextContent('Burn Tokens');
  });

  it('renders the description when provided', () => {
    renderSheet({ description: 'This action cannot be undone.' });

    expect(screen.getByTestId('review-submit-sheet-description')).toHaveTextContent(
      'This action cannot be undone.',
    );
  });

  it('does not render description element when prop is omitted', () => {
    renderSheet();

    expect(screen.queryByTestId('review-submit-sheet-description')).not.toBeInTheDocument();
  });

  // ── Risk badge ─────────────────────────────────────────────────────────────

  it('shows the correct risk badge text for each level', () => {
    const levels = ['low', 'medium', 'high', 'critical'] as const;
    for (const level of levels) {
      const { unmount } = render(
        <ReviewSubmitSheet
          open={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          title="Test"
          riskLevel={level}
          testId="rss"
        />,
      );
      const badge = screen.getByTestId('rss-risk');
      expect(badge).toHaveClass(`rss__risk--${level}`);
      unmount();
    }
  });

  // ── Field list ─────────────────────────────────────────────────────────────

  it('renders field key/value pairs', () => {
    const fields: ReviewField[] = [
      { label: 'Amount', value: '500 XLM' },
      { label: 'Recipient', value: 'GABC123' },
    ];
    renderSheet({ fields });

    expect(screen.getByTestId('review-submit-sheet-field-0')).toHaveTextContent('Amount');
    expect(screen.getByTestId('review-submit-sheet-field-0')).toHaveTextContent('500 XLM');
    expect(screen.getByTestId('review-submit-sheet-field-1')).toHaveTextContent('Recipient');
  });

  it('applies sensitive class to sensitive fields', () => {
    const fields: ReviewField[] = [{ label: 'Private Key', value: '***', sensitive: true }];
    renderSheet({ fields });

    expect(screen.getByTestId('review-submit-sheet-field-0')).toHaveClass(
      'rss__field--sensitive',
    );
  });

  it('does not render fields region when fields array is empty', () => {
    renderSheet({ fields: [] });

    expect(screen.queryByTestId('review-submit-sheet-fields')).not.toBeInTheDocument();
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    renderSheet({ onClose });

    fireEvent.click(screen.getByTestId('review-submit-sheet-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    renderSheet({ onConfirm });

    fireEvent.click(screen.getByTestId('review-submit-sheet-confirm'));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it('uses custom confirm and cancel labels', () => {
    renderSheet({ confirmLabel: 'Execute Now', cancelLabel: 'Abort' });

    expect(screen.getByTestId('review-submit-sheet-confirm')).toHaveTextContent('Execute Now');
    expect(screen.getByTestId('review-submit-sheet-cancel')).toHaveTextContent('Abort');
  });

  // ── Submitting state ───────────────────────────────────────────────────────

  it('disables confirm and cancel buttons while submitting', () => {
    renderSheet({ isSubmitting: true });

    expect(screen.getByTestId('review-submit-sheet-confirm')).toBeDisabled();
    expect(screen.getByTestId('review-submit-sheet-cancel')).toBeDisabled();
  });

  it('shows Submitting label on confirm button when isSubmitting is true', () => {
    renderSheet({ isSubmitting: true });

    expect(screen.getByTestId('review-submit-sheet-confirm')).toHaveTextContent('Submitting');
  });

  // ── Backdrop dismiss ───────────────────────────────────────────────────────

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    renderSheet({ onClose });

    fireEvent.click(screen.getByTestId('review-submit-sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on backdrop click while submitting', () => {
    const onClose = vi.fn();
    renderSheet({ onClose, isSubmitting: true });

    fireEvent.click(screen.getByTestId('review-submit-sheet-backdrop'));
    expect(onClose).not.toHaveBeenCalled();
  });

  // ── Keyboard dismiss ───────────────────────────────────────────────────────

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    renderSheet({ onClose });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on Escape while submitting', () => {
    const onClose = vi.fn();
    renderSheet({ onClose, isSubmitting: true });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('has role="dialog" and aria-modal="true"', () => {
    renderSheet();

    const sheet = screen.getByTestId('review-submit-sheet');
    expect(sheet).toHaveAttribute('role', 'dialog');
    expect(sheet).toHaveAttribute('aria-modal', 'true');
  });

  it('is labelled by the title element', () => {
    renderSheet({ title: 'Pause Contract' });

    const sheet = screen.getByTestId('review-submit-sheet');
    const titleId = screen.getByTestId('review-submit-sheet-title').id;
    expect(sheet).toHaveAttribute('aria-labelledby', titleId);
  });
});
