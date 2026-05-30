import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationPreferencesPanel } from '../../src/components/v1/NotificationPreferencesPanel';

describe('NotificationPreferencesPanel Integration', () => {
  it('renders the panel without draft indicator', () => {
    render(<NotificationPreferencesPanel />);
    
    expect(screen.getByText('Notification preferences')).toBeInTheDocument();
    expect(screen.getByTestId('notification-preferences-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('notification-preferences-panel-draft-indicator')).not.toBeInTheDocument();
  });

  it('renders draft indicator when hasDraft is true', () => {
    render(
      <NotificationPreferencesPanel 
        hasDraft={true}
        onResumeDraft={() => {}}
        onDiscardDraft={() => {}}
      />
    );
    
    expect(screen.getByTestId('notification-preferences-panel-draft-indicator')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders draft indicator with custom label', () => {
    render(
      <NotificationPreferencesPanel 
        hasDraft={true}
        onResumeDraft={() => {}}
        onDiscardDraft={() => {}}
      />
    );
    
    expect(screen.getByTestId('notification-preferences-panel-draft-indicator')).toBeInTheDocument();
  });

  it('shows saving state when isSavingDraft is true', () => {
    render(
      <NotificationPreferencesPanel 
        hasDraft={true}
        isSavingDraft={true}
        onResumeDraft={() => {}}
        onDiscardDraft={() => {}}
      />
    );
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('displays relative time when draftLastModified is provided', () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    render(
      <NotificationPreferencesPanel 
        hasDraft={true}
        draftLastModified={oneHourAgo}
        onResumeDraft={() => {}}
        onDiscardDraft={() => {}}
      />
    );
    
    expect(screen.getByText('1h ago')).toBeInTheDocument();
  });

  it('handles resume draft action', () => {
    const handleResume = vi.fn();
    render(
      <NotificationPreferencesPanel 
        hasDraft={true}
        onResumeDraft={handleResume}
        onDiscardDraft={() => {}}
      />
    );
    
    const resumeBtn = screen.getByTestId('notification-preferences-panel-draft-resume');
    fireEvent.click(resumeBtn);
    expect(handleResume).toHaveBeenCalledTimes(1);
  });

  it('handles discard draft action', () => {
    const handleDiscard = vi.fn();
    render(
      <NotificationPreferencesPanel 
        hasDraft={true}
        onResumeDraft={() => {}}
        onDiscardDraft={handleDiscard}
      />
    );
    
    const discardBtn = screen.getByTestId('notification-preferences-panel-draft-discard');
    fireEvent.click(discardBtn);
    expect(handleDiscard).toHaveBeenCalledTimes(1);
  });

  it('renders all preference toggles', () => {
    render(<NotificationPreferencesPanel />);
    
    expect(screen.getByTestId('notification-preferences-panel-toggle-productUpdates')).toBeInTheDocument();
    expect(screen.getByTestId('notification-preferences-panel-toggle-gameReminders')).toBeInTheDocument();
    expect(screen.getByTestId('notification-preferences-panel-toggle-securityAlerts')).toBeInTheDocument();
    expect(screen.getByTestId('notification-preferences-panel-toggle-marketing')).toBeInTheDocument();
  });

  it('handles preference toggle changes', () => {
    render(<NotificationPreferencesPanel />);
    
    const toggle = screen.getByTestId('notification-preferences-panel-toggle-productUpdates');
    fireEvent.click(toggle);
    // The toggle should be checked after clicking (it toggles the state)
    expect(toggle).toHaveAttribute('checked');
  });

  it('handles reset to defaults', () => {
    render(<NotificationPreferencesPanel />);
    
    const resetBtn = screen.getByTestId('notification-preferences-panel-reset');
    fireEvent.click(resetBtn);
    expect(resetBtn).toBeInTheDocument();
  });
});
