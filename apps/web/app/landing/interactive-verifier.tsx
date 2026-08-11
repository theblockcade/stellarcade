"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, RefreshCw, ArrowRight, Key, Hash, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyFairnessProof, type FairnessVerificationOutcome } from "@/utils/fairness-verifier";

export function InteractiveVerifierSandbox() {
  const [serverSeed, setServerSeed] = useState(
    "d4e5f601728394a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456"
  );
  const [clientSeed, setClientSeed] = useState("GBZXN7PIRZGNMHGA72STUFIO-4921");
  const [nonce, setNonce] = useState(1);
  const [rangeSize, setRangeSize] = useState(2);
  const [commitHash, setCommitHash] = useState(
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  );
  const [result, setResult] = useState<FairnessVerificationOutcome | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const outcome = await verifyFairnessProof({
        serverSeed,
        commitHash,
        clientSeed,
        nonce,
        ledgerHash: "49a7c3b8...e92f",
        rangeSize,
      });
      setResult(outcome);
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePreset = (gameType: "coinflip" | "dice") => {
    if (gameType === "coinflip") {
      setRangeSize(2);
      setClientSeed("GBZXN7PIRZGNMHGA72STUFIO-4921");
      setNonce(1);
    } else {
      setRangeSize(6);
      setClientSeed("DICE-PLAYER-ENTROPY-88");
      setNonce(3);
    }
    setResult(null);
  };

  return (
    <div
      style={{
        background: "rgba(10, 10, 10, 0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
        borderRadius: "24px",
        padding: "32px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(0, 255, 204, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--sc-accent, #00ffcc)",
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Live Cryptographic Sandbox</h3>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--sc-text-dim, #94a3b8)" }}>
              Test real SHA-256 WebCrypto proof derivation directly in your browser.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => handlePreset("coinflip")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 600,
              border: rangeSize === 2 ? "1px solid var(--sc-accent, #00ffcc)" : "1px solid rgba(255,255,255,0.1)",
              background: rangeSize === 2 ? "rgba(0, 255, 204, 0.15)" : "transparent",
              color: rangeSize === 2 ? "var(--sc-accent, #00ffcc)" : "#fff",
              cursor: "pointer",
            }}
          >
            🪙 Coinflip (50/50)
          </button>
          <button
            type="button"
            onClick={() => handlePreset("dice")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 600,
              border: rangeSize === 6 ? "1px solid var(--sc-accent, #00ffcc)" : "1px solid rgba(255,255,255,0.1)",
              background: rangeSize === 6 ? "rgba(0, 255, 204, 0.15)" : "transparent",
              color: rangeSize === 6 ? "var(--sc-accent, #00ffcc)" : "#fff",
              cursor: "pointer",
            }}
          >
            🎲 Dice (1-6)
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--sc-text-dim, #94a3b8)", marginBottom: "6px" }}>
            Revealed Server Seed (Secret):
          </label>
          <input
            type="text"
            value={serverSeed}
            onChange={(e) => setServerSeed(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "var(--sc-bg-dark, #050505)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              fontFamily: "var(--sc-font-mono, monospace)",
              fontSize: "12px",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--sc-text-dim, #94a3b8)", marginBottom: "6px" }}>
            Client Seed (Player Entropy):
          </label>
          <input
            type="text"
            value={clientSeed}
            onChange={(e) => setClientSeed(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "var(--sc-bg-dark, #050505)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              fontFamily: "var(--sc-font-mono, monospace)",
              fontSize: "12px",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "24px" }}>
        <Button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying}
          variant="brand"
          size="sm"
          style={{ padding: "10px 20px" }}
        >
          {isVerifying ? "Computing Proof..." : "⚡ Execute Cryptographic Proof"}
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/verify">
            Full Fairness Tool <ArrowRight size={14} style={{ marginLeft: "4px" }} />
          </Link>
        </Button>
      </div>

      {result && (
        <div
          style={{
            padding: "20px",
            borderRadius: "14px",
            background: "rgba(0, 255, 204, 0.05)",
            border: "1px solid rgba(0, 255, 204, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <CheckCircle2 size={20} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            <strong style={{ color: "var(--sc-accent, #00ffcc)", fontSize: "15px" }}>
              Cryptographic Proof Validated Offline
            </strong>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "13px" }}>
            <div>
              <span style={{ color: "var(--sc-text-dim, #94a3b8)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                Recomputed Commit Hash
              </span>
              <code style={{ color: "#fff", wordBreak: "break-all", fontSize: "11px" }}>
                {result.recomputedCommitHash.slice(0, 24)}...
              </code>
            </div>
            <div>
              <span style={{ color: "var(--sc-text-dim, #94a3b8)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                Derived Outcome
              </span>
              <strong style={{ color: "var(--sc-accent, #00ffcc)", fontSize: "16px" }}>
                {result.gameLabel}
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--sc-text-dim, #94a3b8)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                Formula
              </span>
              <span style={{ color: "var(--sc-text-dim, #cbd5e1)" }}>
                SHA-256(S : C : Nonce) mod {rangeSize}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InteractiveVerifierSandbox;
