export interface QuickDepositDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  currentBalance: number;
  onDeposit: (amount: number) => Promise<void>;
  /** Whether the connected wallet is on Stellar Testnet (shows the Friendbot shortcut). Defaults to false. */
  isTestnet?: boolean;
  /** Called when the Friendbot testnet-funding request completes successfully. */
  onFriendbotFund?: () => Promise<void>;
}

export const PRESET_DEPOSIT_AMOUNTS: readonly number[] = [10, 25, 100];
