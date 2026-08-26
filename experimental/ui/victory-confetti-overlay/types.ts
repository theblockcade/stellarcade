export interface VictoryConfettiOverlayProps {
  isOpen: boolean;
  prizeAmount: number;
  currencySymbol: string;
  gameTitle: string;
  onPlayAgain?: () => void;
  onClose: () => void;
  onClaim?: () => void;
  onShare?: (platform: 'x' | 'telegram') => void;
  autoDismissMs?: number;
}
