"use client";

import { useEffect, useState } from "react";

import { useWalletStatus } from "./useWalletStatus";
import { createProfileApiClient } from "../services/profile-service";

export interface XlmBalance {
  /** Raw native balance in XLM, or null when unknown/disconnected. */
  amount: number | null;
  /** Locale-formatted to 2dp, or null when unknown/disconnected. */
  formatted: string | null;
  isLoading: boolean;
  /**
   * True when the wallet genuinely has no on-chain account yet — a
   * different state from "we failed to load it".
   */
  isUnfunded: boolean;
}

const POLL_INTERVAL_MS = 10_000;

/**
 * Live native (XLM) balance for the connected wallet.
 *
 * Goes through the backend's GET /wallet/:address/balance rather than
 * querying Horizon directly from the browser. This used to pick testnet vs.
 * mainnet Horizon based on whatever network the connected wallet extension
 * happened to be set to — so a Freighter set to Mainnet showed a player's
 * real XLM balance even though the rest of this app (bot, gateway,
 * deposits) is hardcoded to testnet. The backend's HORIZON_URL is the one
 * source of truth for which network this app shows, and it's shared with
 * every other surface (Portfolio) rather than re-implemented here.
 */
export function useXlmBalance(): XlmBalance {
  const wallet = useWalletStatus();
  const [amount, setAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnfunded, setIsUnfunded] = useState(false);

  const address = wallet.address;
  const isConnected = wallet.capabilities.isConnected;

  useEffect(() => {
    if (!isConnected || !address) {
      setAmount(null);
      setIsUnfunded(false);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    const client = createProfileApiClient();

    const fetchBalance = async () => {
      const result = await client.getWalletBalance(address);
      if (!active) return;

      if (!result.success) {
        // Keep the last known value rather than flashing a wrong number —
        // callers render "—" while amount is still null.
        setIsLoading(false);
        return;
      }

      const xlm = result.data.balances.XLM;
      if (xlm === undefined) {
        setAmount(null);
        setIsLoading(false);
        return;
      }

      const parsed = Number.parseFloat(xlm);
      // The backend reports a well-formed but never-funded address as a
      // zero balance rather than an error — that's this app's "unfunded"
      // signal now, not a 404 the client has to interpret itself.
      setAmount(parsed);
      setIsUnfunded(parsed === 0);
      setIsLoading(false);
    };

    void fetchBalance();
    const interval = setInterval(() => void fetchBalance(), POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isConnected, address]);

  return {
    amount,
    formatted:
      amount === null
        ? null
        : amount.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    isLoading,
    isUnfunded,
  };
}

export default useXlmBalance;
