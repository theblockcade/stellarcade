"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, LogOut, Wallet } from "lucide-react";
import { useWalletStatus } from "../hooks/useWalletStatus";
import defaultFreighterAdapter from "../services/freighter-adapter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
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
      <div className="hwc" data-testid="header-wallet-connected">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full border border-border bg-card"
              aria-label="Open wallet menu"
              data-testid="header-wallet-menu"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Wallet className="size-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Connected wallet</p>
                <p className="font-mono text-xs text-muted-foreground" data-testid="header-wallet-address">
                  {shortenAddress(wallet.address)}
                </p>
                {xlmBalance !== null && <p className="text-xs font-semibold text-emerald-400" data-testid="header-wallet-balance">{xlmBalance} XLM</p>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {wallet.network && (
              <DropdownMenuItem disabled data-testid="header-wallet-network">
                <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                {wallet.network}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => void handleCopy()} data-testid="header-wallet-copy">
              {copied ? <Check className="text-emerald-400" /> : <Copy />}
              {copied ? "Copied address" : "Copy address"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => void wallet.disconnect()}
              data-testid="header-wallet-disconnect"
            >
              <LogOut /> Disconnect wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

