import React from "react";
import Link from "next/link";
import { FileText, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "../../../src/components/ui/button";

export default function TermsPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Button asChild variant="ghost" size="sm" style={{ marginBottom: "1rem" }}>
          <Link href="/app">
            <ArrowLeft size={14} style={{ marginRight: "0.4rem" }} />
            Back to Arcade
          </Link>
        </Button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <FileText size={28} style={{ color: "var(--sc-accent, #00ffcc)" }} />
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Terms of Protocol & Participation</h1>
        </div>
        <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "0.875rem" }}>
          Last updated: August 2026 · Decentralized protocol on Stellar Network
        </p>
      </div>

      <div
        style={{
          background: "var(--sc-bg-card, rgba(255,255,255,0.03))",
          border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
          borderRadius: "12px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          color: "var(--sc-text-main, #ffffff)",
          lineHeight: 1.7,
          fontSize: "0.9375rem",
        }}
      >
        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "var(--sc-accent, #00ffcc)" }}>
            1. Non-Custodial Protocol Operations
          </h2>
          <p style={{ margin: 0, color: "var(--sc-text-dim, #cbd5e1)" }}>
            StellarCade is a non-custodial gaming and arcade protocol operating on the Stellar network and Soroban smart contract environment. Users interact with the protocol directly via self-custodied wallet software (such as Freighter). At no point does StellarCade hold, store, or maintain custody over private keys, user funds, or digital assets.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "var(--sc-accent, #00ffcc)" }}>
            2. Provable Cryptographic Fairness
          </h2>
          <p style={{ margin: 0, color: "var(--sc-text-dim, #cbd5e1)" }}>
            All arcade game rounds and outcomes are settled deterministically using SHA-256 commit-reveal entropy and on-chain Soroban contract logic. Users are provided full access to client-side cryptographic verification tools at <Link href="/verify" style={{ color: "var(--sc-accent, #00ffcc)", textDecoration: "underline" }}>/verify</Link> and through the open-source <code style={{ background: "rgba(255,255,255,0.1)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>@stellarcade/sdk</code>.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "var(--sc-accent, #00ffcc)" }}>
            3. Network Fees & Settlement
          </h2>
          <p style={{ margin: 0, color: "var(--sc-text-dim, #cbd5e1)" }}>
            Every interaction (submitting bets, claiming prize pool payouts, or recovering trustline reserves) incurs standard Stellar network base transaction fees paid directly to validators. Payouts and prize pool splits are enforced strictly by contract code.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "var(--sc-accent, #00ffcc)" }}>
            4. User Responsibilities & Disclaimer
          </h2>
          <p style={{ margin: 0, color: "var(--sc-text-dim, #cbd5e1)" }}>
            Users are solely responsible for securing their browser wallet extensions and secret recovery phrases. StellarCade protocol smart contracts are deployed to Stellar Testnet and Public networks as open-source code without financial warranty.
          </p>
        </section>
      </div>
    </div>
  );
}
