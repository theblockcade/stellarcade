export type WagerToken = 'XLM' | 'ARCADE';

export interface QuickSelectChip {
  label: string;
  /** Fixed wager amount for this chip, or 'MAX' to select the maximum allowed wager. */
  value: number | 'MAX';
}

export interface WagerCalculation {
  wager: number;
  feeAmount: number;
  payout: number;
  netProfit: number;
}

export interface MatchWagerCalculatorProps {
  /** Wallet balance available for wagering, in the currently selected token. */
  availableBalance: number;
  /** Minimum wager amount allowed by the match rules. */
  minWager: number;
  /** Maximum wager amount allowed by the match rules (independent of balance). */
  maxWager: number;
  /** Platform fee in basis points (1/100th of a percent), e.g. 250 = 2.5%. */
  feeBasisPoints: number;
  /** Called whenever the confirmed wager amount changes (slider, chip, or input). */
  onWagerSelect?: (wager: number, token: WagerToken) => void;
  /** Enables the XLM / ARCADE multi-token toggle. Defaults to true. */
  multiToken?: boolean;
  /** Initial selected token when multiToken is enabled. Defaults to 'XLM'. */
  initialToken?: WagerToken;
  className?: string;
  testId?: string;
}
