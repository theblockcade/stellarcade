"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, LogOut, Wallet } from "lucide-react";
import { useWalletStatus } from "../hooks/useWalletStatus";
import defaultFreighterAdapter from "../services/freighter-adapter";
import { Button } from "./ui/button";
import "./HeaderWalletControl.css";

/**
 * Persistent wallet control for the dashboard header.
 *
 * Until this existed the app shell's header held only a logo and the locale
 * switcher, so there was no way to connect a wallet from anywhere in the
 * dashboard — the only connect affordances were buried inside GameLobby's
 * per-game CTA and ProfileSettings' account switcher. Connection state is
 * global, so its control belongs in the global chrome.
 *
 * Modelled on the reference dapp's shell header: address as a click-to-copy
 * chip, live network label, and an explicit disconnect.
 */

function shortenAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export const HeaderWalletControl: React.FC = () => {
  const wallet = useWalletStatus();
  const [copied, setCopied] = useState(false);
  // Prevents hydration mismatch: SSR always renders the disconnected view,
  // then the client switches to the connected view after mount.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = useCallback(() => {
    // The adapter has to be passed explicitly — useWalletStatus only installs
    // a provider when one is supplied, which is why bare connect() calls
    // elsewhere in the app silently did nothing.
    const res = wallet.connect(defaultFreighterAdapter);
    if (res && typeof (res as unknown as Promise<void>).catch === "function") {
      void (res as unknown as Promise<void>).catch(() => {});
    }
  }, [wallet]);

  const handleCopy = useCallback(async () => {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked by permissions; the address is still shown
      // in full via the title attribute, so this is a non-fatal degradation.
    }
  }, [wallet.address]);

  const [xlmBalance, setXlmBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet.capabilities.isConnected || !wallet.address) {
      setXlmBalance(null);
      return;
    }

    let isMounted = true;
    const fetchBalance = async () => {
      try {
        const network = (wallet.network || "").toUpperCase();
        const isTestnet = network.includes("TEST");
        const horizonUrl = isTestnet
          ? "https://horizon-testnet.stellar.org"
          : "https://horizon.stellar.org";

        const res = await fetch(`${horizonUrl}/accounts/${wallet.address}`);
        if (!res.ok) return;
        const data = (await res.json()) as { balances?: Array<{ asset_type: string; balance: string }> };
        const native = data.balances?.find((b) => b.asset_type === "native");
        if (native && isMounted) {
          const num = parseFloat(native.balance);
          setXlmBalance(num.toLocaleString(undefined, { maximumFractionDigits: 2 }));
        }
      } catch {
        // Non-fatal degradation if horizon fails or account uncreated
      }
    };

    void fetchBalance();
    const interval = setInterval(() => void fetchBalance(), 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [wallet.capabilities.isConnected, wallet.address, wallet.network]);

  if (mounted && wallet.capabilities.isConnected && wallet.address) {
    return (
      <div className="flex items-center gap-2 p-1.5 rounded-full bg-slate-900/80 border border-white/10 text-slate-100 hwc" data-testid="header-wallet-connected">
        <div className="flex items-center gap-2 text-xs font-semibold hwc__identity">
          {xlmBalance !== null && (
            <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-400/10 hwc__balance" data-testid="header-wallet-balance">
              {xlmBalance} XLM
            </span>
          )}
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 hover:border-teal-400/50 hover:bg-black/60 transition-all font-mono text-slate-200 hwc__address"
            onClick={() => void handleCopy()}
            title={`${wallet.address} — click to copy`}
            data-testid="header-wallet-address"
          >
            <span>{shortenAddress(wallet.address)}</span>
            {copied ? <Check size={13} className="text-emerald-400 hwc__icon-success" /> : <Copy size={13} />}
          </button>
          {wallet.network && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-400/10 border border-teal-400/30 text-teal-300 font-mono text-[10px] font-bold tracking-wider uppercase hwc__network" data-testid="header-wallet-network">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hwc__pulse" aria-hidden="true" />
              {wallet.network}
            </span>
          )}
          <span className="w-px h-4 bg-white/15 hwc__divider" aria-hidden="true" />
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors hwc__disconnect-btn"
            onClick={() => void wallet.disconnect()}
            aria-label="Disconnect wallet"
            title="Disconnect wallet"
            data-testid="header-wallet-disconnect"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline hwc__disconnect-label">Disconnect</span>
          </button>
        </div>
      </div>
    );
  }

  const isBusy = wallet.capabilities.isConnecting || wallet.capabilities.isReconnecting;

  return (
    <div className="flex items-center gap-2 hwc" data-testid="header-wallet-disconnected">
      {wallet.status === "PROVIDER_MISSING" ? (
        <Button asChild size="sm" variant="brand-outline" data-testid="header-wallet-install">
          <a href="https://www.freighter.app/" target="_blank" rel="noreferrer noopener">
            <Wallet size={15} />
            Install Freighter
          </a>
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="brand"
          onClick={handleConnect}
          disabled={isBusy}
          data-testid="header-wallet-connect"
        >
          {isBusy ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />}
          {isBusy ? "Connecting…" : "Connect Wallet"}
        </Button>
      )}

      {wallet.error && wallet.error.recoverable && (
        <span className="text-xs text-red-400 hwc__error" role="status" data-testid="header-wallet-error">
          {wallet.error.message}
        </span>
      )}
    </div>
  );
};

export default HeaderWalletControl;

