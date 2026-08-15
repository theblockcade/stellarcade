"use client";

import React, { useState, useEffect, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Copy,
  Check,
  CheckCircle2,
  Dices,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "../../../src/components/ui/badge";
import { Button } from "../../../src/components/ui/button";
import { PageHeader } from "../../../src/components/ui/page-header";
import { cn } from "../../../src/lib/utils";
import {
  verifyFairnessProof,
  FAIRNESS_TEST_VECTORS,
  type FairnessVerificationOutcome,
  type VerificationInput,
  type TestVectorPreset,
} from "../../../src/utils/fairness-verifier";

const DEFAULT_INPUT: VerificationInput = {
  serverSeed: FAIRNESS_TEST_VECTORS[0].input.serverSeed,
  commitHash: FAIRNESS_TEST_VECTORS[0].input.commitHash,
  clientSeed: FAIRNESS_TEST_VECTORS[0].input.clientSeed,
  nonce: FAIRNESS_TEST_VECTORS[0].input.nonce,
  ledgerHash: FAIRNESS_TEST_VECTORS[0].input.ledgerHash,
  rangeSize: 2,
};

/** Shared field chrome — dark glass input with an accent focus ring. */
const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-background/60 px-3 py-2.5 font-mono text-[13px] text-foreground " +
  "outline-none transition-colors placeholder:text-muted-foreground/60 " +
  "focus-visible:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-primary/20";

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-foreground">{label}</span>
        {hint ? (
          <span className="text-[10px] tracking-[0.1em] text-muted-foreground uppercase">{hint}</span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

function SectionCard({
  id,
  icon,
  title,
  className,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card/60 backdrop-blur-sm",
        className,
      )}
    >
      <h2
        id={id}
        className="flex items-center gap-2 border-b border-border/70 px-5 py-4 text-sm font-semibold text-foreground [&_svg]:size-4.5 [&_svg]:text-primary"
      >
        {icon}
        {title}
      </h2>
      <div className="flex flex-1 flex-col gap-4 p-5">{children}</div>
    </section>
  );
}

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState<VerificationInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<FairnessVerificationOutcome | null>(null);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!searchParams) return;
    const serverSeed = searchParams.get("serverSeed") || searchParams.get("secret");
    const commitHash = searchParams.get("commitHash") || searchParams.get("hash");
    const clientSeed = searchParams.get("clientSeed");
    const nonce = searchParams.get("nonce");
    const rangeSize = searchParams.get("rangeSize");

    if (serverSeed || commitHash || clientSeed) {
      setInput((prev) => ({
        ...prev,
        serverSeed: serverSeed ?? prev.serverSeed,
        commitHash: commitHash ?? prev.commitHash,
        clientSeed: clientSeed ?? prev.clientSeed,
        nonce: nonce ? Number(nonce) : prev.nonce,
        rangeSize: rangeSize ? Number(rangeSize) : prev.rangeSize,
      }));
    }
  }, [searchParams]);

  const runVerification = () => {
    startTransition(async () => {
      const outcome = await verifyFairnessProof(input);
      setResult(outcome);
    });
  };

  useEffect(() => {
    runVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.serverSeed, input.commitHash, input.clientSeed, input.nonce, input.ledgerHash, input.rangeSize]);

  const handleApplyPreset = (preset: TestVectorPreset) => {
    setInput({ ...preset.input });
  };

  const handleCopyReport = () => {
    if (!result) return;
    const report = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        verified: result.isValid,
        serverSeedCommitMatch: result.commitmentMatch,
        recomputedCommitHash: result.recomputedCommitHash,
        derivedHex: result.derivedHex,
        mappedOutcome: result.mappedOutcome,
        gameLabel: result.gameLabel,
        input,
      },
      null,
      2,
    );
    navigator.clipboard?.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto flex w-full max-w-7xl flex-col gap-6"
    >
      <PageHeader
        icon={<ShieldCheck />}
        eyebrow={
          <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
            <Sparkles className="size-3" aria-hidden />
            Runs entirely in your browser
          </Badge>
        }
        title="Provable Fairness Verifier"
        description="Verify the cryptographic fairness of any StellarCade round client-side. Recomputes SHA-256 seed commitments, entropy mixes, and game outcomes offline — no server trust required."
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Quick-load test vectors
          </span>
          {FAIRNESS_TEST_VECTORS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              data-testid={`preset-${preset.id}`}
              className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SectionCard id="verifier-inputs-heading" icon={<Dices />} title="Round Proof Inputs">
          <Field id="server-seed-input" label="Revealed Server Seed (Hex)" hint="Required">
            <input
              id="server-seed-input"
              className={FIELD_CLASS}
              type="text"
              placeholder="e.g. d9e87b92f..."
              value={input.serverSeed}
              onChange={(e) => setInput({ ...input, serverSeed: e.target.value })}
              data-testid="input-server-seed"
            />
          </Field>

          <Field
            id="commit-hash-input"
            label="Published Commitment Hash (SHA-256)"
            hint="Optional · pre-bet hash"
          >
            <input
              id="commit-hash-input"
              className={FIELD_CLASS}
              type="text"
              placeholder="e.g. 0b15a6cfec..."
              value={input.commitHash || ""}
              onChange={(e) => setInput({ ...input, commitHash: e.target.value })}
              data-testid="input-commit-hash"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="client-seed-input" label="Client Seed">
              <input
                id="client-seed-input"
                className={FIELD_CLASS}
                type="text"
                value={input.clientSeed}
                onChange={(e) => setInput({ ...input, clientSeed: e.target.value })}
                data-testid="input-client-seed"
              />
            </Field>

            <Field id="nonce-input" label="Round Nonce">
              <input
                id="nonce-input"
                className={FIELD_CLASS}
                type="text"
                value={String(input.nonce)}
                onChange={(e) => setInput({ ...input, nonce: e.target.value })}
                data-testid="input-nonce"
              />
            </Field>
          </div>

          <Field id="ledger-hash-input" label="Stellar Ledger Hash">
            <input
              id="ledger-hash-input"
              className={FIELD_CLASS}
              type="text"
              placeholder="e.g. 4b6c317db..."
              value={input.ledgerHash}
              onChange={(e) => setInput({ ...input, ledgerHash: e.target.value })}
              data-testid="input-ledger-hash"
            />
          </Field>

          <Field id="game-range-select" label="Game Outcome Space">
            <select
              id="game-range-select"
              className={cn(FIELD_CLASS, "font-sans")}
              value={input.rangeSize || 2}
              onChange={(e) => setInput({ ...input, rangeSize: Number(e.target.value) })}
              data-testid="select-game-range"
            >
              <option value={2}>Coin Flip (2 outcomes: Heads / Tails)</option>
              <option value={6}>Dice Roll (6 outcomes: 1 to 6)</option>
              <option value={100}>Number Guess / Percentile (100 outcomes: 1 to 100)</option>
              <option value={37}>Roulette (37 outcomes: 0 to 36)</option>
            </select>
          </Field>

          <Button
            type="button"
            variant="brand"
            onClick={runVerification}
            className="mt-auto self-start"
            data-testid="verify-execute-btn"
          >
            <RotateCcw />
            Recompute Proof
          </Button>
        </SectionCard>

        <SectionCard
          id="verifier-results-heading"
          icon={<Sparkles />}
          title="Cryptographic Audit Results"
        >
          {result ? (
            <>
              <div
                data-testid="verification-status-banner"
                className={cn(
                  "flex items-start gap-3.5 rounded-xl border p-4",
                  result.isValid
                    ? "border-emerald-400/30 bg-emerald-400/5"
                    : "border-rose-400/30 bg-rose-400/5",
                )}
              >
                {result.isValid ? (
                  <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-emerald-400" aria-hidden />
                ) : (
                  <ShieldAlert className="mt-0.5 size-7 shrink-0 text-rose-400" aria-hidden />
                )}
                <div className="min-w-0">
                  <h3
                    className={cn(
                      "text-sm font-bold tracking-wide",
                      result.isValid ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {result.isValid ? "PROVABLY FAIR VERIFIED" : "VERIFICATION FAILED"}
                  </h3>
                  {result.isValid && (
                    <p className="mt-0.5 text-[11px] font-bold tracking-wide text-primary uppercase">
                      Commitment Verified
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {result.isValid
                      ? "All seed commitments match and the outcome is cryptographically authentic."
                      : "The revealed seed material does not match the published commitments."}
                  </p>
                </div>
              </div>

              <div
                data-testid="verification-outcome-box"
                className="flex flex-col items-center gap-1 rounded-xl border border-primary/25 bg-primary/5 px-4 py-5 text-center"
              >
                <span className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Derived Outcome Value
                </span>
                <span
                  data-testid="outcome-value-text"
                  className="font-mono text-2xl font-bold text-primary"
                >
                  {result.gameLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  Modulo mapped from 256-bit entropy digest
                </span>
              </div>

              <ol className="flex flex-col gap-2.5">
                {result.steps.map((step, idx) => (
                  <li
                    key={idx}
                    data-testid={`step-item-${idx}`}
                    className="rounded-xl border border-border bg-background/40 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">{step.step}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider",
                          step.passed
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-rose-400/10 text-rose-400",
                        )}
                      >
                        {step.passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>
                    <p className="mt-2 truncate font-mono text-[11px] text-primary/80">
                      Actual: {step.actual}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{step.details}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                <span className="text-[13px] text-muted-foreground">Export Proof Audit Summary</span>
                <Button size="sm" variant="outline" onClick={handleCopyReport} data-testid="btn-copy-report">
                  {copied ? (
                    <>
                      <Check className="text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy />
                      Copy Audit JSON
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Evaluating proof…</p>
          )}
        </SectionCard>
      </div>
    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Loading verifier…</p>}>
      <VerifyPageContent />
    </Suspense>
  );
}
