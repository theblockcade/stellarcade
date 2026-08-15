"use client";

import * as React from "react";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";

import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useWalletStatus } from "../hooks/useWalletStatus";
import {
  USERNAME_MAX,
  USERNAME_MIN,
  createProfile,
  validateUsername,
} from "../services/profile-service";

export interface ProfileOnboardingDialogProps {
  open: boolean;
  onCompleted?: () => void;
}

/**
 * First-run setup for a wallet that has no profile yet.
 *
 * Deliberately has no dismiss control and no "skip": the two things it
 * collects — a username the player picked themselves, and an explicit
 * 18-or-over confirmation — are the two things the app previously invented
 * on the player's behalf. The username used to default to
 * `Player_<last4>` (or, worse, be inherited from whichever profile the API
 * had touched most recently), and age was never asked at all.
 */
export function ProfileOnboardingDialog({ open, onCompleted }: ProfileOnboardingDialogProps) {
  const wallet = useWalletStatus();
  const [username, setUsername] = React.useState("");
  const [ageConfirmed, setAgeConfirmed] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const localError = username.trim() ? validateUsername(username) : null;
  const canSubmit =
    !submitting && !!username.trim() && !localError && ageConfirmed && !!wallet.address;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const problem = validateUsername(username);
    if (problem) {
      setError(problem);
      return;
    }
    if (!ageConfirmed) {
      setError("You must confirm you are 18 or over to play.");
      return;
    }
    if (!wallet.address) {
      setError("Connect a wallet before setting up your profile.");
      return;
    }

    setSubmitting(true);
    const result = await createProfile({
      address: wallet.address,
      username: username.trim(),
      ageConfirmed,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    onCompleted?.();
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      data-testid="profile-onboarding"
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <header className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
            <UserPlus className="size-6" aria-hidden />
          </span>
          <h2 id="onboarding-title" className="text-xl font-bold tracking-tight text-foreground">
            Set up your player profile
          </h2>
          <p className="text-sm text-muted-foreground">
            This wallet is new to StellarCade. Pick the name other players will see.
          </p>
          {wallet.address ? (
            <p className="font-mono text-xs text-muted-foreground">
              {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </p>
          ) : null}
        </header>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-username" className="text-xs font-semibold text-foreground">
            Username
          </label>
          <input
            id="onboarding-username"
            ref={inputRef}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. nova_runner"
            maxLength={USERNAME_MAX}
            autoComplete="off"
            aria-describedby="onboarding-username-hint"
            aria-invalid={Boolean(localError)}
            className={cn(
              "w-full rounded-lg border bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors",
              "placeholder:text-muted-foreground/60 focus-visible:ring-[3px] focus-visible:ring-primary/20",
              localError ? "border-destructive/60" : "border-border focus-visible:border-primary/60",
            )}
            data-testid="onboarding-username-input"
          />
          <p id="onboarding-username-hint" className="text-[11px] text-muted-foreground">
            {USERNAME_MIN}–{USERNAME_MAX} characters. Letters, numbers, and . _ - only. Must be
            unique.
          </p>
          {localError ? (
            <p className="text-[11px] font-medium text-rose-400">{localError}</p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/40 p-3.5">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[color:var(--sc-accent)]"
            data-testid="onboarding-age-checkbox"
          />
          <span className="text-[13px] leading-relaxed text-muted-foreground">
            I confirm I am <strong className="text-foreground">18 years or older</strong> and that
            wagering is legal where I live.
          </span>
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-rose-300"
            data-testid="onboarding-error"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="brand"
          size="lg"
          disabled={!canSubmit}
          data-testid="onboarding-submit"
        >
          {submitting ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
          {submitting ? "Creating profile…" : "Create profile"}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Your profile is tied to this wallet address. StellarCade never takes custody of your keys
          or funds.
        </p>
      </form>
    </div>
  );
}

export default ProfileOnboardingDialog;
