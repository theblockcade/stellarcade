"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, ShieldCheck, Wallet, Bot, Send } from "lucide-react";

import { useWalletStatus } from "@/hooks/useWalletStatus";
import defaultFreighterAdapter from "@/services/freighter-adapter";
import { createProfileApiClient, profileStore } from "@/services/profile-service";
import { Button } from "@/components/ui/button";

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

      /*
       * Sync the Telegram link onto the existing profile.
       *
       * updateProfile requires a username, and this used to pass
       * `Player_<last4>` when the store had none loaded — which silently
       * *renamed* the player as a side effect of linking their bot account.
       * Linking must never change the display name, so if we don't have the
       * current one we skip the sync rather than guess it.
       */
      try {
        const currentUsername = profileStore.getState().profile?.username?.trim();
        if (currentUsername) {
          const client = createProfileApiClient();
          const res = await client.updateProfile({
            address: wallet.address,
            username: currentUsername,
            telegramUserId: userId || "tg_linked",
            telegramHandle: userId ? `@user_${userId}` : undefined,
          });
          if (res.success && res.data) {
            profileStore.dispatch({ type: "PROFILE_SET", payload: { profile: res.data } });
          }
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

  const commandString = wallet.address && signature ? `/link ${wallet.address} ${signature}` : "";

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
    <div className="mx-auto w-full max-w-2xl py-8">
      <div
        data-testid="link-card"
        className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-border bg-card/70 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div
          className="pointer-events-none absolute -top-28 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />

        <header className="relative flex flex-col items-center gap-2 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-linear-to-br from-teal-400 via-blue-500 to-purple-600 text-black shadow-lg shadow-teal-500/30">
            <Bot className="size-7" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Link Your Bot Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Authorize your <strong className="text-foreground capitalize">{platform}</strong> account
            ({userId || "Guest"}) to interact with StellarCade smart contracts.
          </p>
        </header>

        {error && (
          <p
            role="alert"
            className="relative rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
          >
            {error}
          </p>
        )}

        {!challenge ? (
          <p className="relative rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            No active challenge token found. Please trigger{" "}
            <code className="rounded bg-amber-400/20 px-1 font-mono font-bold">/link</code> inside
            Telegram to generate a fresh link token.
          </p>
        ) : (
          <div className="relative flex flex-col gap-1 rounded-xl border border-border bg-background/50 p-4">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Challenge Token
            </span>
            <code className="font-mono text-base break-all text-primary">{challenge}</code>
          </div>
        )}

        <div className="relative flex flex-col gap-4">
          {!wallet.capabilities.isConnected ? (
            <Button
              type="button"
              variant="brand"
              size="lg"
              onClick={() => void wallet.connect(defaultFreighterAdapter)}
            >
              <Wallet />
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
              <ShieldCheck />
              {signing ? "Signing Challenge…" : "Sign Challenge with Freighter"}
            </Button>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                ✓ Challenge signed successfully! Copy the command below and paste it back into
                Telegram:
              </p>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-background/60 p-4">
                <code className="min-w-0 flex-1 font-mono text-sm break-all text-primary">
                  {commandString}
                </code>
                <Button type="button" variant="brand-outline" size="sm" onClick={handleCopyCommand}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copied!" : "Copy Command"}
                </Button>
              </div>

              <a
                href="https://t.me/StellarCadeBot"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white shadow-md shadow-sky-500/20 transition-all hover:-translate-y-px hover:bg-sky-600"
              >
                <Send className="size-4" aria-hidden />
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
    <Suspense
      fallback={
        <p className="p-8 text-center text-sm text-muted-foreground">
          Loading Telegram Bot Linker…
        </p>
      }
    >
      <LinkPageContent />
    </Suspense>
  );
}
