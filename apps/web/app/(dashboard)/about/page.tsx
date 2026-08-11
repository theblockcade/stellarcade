"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Scale,
  Code2,
  Layers,
  Zap,
  Lock,
  Trophy,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../../src/components/ui/button";
import { motion } from "framer-motion";

const ECOSYSTEM_REPOS = [
  {
    name: "stellarcade",
    title: "Web App & Soroban Contracts",
    description:
      "The full Next.js frontend experience and comprehensive Rust Soroban smart contract catalog powering on-chain arcade rooms, game logic, and prize vaults.",
    badge: "Next.js 15 • Soroban Rust",
    github: "https://github.com/theblockcade/stellarcade",
  },
  {
    name: "stellarcade-sdk",
    title: "TypeScript SDK & Client Verifier",
    description:
      "Universal TypeScript SDK providing client-side WebCrypto fairness verification, Freighter wallet connectors, RPC helpers, and typed game APIs.",
    badge: "TypeScript • WebCrypto",
    github: "https://github.com/theblockcade/stellarcade-sdk",
  },
  {
    name: "stellarcade-arbiter",
    title: "High-Throughput Settlement Arbiter",
    description:
      "Deterministic off-chain settlement service managing commit-reveal cycles, ledger hash commitments, and hash-chained dispute resolution audit trails.",
    badge: "TypeScript • Node.js",
    github: "https://github.com/theblockcade/stellarcade-arbiter",
  },
  {
    name: "stellarcade-bot",
    title: "Community Discord & Telegram Bot",
    description:
      "Automated chat interfaces supporting non-custodial Ed25519 challenge-response wallet linking, real-time leaderboard queries, and quest tracking.",
    badge: "Telegram • Discord • Ed25519",
    github: "https://github.com/theblockcade/stellarcade-bot",
  },
];

const MISSION_PILLARS = [
  {
    icon: <ShieldCheck size={20} />,
    title: "Provably Fair by Design",
    body: "Every game round outcome is derived deterministically from the combination of a secret server seed, player client seed, per-round nonce, and live Stellar ledger hash.",
  },
  {
    icon: <Lock size={20} />,
    title: "Zero Custody",
    body: "We never take custody of your keys or funds. Connect your self-custodied Freighter wallet and sign transactions only when initiating rounds or claiming prizes.",
  },
  {
    icon: <Zap size={20} />,
    title: "Soroban Speed & Low Fees",
    body: "Built directly on Stellar's Soroban smart contract platform, enabling 5-second ledger closes and fractions of a cent per transaction without layer-2 complexity.",
  },
  {
    icon: <Trophy size={20} />,
    title: "On-Chain Reward Pools",
    body: "Tournament prize pools and daily quest rewards are held in smart contracts and distributed automatically according to immutable rules.",
  },
];

export default function AboutPage() {
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
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, rgba(0, 255, 204, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)",
          borderRadius: "20px",
          border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
          padding: "2rem",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 10px",
            borderRadius: "999px",
            background: "rgba(0, 255, 204, 0.15)",
            color: "var(--sc-accent, #00ffcc)",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          <Layers size={14} />
          <span>Ecosystem Architecture</span>
        </div>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 0.5rem 0" }}>
          About <span style={{ color: "var(--sc-accent, #00ffcc)" }}>StellarCade</span>
        </h1>
        <p style={{ color: "var(--sc-text-dim, #94a3b8)", fontSize: "1rem", margin: 0 }}>
          A decentralized, provably fair gaming ecosystem built natively on Stellar and Soroban.
          Engineered for complete transparency, instant settlement, and non-custodial play.
        </p>
      </section>

      {/* Mission Pillars */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={22} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            Core Engineering Principles
          </h2>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", fontSize: "13px", margin: 0 }}>
            How StellarCade guarantees trustless fairness and player sovereignty across all game modes.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
          {MISSION_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              style={{
                background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
                borderRadius: "16px",
                border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(0, 255, 204, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--sc-accent, #00ffcc)",
                  }}
                >
                  {pillar.icon}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>{pillar.title}</h3>
              </div>
              <p style={{ color: "var(--sc-text-dim, #cbd5e1)", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Fairness Explainer */}
      <section
        style={{
          background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
          borderRadius: "16px",
          border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Scale size={24} style={{ color: "var(--sc-accent, #00ffcc)" }} />
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>How Provable Fairness Works</h2>
            <p style={{ color: "var(--sc-text-dim, #94a3b8)", fontSize: "13px", margin: 0 }}>
              Neither the server nor the player can manipulate round results.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {[
            {
              step: "Step 1: Commitment",
              title: "Server Commitment",
              body: "Before you wager, the server generates a secret seed and publishes its cryptographic SHA-256 hash (commitHash), locking its value in advance.",
            },
            {
              step: "Step 2: Entropy Mix",
              title: "Client & Ledger Seed",
              body: "Your client provides a client seed, combines it with the current Stellar ledger hash and round nonce. Neither party can unilaterally dictate entropy.",
            },
            {
              step: "Step 3: Verification",
              title: "Client Verification",
              body: "After settlement, the server reveals serverSeed. You can independently verify that the seed matches the commitment and recompute the final outcome offline.",
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "1.25rem",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--sc-accent, #00ffcc)",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                {item.step}
              </span>
              <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 6px 0" }}>{item.title}</h4>
              <p style={{ color: "var(--sc-text-dim, #cbd5e1)", fontSize: "13px", margin: 0 }}>{item.body}</p>
            </div>
          ))}
        </div>

        <div>
          <Button asChild size="sm" variant="brand">
            <Link href="/verify">
              Launch Interactive Fairness Verifier
              <ArrowRight size={14} style={{ marginLeft: "0.5rem" }} />
            </Link>
          </Button>
        </div>
      </section>

      {/* The 4 Repositories */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Code2 size={22} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            The StellarCade Family Repositories
          </h2>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", fontSize: "13px", margin: 0 }}>
            The four specialized codebases that comprise the open-source StellarCade ecosystem.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
          {ECOSYSTEM_REPOS.map((repo) => (
            <div
              key={repo.name}
              style={{
                background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
                borderRadius: "16px",
                border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1.25rem",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: "rgba(0, 255, 204, 0.15)",
                    color: "var(--sc-accent, #00ffcc)",
                    display: "inline-block",
                    marginBottom: "8px",
                  }}
                >
                  {repo.badge}
                </span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0 0 6px 0" }}>{repo.title}</h3>
                <p style={{ color: "var(--sc-text-dim, #cbd5e1)", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
                  {repo.description}
                </p>
              </div>

              <div>
                <a
                  href={repo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--sc-accent, #00ffcc)",
                    fontSize: "12px",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  <span>github.com/theblockcade/{repo.name}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
