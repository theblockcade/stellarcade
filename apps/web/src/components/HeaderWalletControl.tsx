"use client";

import * as React from "react";
import { useCallback, useState } from "react";
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

  const handleConnect = useCallback(() => {
    // The adapter has to be passed explicitly — useWalletStatus only installs
    // a provider when one is supplied, which is why bare connect() calls
    // elsewhere in the app silently did nothing.
    void wallet.connect(defaultFreighterAdapter);
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

  if (wallet.capabilities.isConnected && wallet.address) {
    return (
      <div className="hwc" data-testid="header-wallet-connected">
        <div className="hwc__identity">
          <button
            type="button"
            className="hwc__address"
            onClick={() => void handleCopy()}
            title={`${wallet.address} — click to copy`}
            data-testid="header-wallet-address"
          >
            <span>{shortenAddress(wallet.address)}</span>
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          {wallet.network && (
            <span className="hwc__network" data-testid="header-wallet-network">
              <span className="hwc__pulse" aria-hidden="true" />
              {wallet.network}
            </span>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => void wallet.disconnect()}
          aria-label="Disconnect wallet"
          data-testid="header-wallet-disconnect"
        >
          <LogOut size={15} />
          <span className="hwc__disconnect-label">Disconnect</span>
        </Button>
      </div>
    );
  }

  const isBusy = wallet.capabilities.isConnecting || wallet.capabilities.isReconnecting;

  return (
    <div className="hwc" data-testid="header-wallet-disconnected">
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
        <span className="hwc__error" role="status" data-testid="header-wallet-error">
          {wallet.error.message}
        </span>
      )}
    </div>
  );
};

export default HeaderWalletControl;
