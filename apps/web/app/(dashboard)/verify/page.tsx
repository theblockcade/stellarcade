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
  XCircle,
  HelpCircle,
  Dices,
  Sparkles,
} from "lucide-react";
import { Button } from "../../../src/components/ui/button";
import { motion } from "framer-motion";
import {
  verifyFairnessProof,
  FAIRNESS_TEST_VECTORS,
  type FairnessVerificationOutcome,
  type VerificationInput,
  type TestVectorPreset,
} from "../../../src/utils/fairness-verifier";
import styles from "./verify.module.css";

const DEFAULT_INPUT: VerificationInput = {
  serverSeed: FAIRNESS_TEST_VECTORS[0].input.serverSeed,
  commitHash: FAIRNESS_TEST_VECTORS[0].input.commitHash,
  clientSeed: FAIRNESS_TEST_VECTORS[0].input.clientSeed,
  nonce: FAIRNESS_TEST_VECTORS[0].input.nonce,
  ledgerHash: FAIRNESS_TEST_VECTORS[0].input.ledgerHash,
  rangeSize: 2,
};

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState<VerificationInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<FairnessVerificationOutcome | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

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
      2
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
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.75rem",
        width: "100%",
      }}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <ShieldCheck size={32} style={{ color: "var(--sc-accent)" }} />
          <h1 className={styles.title}>Provable Fairness Verifier</h1>
        </div>
        <p className={styles.subtitle}>
          Verify the cryptographic fairness of any StellarCade game round client-side.
          Recomputes SHA-256 seed commitments, entropy mixes, and game outcomes offline without
          relying on server trust.
        </p>
      </div>

      {/* Preset Selector */}
      <section className={styles.presetBar} aria-labelledby="presets-heading">
        <div className={styles.presetLabel} id="presets-heading">
          Quick-Load Verified Test Vectors:
        </div>
        <div className={styles.presetButtons}>
          {FAIRNESS_TEST_VECTORS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={styles.presetBtn}
              onClick={() => handleApplyPreset(preset)}
              data-testid={`preset-${preset.id}`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </section>

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Verification Form */}
        <section className={styles.formCard} aria-labelledby="verifier-inputs-heading">
          <div className={styles.cardHeading} id="verifier-inputs-heading">
            <Dices size={18} style={{ color: "var(--sc-accent)" }} />
            Round Proof Inputs
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="server-seed-input">
              <span>Revealed Server Seed (Hex)</span>
              <span className={styles.labelOptional}>Required</span>
            </label>
            <input
              id="server-seed-input"
              className={styles.input}
              type="text"
              placeholder="e.g. d9e87b92f..."
              value={input.serverSeed}
              onChange={(e) => setInput({ ...input, serverSeed: e.target.value })}
              data-testid="input-server-seed"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="commit-hash-input">
              <span>Published Commitment Hash (SHA-256)</span>
              <span className={styles.labelOptional}>Optional (Pre-bet hash)</span>
            </label>
            <input
              id="commit-hash-input"
              className={styles.input}
              type="text"
              placeholder="e.g. 0b15a6cfec..."
              value={input.commitHash || ""}
              onChange={(e) => setInput({ ...input, commitHash: e.target.value })}
              data-testid="input-commit-hash"
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="client-seed-input">
                <span>Client Seed</span>
              </label>
              <input
                id="client-seed-input"
                className={styles.input}
                type="text"
                value={input.clientSeed}
                onChange={(e) => setInput({ ...input, clientSeed: e.target.value })}
                data-testid="input-client-seed"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="nonce-input">
                <span>Round Nonce</span>
              </label>
              <input
                id="nonce-input"
                className={styles.input}
                type="text"
                value={String(input.nonce)}
                onChange={(e) => setInput({ ...input, nonce: e.target.value })}
                data-testid="input-nonce"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="ledger-hash-input">
              <span>Stellar Ledger Hash</span>
            </label>
            <input
              id="ledger-hash-input"
              className={styles.input}
              type="text"
              placeholder="e.g. 4b6c317db..."
              value={input.ledgerHash}
              onChange={(e) => setInput({ ...input, ledgerHash: e.target.value })}
              data-testid="input-ledger-hash"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="game-range-select">
              <span>Game Outcome Space</span>
            </label>
            <select
              id="game-range-select"
              className={styles.select}
              value={input.rangeSize || 2}
              onChange={(e) => setInput({ ...input, rangeSize: Number(e.target.value) })}
              data-testid="select-game-range"
            >
              <option value={2}>Coin Flip (2 outcomes: Heads / Tails)</option>
              <option value={6}>Dice Roll (6 outcomes: 1 to 6)</option>
              <option value={100}>Number Guess / Percentile (100 outcomes: 1 to 100)</option>
              <option value={37}>Roulette (37 outcomes: 0 to 36)</option>
            </select>
          </div>

          <Button
            type="button"
            onClick={runVerification}
            style={{ marginTop: "0.5rem" }}
            data-testid="verify-execute-btn"
          >
            <RotateCcw size={14} style={{ marginRight: "0.5rem" }} />
            Recompute Proof
          </Button>
        </section>

        {/* Verification Results Panel */}
        <section className={styles.resultsCard} aria-labelledby="verifier-results-heading">
          <div className={styles.cardHeading} id="verifier-results-heading">
            <Sparkles size={18} style={{ color: "var(--sc-accent)" }} />
            Cryptographic Audit Results
          </div>

          {result ? (
            <>
              {/* Status Banner */}
              <div
                className={`${styles.statusBanner} ${
                  result.isValid ? styles.statusBannerValid : styles.statusBannerInvalid
                }`}
                data-testid="verification-status-banner"
              >
                {result.isValid ? (
                  <CheckCircle2 size={28} />
                ) : (
                  <ShieldAlert size={28} />
                )}
                <div>
                  <h3 className={styles.statusBannerTitle}>
                    {result.isValid ? "PROVABLY FAIR VERIFIED" : "VERIFICATION FAILED"}
                  </h3>
                  {result.isValid && (
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--sc-accent, #00ffcc)", textTransform: "uppercase", marginTop: "2px" }}>
                      Commitment Verified
                    </div>
                  )}
                  <p className={styles.statusBannerSubtitle}>
                    {result.isValid
                      ? "All seed commitments match and the outcome is cryptographically authentic."
                      : "The revealed seed material does not match the published commitments."}
                  </p>
                </div>
              </div>

              {/* Outcome Box */}
              <div className={styles.outcomeBox} data-testid="verification-outcome-box">
                <span className={styles.outcomeLabel}>Derived Outcome Value</span>
                <span className={styles.outcomeValue} data-testid="outcome-value-text">
                  {result.gameLabel}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--sc-text-dim)" }}>
                  Modulo mapped from 256-bit entropy digest
                </span>
              </div>

              {/* Step by Step Breakdown */}
              <div className={styles.stepList}>
                {result.steps.map((step, idx) => (
                  <div key={idx} className={styles.stepItem} data-testid={`step-item-${idx}`}>
                    <div className={styles.stepHeader}>
                      <span className={styles.stepTitle}>{step.step}</span>
                      <span
                        className={`${styles.stepTag} ${
                          step.passed ? styles.stepPass : styles.stepFail
                        }`}
                      >
                        {step.passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>
                    <div className={styles.stepHash}>Actual: {step.actual}</div>
                    <p className={styles.stepDetails}>{step.details}</p>
                  </div>
                ))}
              </div>

              {/* Copy Audit Report */}
              <div className={styles.copyArea}>
                <span style={{ fontSize: "0.8125rem", color: "var(--sc-text-dim)" }}>
                  Export Proof Audit Summary
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyReport}
                  data-testid="btn-copy-report"
                >
                  {copied ? (
                    <>
                      <Check size={14} style={{ marginRight: "0.4rem", color: "#4ade80" }} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} style={{ marginRight: "0.4rem" }} />
                      Copy Audit JSON
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div style={{ color: "var(--sc-text-dim)", fontSize: "0.875rem" }}>
              Evaluating proof...
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", color: "var(--sc-text-dim)" }}>Loading verifier...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}
