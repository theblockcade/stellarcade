import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "../../../src/components/ui/button";

export default function PrivacyPage() {
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
          <Lock size={28} style={{ color: "var(--sc-accent, #00ffcc)" }} />
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Privacy & Data Architecture</h1>
        </div>
        <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "0.875rem" }}>
          Zero tracking · Zero custody · Client-side key isolation
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
            1. Zero Personal Data Collection
          </h2>
          <p style={{ margin: 0, color: "var(--sc-text-dim, #cbd5e1)" }}>
            StellarCade does not require user registration, email addresses, names, or passwords. Interaction is established strictly through cryptographic signatures initiated by your connected wallet (Freighter).
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "var(--sc-accent, #00ffcc)" }}>
            2. Local Browser Storage
          </h2>
          <p style={{ margin: 0, color: "var(--sc-text-dim, #cbd5e1)" }}>
            Preferences such as table density, dismissed onboarding missions, and cached session metadata are stored locally on your device in standard browser <code style={{ background: "rgba(255,255,255,0.1)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>localStorage</code> and <code style={{ background: "rgba(255,255,255,0.1)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>sessionStorage</code>. No cross-site advertising cookies or invasive tracking pixels are used.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "var(--sc-accent, #00ffcc)" }}>
            3. On-Chain Ledger Transparency
          </h2>
          <p style={{ margin: 0, color: "var(--sc-text-dim, #cbd5e1)" }}>
            Transactions, game stakes, contract calls, and prize claims submitted through the protocol are broadcast to the public Stellar blockchain. Public ledger entries (including transaction hashes and public Stellar addresses) are permanent and publicly auditable by design.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 0, color: "var(--sc-accent, #00ffcc)" }}>
            4. Audit & Verification Rights
          </h2>
          <p style={{ margin: 0, color: "var(--sc-text-dim, #cbd5e1)" }}>
            Any player can independently audit and verify game entropy, seed commitments, and contract state using the open-source verifier tool at <Link href="/verify" style={{ color: "var(--sc-accent, #00ffcc)", textDecoration: "underline" }}>/verify</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
