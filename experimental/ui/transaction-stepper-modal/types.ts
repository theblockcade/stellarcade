export type TxStepStatus = 'pending' | 'active' | 'complete' | 'failed';

export interface TxStep {
  id: string;
  label: string;
  description: string;
  status: TxStepStatus;
  txHash?: string;
  errorMessage?: string;
}

export interface TransactionStepperModalProps {
  isOpen: boolean;
  steps: TxStep[];
  currentStepIndex: number;
  onRetry: () => void;
  onCancel: () => void;
  network?: 'public' | 'testnet';
}
