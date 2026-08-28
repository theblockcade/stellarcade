export type SessionRecoveryStatus = 'disconnected' | 'wrong_network' | 'expired';

export interface SessionRecoveryPromptProps {
  status: SessionRecoveryStatus;
  expectedNetwork: string;
  onReconnect: () => Promise<void>;
  onDismiss: () => void;
}
