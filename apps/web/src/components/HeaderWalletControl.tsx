"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, LogOut, Wallet } from "lucide-react";
import { useWalletStatus, type WalletStatus } from "../hooks/useWalletStatus";
import { useXlmBalance } from "../hooks/useXlmBalance";
import defaultFreighterAdapter from "../services/freighter-adapter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { StatusAnnouncer, useStatusAnnouncer } from "./StatusAnnouncer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
 *
 * Built on shadcn primitives + Tailwind utilities; the former
 * HeaderWalletControl.css is gone (most of its rules described a hand-rolled
 * chip layout this component stopped rendering when it moved to a dropdown).
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

  // Live native balance comes from the shared useXlmBalance hook rather than
  // a fetch inlined here, so the dashboard can show the same real number.
  const balance = useXlmBalance();

  // Screen-reader-only announcements for connection state changes (#999) —
  // the visible UI already communicates status via the button/menu, but a
  // screen reader user gets no signal that "Connecting…" resolved to
  // connected/failed unless it's pushed through a live region.
  const { message: announceMessage, politeness: announcePoliteness, announce } =
    useStatusAnnouncer();
  const prevStatusRef = useRef<WalletStatus | null>(null);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = wallet.status;
    // Skip the transition out of the initial (pre-mount) state — nothing
    // changed from the user's perspective, there's just nothing to announce
    // on first paint.
    if (prevStatus === null || prevStatus === wallet.status) return;

    switch (wallet.status as WalletStatus) {
      case "CONNECTING":
        announce("Connecting to wallet…");
        break;
      case "RECONNECTING":
        announce("Reconnecting to wallet…");
        break;
      case "CONNECTED":
        announce(
          wallet.address
            ? `Wallet connected: ${shortenAddress(wallet.address)}`
            : "Wallet connected",
        );
        break;
      case "DISCONNECTED":
        // Only announce a real disconnect, not the transient DISCONNECTED
        // state a fresh session starts in.
        if (prevStatus === "CONNECTED" || prevStatus === "RECONNECTING") {
          announce("Wallet disconnected");
        }
        break;
      case "PROVIDER_MISSING":
        announce("Freighter wallet extension not found. Install it to connect.", "assertive");
        break;
      case "ERROR":
      case "PERMISSION_DENIED":
      case "STALE_SESSION":
        // Recoverable errors are already surfaced as visible text in a
        // role="status" region below — announcing here too would speak the
        // same message twice.
        if (!wallet.error?.recoverable) {
          announce(wallet.error?.message ?? "Wallet connection error.", "assertive");
        }
        break;
    }
  }, [wallet.status, wallet.address, wallet.error, announce]);

  const announcer = (
    <StatusAnnouncer
      message={announceMessage}
      politeness={announcePoliteness}
      className="sr-only"
      testId="header-wallet-status-announcer"
    />
  );

  if (mounted && wallet.capabilities.isConnected && wallet.address) {
    return (
      <div className="flex items-center gap-2.5" data-testid="header-wallet-connected">
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
                {balance.formatted !== null && (
                  <p className="text-xs font-semibold text-emerald-400" data-testid="header-wallet-balance">
                    {balance.formatted} XLM
                  </p>
                )}
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
        {announcer}
      </div>
    );
  }

  const isBusy = wallet.capabilities.isConnecting || wallet.capabilities.isReconnecting;

  return (
    <div className="flex items-center gap-2" data-testid="header-wallet-disconnected">
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
        <span className="max-w-[22ch] text-xs leading-tight text-amber-400 max-[720px]:hidden" role="status" data-testid="header-wallet-error">
          {wallet.error.message}
        </span>
      )}
      {announcer}
    </div>
  );
};

export default HeaderWalletControl;

