import Link from "next/link";
import {
  ShieldCheck,
  Scale,
  Bot,
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
import styles from "./about.module.css";

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
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero} aria-labelledby="about-heading">
        <div className={styles.badge}>
          <Layers size={14} />
          <span>Ecosystem Architecture</span>
        </div>
        <h1 id="about-heading" className={styles.title}>
          About <span className={styles.titleHighlight}>StellarCade</span>
        </h1>
        <p className={styles.subtitle}>
          A decentralized, provably fair gaming ecosystem built natively on Stellar and Soroban.
          Engineered for complete transparency, instant settlement, and non-custodial play.
        </p>
      </section>

      {/* Mission Pillars */}
      <section className={styles.section} aria-labelledby="mission-heading">
        <h2 id="mission-heading" className={styles.sectionHeading}>
          <CheckCircle2 size={22} style={{ color: "var(--sc-accent)" }} />
          Core Engineering Principles
        </h2>
        <p className={styles.sectionDescription}>
          How StellarCade guarantees trustless fairness and player sovereignty across all game modes.
        </p>
        <div className={styles.grid2x2}>
          {MISSION_PILLARS.map((pillar) => (
            <div key={pillar.title} className={styles.card}>
              <div className={styles.cardIconHeader}>
                <div className={styles.cardIcon}>{pillar.icon}</div>
                <h3 className={styles.cardTitle}>{pillar.title}</h3>
              </div>
              <p className={styles.cardBody}>{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fairness Explainer */}
      <section className={styles.fairnessBanner} aria-labelledby="fairness-heading">
        <div className={styles.cardIconHeader}>
          <div className={styles.cardIcon}>
            <Scale size={20} />
          </div>
          <div>
            <h2 id="fairness-heading" className={styles.cardTitle} style={{ fontSize: "1.25rem" }}>
              How Provable Fairness Works
            </h2>
            <p className={styles.cardBody} style={{ marginTop: "0.25rem" }}>
              Neither the server nor the player can manipulate round results.
            </p>
          </div>
        </div>

        <div className={styles.fairnessSteps}>
          <div className={styles.stepCard}>
            <span className={styles.stepNumber}>Step 1: Commitment</span>
            <h4 className={styles.stepTitle}>Server Commitment</h4>
            <p className={styles.stepBody}>
              Before you wager, the server generates a secret seed and publishes its cryptographic
              SHA-256 hash (<code>commitHash</code>), locking its value in advance.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNumber}>Step 2: Entropy Mix</span>
            <h4 className={styles.stepTitle}>Client & Ledger Seed</h4>
            <p className={styles.stepBody}>
              Your client provides a client seed, combines it with the current Stellar ledger hash
              and round nonce. Neither party can unilaterally dictate entropy.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNumber}>Step 3: Verification</span>
            <h4 className={styles.stepTitle}>Client Verification</h4>
            <p className={styles.stepBody}>
              After settlement, the server reveals <code>serverSeed</code>. You can independently verify
              that the seed matches the commitment and recompute the final outcome offline.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "0.5rem" }}>
          <Button asChild size="sm">
            <Link href="/verify">
              Launch Interactive Fairness Verifier
              <ArrowRight size={14} style={{ marginLeft: "0.5rem" }} />
            </Link>
          </Button>
        </div>
      </section>

      {/* The 4 Repositories */}
      <section className={styles.section} aria-labelledby="repos-heading">
        <h2 id="repos-heading" className={styles.sectionHeading}>
          <Code2 size={22} style={{ color: "var(--sc-accent)" }} />
          The StellarCade Family Repositories
        </h2>
        <p className={styles.sectionDescription}>
          The four specialized codebases that comprise the open-source StellarCade ecosystem.
        </p>

        <div className={styles.grid2x2}>
          {ECOSYSTEM_REPOS.map((repo) => (
            <div key={repo.name} className={styles.card}>
              <span className={styles.repoBadge}>{repo.badge}</span>
              <h3 className={styles.cardTitle}>{repo.title}</h3>
              <p className={styles.cardBody}>{repo.description}</p>
              <div className={styles.repoLinks}>
                <a
                  href={repo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.repoLink}
                >
                  <span>github.com/theblockcade/{repo.name}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <div className={styles.ctaBar}>
        <div className={styles.ctaText}>
          <h3 className={styles.ctaTitle}>Ready to explore StellarCade?</h3>
          <p className={styles.ctaDesc}>
            Join provably fair games in the lobby or verify past round proofs.
          </p>
        </div>
        <div className={styles.ctaActions}>
          <Button asChild variant="outline">
            <Link href="/verify">Verify a Proof</Link>
          </Button>
          <Button asChild>
            <Link href="/app">Enter Arcade</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
