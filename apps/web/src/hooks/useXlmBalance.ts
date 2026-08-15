"use client";

import { useEffect, useState } from "react";

import { useWalletStatus } from "./useWalletStatus";

export interface XlmBalance {
  /** Raw native balance in XLM, or null when unknown/disconnected. */
  amount: number | null;
  /** Locale-formatted to 2dp, or null when unknown/disconnected. */
  formatted: string | null;
  isLoading: boolean;
  /**
   * True when Horizon answered 404 — a Stellar account that has never been
   * funded genuinely does not exist on the ledger yet, which is a different
   * state from "we failed to load it".
   */
  isUnfunded: boolean;
}

const POLL_INTERVAL_MS = 10_000;

/**
 * Live native (XLM) balance for the connected wallet, read straight from
 * Horizon.
 *
 * This is the one genuinely on-chain number the app can show today, so it's
 * shared rather than re-implemented per surface (it previously lived inline
 * in HeaderWalletControl, which meant the dashboard had no way to show a
 * real balance without duplicating the fetch).
 */
export function useXlmBalance(): XlmBalance {
  const wallet = useWalletStatus();
  const [amount, setAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnfunded, setIsUnfunded] = useState(false);

  const address = wallet.address;
  const isConnected = wallet.capabilities.isConnected;
  const network = wallet.network;

  useEffect(() => {
    if (!isConnected || !address) {
      setAmount(null);
      setIsUnfunded(false);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    const horizonUrl = (network || "").toUpperCase().includes("TEST")
      ? "https://horizon-testnet.stellar.org"
      : "https://horizon.stellar.org";

    const fetchBalance = async () => {
      try {
        const res = await fetch(`${horizonUrl}/accounts/${address}`);
        if (!active) return;

        if (res.status === 404) {
          setAmount(null);
          setIsUnfunded(true);
          return;
        }
        if (!res.ok) return;

        const data = (await res.json()) as {
          balances?: Array<{ asset_type: string; balance: string }>;
        };
        if (!active) return;

        const native = data.balances?.find((b) => b.asset_type === "native");
        if (native) {
          setAmount(Number.parseFloat(native.balance));
          setIsUnfunded(false);
        }
      } catch {
        // Horizon unreachable — keep the last known value rather than
        // flashing a wrong number. Callers render "—" while amount is null.
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void fetchBalance();
    const interval = setInterval(() => void fetchBalance(), POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isConnected, address, network]);

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
