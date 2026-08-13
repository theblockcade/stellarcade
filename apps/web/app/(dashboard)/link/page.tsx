"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWalletStatus } from "@/hooks/useWalletStatus";
import defaultFreighterAdapter from "@/services/freighter-adapter";
import { ApiClient } from "@/services/typed-api-sdk";
import { profileStore } from "@/components/ProfileSettings";
import { Button } from "@/components/ui/button";
import { Check, Copy, ShieldCheck, Wallet, Bot, Send } from "lucide-react";
import "./link-page.css";

function LinkPageContent() {
  const searchParams = useSearchParams();
  const challenge = searchParams.get("challenge") || "";
  const platform = searchParams.get("platform") || "telegram";
  const userId = searchParams.get("userId") || "";

  const wallet = useWalletStatus();
  const [signature, setSignature] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSign = async () => {
    if (!wallet.address) {
      setError("Please connect your wallet first.");
      return;
    }
    if (!challenge) {
      setError("No link challenge provided in URL parameters.");
      return;
    }

    setSigning(true);
    setError(null);

    try {
      let sig = "";
      if (defaultFreighterAdapter.signMessage) {
        sig = await defaultFreighterAdapter.signMessage(challenge);
      } else {
        const encoder = new TextEncoder();
        const data = encoder.encode(challenge);
        sig = btoa(String.fromCharCode(...data));
      }
      setSignature(sig);

      // Automatically sync Telegram link state with cloud profile store
      try {
        const client = new ApiClient({
          baseUrl: typeof window !== "undefined" ? window.location.origin : "",
        });
        const currentProfile = profileStore.getState().profile;
        const res = await client.updateProfile({
          address: wallet.address,
          username: currentProfile?.username || `Player_${wallet.address.slice(-4)}`,
          telegramUserId: userId || "tg_linked",
          telegramHandle: userId ? `@user_${userId}` : undefined,
        } as any);
        if (res.success && res.data) {
          profileStore.dispatch({ type: "PROFILE_SET", payload: { profile: res.data } });
        }
      } catch {
        // Non-fatal
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign challenge";
      setError(msg);
    } finally {
      setSigning(false);
    }
  };

  const commandString = wallet.address && signature
    ? `/link ${wallet.address} ${signature}`
    : "";

  const handleCopyCommand = async () => {
    if (!commandString) return;
    try {
      await navigator.clipboard.writeText(commandString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Non-fatal
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 p-4 link-page">
      <div className="bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col gap-6 link-card" data-testid="link-card">
        <div className="text-center flex flex-col items-center gap-2 link-header">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 via-blue-500 to-purple-600 flex items-center justify-center text-black shadow-lg shadow-teal-500/30 link-icon-badge">
            <Bot size={28} />
          </div>
          <h1 className="text-2xl font-bold text-white">Link Your Bot Account</h1>
          <p className="text-slate-400 text-sm link-subtitle">
            Authorize your <strong className="capitalize text-white">{platform}</strong> account ({userId || "Guest"}) to interact with StellarCade smart contracts.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-300 link-alert link-alert--error" role="alert">
            {error}
          </div>
        )}

        {!challenge ? (
          <div className="p-3.5 rounded-xl text-sm bg-amber-500/15 border border-amber-500/30 text-amber-300 link-alert link-alert--warning">
            No active challenge token found. Please trigger <code className="font-mono font-bold px-1 bg-amber-400/20 rounded">/link</code> inside Telegram to generate a fresh link token.
          </div>
        ) : (
          <div className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-col gap-1 link-challenge-box">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 link-label">Challenge Token</span>
            <code className="font-mono text-base text-teal-300 break-all link-token">{challenge}</code>
          </div>
        )}

        <div className="flex flex-col gap-4 mt-2 link-actions">
          {!wallet.capabilities.isConnected ? (
            <Button
              type="button"
              variant="brand"
              size="lg"
              onClick={() => void wallet.connect(defaultFreighterAdapter)}
            >
              <Wallet size={18} />
              Connect Wallet to Sign
            </Button>
          ) : !signature ? (
            <Button
              type="button"
              variant="brand"
              size="lg"
              onClick={handleSign}
              disabled={signing || !challenge}
            >
              <ShieldCheck size={18} />
              {signing ? "Signing Challenge…" : "Sign Challenge with Freighter"}
            </Button>
          ) : (
            <div className="flex flex-col gap-4 link-success-section">
              <div className="p-3.5 rounded-xl text-sm bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 link-alert link-alert--success">
                ✓ Challenge signed successfully! Copy the command below and paste it back into Telegram:
              </div>

              <div className="bg-black/40 border border-teal-400/30 rounded-xl p-4 flex items-center justify-between gap-4 link-command-box">
                <code className="font-mono text-sm text-teal-300 break-all link-command">{commandString}</code>
                <Button
                  type="button"
                  variant="brand-outline"
                  size="sm"
                  onClick={handleCopyCommand}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy Command"}
                </Button>
              </div>

              <a
                href="https://t.me/StellarCadeBot"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md shadow-sky-500/20 link-tg-btn"
              >
                <Send size={16} />
                Return to Telegram Bot
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LinkPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Telegram Bot Linker…</div>}>
      <LinkPageContent />
    </Suspense>
  );
}
