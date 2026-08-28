import React, { useState } from 'react';
import { SessionRecoveryPromptProps } from './types';

export const SessionRecoveryPrompt: React.FC<SessionRecoveryPromptProps> = ({
  status,
  expectedNetwork,
  onReconnect,
  onDismiss,
}) => {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    setError(null);
    try {
      await onReconnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reconnect wallet');
    } finally {
      setIsReconnecting(false);
    }
  };

  const renderStatusMessage = () => {
    switch (status) {
      case 'disconnected':
        return 'Wallet extension disconnected. Re-establish your session to continue.';
      case 'wrong_network':
        return `Connected to wrong network. Please switch to ${expectedNetwork}.`;
      case 'expired':
        return 'Wallet session expired. Re-connect to restore authorization.';
      default:
        return 'Wallet session needs attention.';
    }
  };

  return (
    <div
      role="alert"
      className="session-recovery-banner"
      style={{
        padding: '12px 16px',
        backgroundColor: status === 'wrong_network' ? '#fff3cd' : '#f8d7da',
        color: '#721c24',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span role="img" aria-label="warning-icon">
          ⚠️
        </span>
        <div>
          <span>{renderStatusMessage()}</span>
          {error && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>{error}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleReconnect}
          disabled={isReconnecting}
          style={{
            padding: '6px 12px',
            backgroundColor: '#0d6efd',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isReconnecting ? 'not-allowed' : 'pointer',
          }}
        >
          {isReconnecting ? 'Reconnecting...' : 'Reconnect Wallet'}
        </button>
        <button
          onClick={onDismiss}
          style={{
            padding: '6px 12px',
            backgroundColor: 'transparent',
            color: '#6c757d',
            border: '1px solid #6c757d',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
