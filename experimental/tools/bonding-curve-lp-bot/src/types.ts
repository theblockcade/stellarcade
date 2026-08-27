/** Direction of a single trade against the bonding curve pool. */
export type TradeSide = 'buy' | 'sell';

/**
 * Snapshot of the `DynamicBondingCurve` contract's pool state — field
 * names and semantics mirror `PoolStatusSummary` exactly, as returned by
 * the contract's `get_pool_status()` (see
 * `experimental/contracts/dynamic-bonding-curve/src/types.rs`), so a real
 * `TradeExecutor` can map an RPC response straight into this shape.
 */
export interface PoolState {
  /** Whole tokens currently minted. */
  supply: bigint;
  /** Deposit units held in reserve (the discrete integral of the curve from 0 to `supply`). */
  reserve: bigint;
  /** Price of the next token to be minted: `slope * (supply + 1)^exponent`. */
  spotPrice: bigint;
  /** `reserve / (spotPrice * supply)` in basis points; 0 when supply is 0. */
  reserveRatioBps: bigint;
  /** Curve slope coefficient `m`. */
  slope: bigint;
  /** Curve exponent `k`, in `1..=3`. */
  exponent: number;
}

export interface BotConfig {
  /** Stellar secret key (`S...`) for the trading wallet. Never logged. */
  botSecretKey: string;
  /** Bonding curve contract id to trade against. */
  contractId: string;
  /** Soroban RPC endpoint URL. */
  rpcUrl: string;
  /** Milliseconds between trade attempts. */
  tradeIntervalMs: number;
  /** Maximum XLM-equivalent notional this bot will hold as an open position at once. */
  maxPositionXlm: number;
  /** Trading halts if wallet balance falls below this XLM amount. */
  emergencyReserveXlm: number;
  /** Random-walk drift toward buys (>0.5) or sells (<0.5); 0.5 = balanced. */
  driftBias: number;
  /** Minimum and maximum trade size, in deposit-unit notional (buys) / equivalent notional (sells). */
  minTradeXlm: number;
  maxTradeXlm: number;
  /** Maximum acceptable slippage as a fraction (e.g. 0.02 = 2%) before a trade is skipped. */
  maxSlippage: number;
  /** PRNG seed for reproducible dry-run/backtest behavior. */
  seed: number;
}

export interface TradeDecision {
  side: TradeSide;
  /** Trade size in deposit-unit notional (what the bot intends to spend on a buy, or receive on a sell). */
  sizeXlm: number;
  /** Human-readable reason the strategy picked this side/size (for logging). */
  reason: string;
}

export interface TradeResult {
  decision: TradeDecision;
  /** Simulated or real transaction hash. */
  txHash: string;
  /** Simulated or real fee paid, in stroops. */
  gasStroops: number;
  /** Tokens minted (buy) or deposit units returned (sell). */
  amount: bigint;
  /** Realized slippage as a fraction of the quoted amount (e.g. 0.004 = 0.4%). */
  slippage: number;
  poolStateAfter: PoolState;
  timestamp: number;
}

/** Emitted instead of a `TradeResult` when a decision is skipped rather than executed. */
export interface SkippedTrade {
  decision: TradeDecision;
  reason: string;
}

export interface HaltReason {
  reason: string;
  walletBalanceXlm: number;
}

/**
 * Pluggable trade executor. The default implementation
 * (`SimulatedExecutor`, see `bot.ts`) prices trades using the exact same
 * integer curve math as the real `DynamicBondingCurve` contract (see
 * `curve-math.ts`, ported from `experimental/contracts/dynamic-bonding-curve/src/math.rs`)
 * against an in-memory pool, so the bot is fully runnable and testable
 * without a funded testnet wallet or a live RPC connection. A real
 * executor would submit `buy_tokens`/`sell_tokens` Soroban invocations via
 * `@stellar/stellar-sdk` and read `get_pool_status`/`get_balance` back
 * from the ledger.
 */
export interface TradeExecutor {
  getPoolState(): Promise<PoolState>;
  getWalletBalanceXlm(): Promise<number>;
  /** Executes a trade, honoring the given max-slippage guard; throws `SlippageExceededError` if the guard trips. */
  executeTrade(decision: TradeDecision, maxSlippage: number): Promise<TradeResult>;
}

/** Thrown by a `TradeExecutor` when a trade's realized price impact would exceed the caller's slippage guard. */
export class SlippageExceededError extends Error {
  constructor(message = 'slippage guard exceeded') {
    super(message);
    this.name = 'SlippageExceededError';
  }
}

export interface RunSummary {
  tradesExecuted: number;
  tradesSkipped: number;
  buys: number;
  sells: number;
  totalVolumeXlm: number;
  totalGasStroops: number;
  averageSlippage: number;
  haltedReason: string | null;
  startedAt: number;
  endedAt: number;
}
