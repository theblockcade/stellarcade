"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, Send, ShieldCheck, User } from "lucide-react";

import { AlertBanner } from "./AlertBanner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { PageHeader } from "./ui/page-header";
import { StatTile } from "./ui/stat-tile";
import { cn } from "../lib/utils";
import { useProfile } from "../hooks/useProfile";
import { useWalletStatus } from "../hooks/useWalletStatus";
import { useXlmBalance } from "../hooks/useXlmBalance";
import {
  USERNAME_MAX,
  profileStore,
  saveUsername,
  validateUsername,
} from "../services/profile-service";

/*
 * Rewritten to sit on the shared profile service. What this file used to do
 * and no longer does:
 *
 *   • Two separate load effects both keyed on the wallet address, racing each
 *     other on every connect.
 *   • Falling back to a made-up `Player_<last4>` username whenever the API
 *     had no record — the app naming the player instead of asking them.
 *   • A third private copy of the Horizon balance fetch (now useXlmBalance).
 *   • ~15 console.log statements narrating every step to the browser console.
 *
 * `profileStore` is re-exported for the modules that still import it from
 * here; it now actually lives in services/profile-service.
 */
export { profileStore };

const formatDate = (value?: string): string => {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

function shortenAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const ProfileSettings: React.FC = () => {
  const wallet = useWalletStatus();
  const { profile, isLoading } = useProfile();
  const balance = useXlmBalance();

  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setMounted(true), []);

  // Mirror the stored username into the editable field whenever the profile
  // changes underneath us (initial load, or a rename made elsewhere).
  useEffect(() => {
    setUsername(profile?.username ?? "");
  }, [profile?.username]);

  const walletMeta = useMemo(
    () => ({
      connected: wallet.capabilities.isConnected,
      address: wallet.address || "",
      network: wallet.network || "Unknown",
    }),
    [wallet],
  );

  const localError = username.trim() ? validateUsername(username) : null;
  const isDirty = Boolean(profile && username.trim() !== (profile.username ?? "").trim());
  const canSave = isDirty && !localError && !saving && Boolean(profile?.address);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const problem = validateUsername(username);
    if (problem) {
      setError(problem);
      return;
    }

    const address = profile?.address || wallet.address;
    if (!address) {
      setError("Connect a wallet before saving your profile.");
      return;
    }

    setSaving(true);
    // saveUsername publishes to the shared store on success, which is what
    // repaints the sidebar immediately rather than on the next page load.
    const result = await saveUsername(address, username);
    setSaving(false);

    if (result.ok) {
      setSuccess("Profile saved successfully.");
    } else {
      setError(result.message);
    }
  };

  const handleCopy = async () => {
    if (!walletMeta.address) return;
    try {
      await navigator.clipboard.writeText(walletMeta.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied — the address is still visible.
    }
  };

  const avatarInitial = useMemo(() => {
    if (!mounted) return "?";
    if (username) return username.charAt(0).toUpperCase();
    if (walletMeta.address) return walletMeta.address.charAt(0).toUpperCase();
    return "?";
  }, [mounted, username, walletMeta.address]);

  const telegramLinked = Boolean(
    profile?.telegramLinked || profile?.telegramHandle || profile?.telegramUserId,
  );

  return (
    <section
      className="profile-page mx-auto flex w-full max-w-4xl flex-col gap-6"
      aria-labelledby="profile-settings-heading"
    >
      <PageHeader
        icon={<User />}
        title="Profile"
        description="Your display name is tied to your connected Stellar wallet. StellarCade never holds your keys."
        eyebrow={
          mounted && walletMeta.connected ? (
            <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
              <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
              {walletMeta.network}
            </Badge>
          ) : null
        }
      />
      <h1 id="profile-settings-heading" className="sr-only">
        Profile Settings
      </h1>

      {error && <AlertBanner variant="error" message={error} testId="profile-settings-error" />}
      {success && (
        <AlertBanner variant="success" message={success} testId="profile-settings-success" />
      )}

      {/* Identity */}
      <div
        className="profile-identity-card flex flex-col items-center gap-6 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm sm:flex-row sm:items-start"
        data-testid="profile-identity-card"
      >
        <div
          className="profile-avatar flex size-18 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal-400 via-blue-500 to-purple-600 text-2xl font-extrabold text-black shadow-lg shadow-teal-500/20"
          data-testid="profile-avatar"
        >
          <span className="profile-avatar__initial">{avatarInitial}</span>
        </div>

        <div className="profile-info flex w-full flex-1 flex-col gap-3 text-center sm:text-left">
          <form
            onSubmit={(evt) => {
              evt.preventDefault();
              void handleSave();
            }}
            className="flex w-full flex-col gap-2"
          >
            <label htmlFor="profile-username" className="sr-only">
              Username
            </label>
            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <input
                id="profile-username"
                className={cn(
                  "profile-username-input flex-1 rounded-xl border bg-background/60 px-4 py-2.5 font-semibold text-foreground outline-none transition-colors",
                  "placeholder:font-normal placeholder:text-muted-foreground/60 focus-visible:ring-[3px] focus-visible:ring-primary/20",
                  localError
                    ? "border-destructive/60"
                    : "border-border focus-visible:border-primary/60",
                )}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLoading ? "Loading…" : "Enter display name"}
                maxLength={USERNAME_MAX}
                autoComplete="off"
                aria-invalid={Boolean(localError)}
                data-testid="profile-username-input"
              />
              <Button
                type="submit"
                variant="brand"
                disabled={!canSave}
                className="profile-save-btn shrink-0"
                data-testid="profile-settings-save"
              >
                {saving ? <Loader2 className="animate-spin" /> : null}
                {saving ? "Saving…" : isDirty ? "Save changes" : "Saved"}
              </Button>
            </div>
            {localError ? (
              <p className="text-xs font-medium text-rose-400">{localError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Your display name is linked to your connected Stellar wallet address and must be
                unique.
              </p>
            )}
          </form>

          {mounted && walletMeta.address && (
            <div className="flex items-center justify-center gap-2 font-mono text-xs text-muted-foreground sm:justify-start">
              <span data-testid="profile-address">{shortenAddress(walletMeta.address)}</span>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                onClick={() => void handleCopy()}
                aria-label="Copy wallet address"
                data-testid="profile-address-copy"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-400" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {mounted && walletMeta.connected && (
              <Badge
                variant="outline"
                className="gap-1.5 border-primary/30 font-mono text-primary"
                data-testid="profile-network-badge"
              >
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
                {walletMeta.network}
              </Badge>
            )}

            {profile?.ageConfirmedAt ? (
              <Badge variant="outline" className="gap-1.5 border-emerald-400/30 text-emerald-400">
                <ShieldCheck className="size-3" aria-hidden />
                18+ confirmed
              </Badge>
            ) : null}

            {telegramLinked ? (
              <Badge
                variant="outline"
                className="gap-1.5 border-sky-500/40 text-sky-300"
                data-testid="profile-telegram-linked"
              >
                <span className="size-1.5 rounded-full bg-sky-400" aria-hidden />
                Telegram: {profile?.telegramHandle || `@user_${profile?.telegramUserId}`}
              </Badge>
            ) : (
              <a
                href="/link"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-sky-500/50 hover:text-sky-300"
                data-testid="profile-telegram-unlinked"
              >
                <Send className="size-3" aria-hidden />
                Link Telegram
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Wallet */}
      <div>
        <h2 className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Wallet
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" data-testid="profile-wallet-row">
          <StatTile
            label="Balance"
            value={
              balance.isUnfunded ? "Unfunded" : balance.formatted ? `${balance.formatted} XLM` : "—"
            }
            empty={!mounted || !walletMeta.connected}
            caption={
              !mounted || !walletMeta.connected ? "Not connected" : "Live from Horizon"
            }
            data-testid="profile-wallet-balance"
          />
          <StatTile
            label="Status"
            value={mounted && walletMeta.connected ? "Connected" : "Disconnected"}
            caption={mounted && walletMeta.connected ? "Freighter session active" : "No wallet"}
          />
          <StatTile
            label="Network"
            value={mounted ? walletMeta.network : "Unknown"}
            caption="Stellar"
          />
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Stats
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="profile-stats-grid">
          {/* No settlement data source exists yet, so these read empty rather
              than showing invented lifetime figures. */}
          <StatTile label="Games played" value="0" empty caption="No rounds settled yet" />
          <StatTile label="Win rate" value="0%" empty caption="Needs at least one round" />
          <StatTile label="Badges" value="0" empty caption="No badges minted yet" />
          <StatTile
            label="Member since"
            value={formatDate(profile?.createdAt)}
            empty={!profile?.createdAt}
            caption="Account created"
            data-testid="profile-member-since"
          />
        </div>
      </div>
    </section>
  );
};

export default ProfileSettings;
