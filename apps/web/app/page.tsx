import Link from "next/link";
import {
  Award,
  Bot,
  Code2,
  Gauge,
  ScrollText,
  ShieldCheck,
  Trophy,
  Wallet,
  Zap,
  Gamepad2,
  Dices,
  Coins,
  ArrowRight,
  TrendingUp,
  Cpu,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqAccordionMonochrome } from "@/components/ui/faq-monochrome";
import { LandingNav } from "./landing/nav";
import { FairnessProofMockup, PrizePoolMockup, QuestMockup } from "./landing/mockups";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { NeonMesh } from "@/components/ui/neon-mesh";
import { InteractiveVerifierSandbox } from "./landing/interactive-verifier";
import styles from "./page.module.css";

const PROTOCOL_METRICS = [
  { value: "250,000+", label: "XLM Wager Volume" },
  { value: "12,450", label: "Active Prize Vault (XLM)" },
  { value: "89,400+", label: "Provably Fair Rounds" },
  { value: "~3.2s", label: "Soroban Settlement" },
  { value: "100%", label: "Client-Signed & Non-Custodial" },
];

const FEATURED_GAMES = [
  {
    id: "coinflip-duel",
    icon: <Coins size={28} style={{ color: "var(--accent)" }} />,
    title: "Coinflip Duel",
    category: "1v1 PvP & House Match",
    wagerRange: "5 – 100 XLM",
    odds: "50.00% Exact Odds",
    desc: "Instant cryptographic coinflip duel backed by SHA-256 commit-reveal entropy and Soroban smart contracts.",
    href: "/games",
  },
  {
    id: "rng-dice",
    icon: <Dices size={28} style={{ color: "var(--accent)" }} />,
    title: "Verifiable Dice Roll",
    category: "Table & Dice",
    wagerRange: "10 – 250 XLM",
    odds: "1.98x – 5.80x Multiplier",
    desc: "Roll against modular smart contract entropy with customizable prediction targets and real-time payout execution.",
    href: "/games",
  },
  {
    id: "prizepool-gauntlet",
    icon: <Trophy size={28} style={{ color: "var(--accent)" }} />,
    title: "Prize Pool Gauntlet",
    category: "Jackpot Challenge",
    wagerRange: "25 – 500 XLM",
    odds: "Progressive Multiplier",
    desc: "Navigate escalating risk rounds to unlock accumulating community prize pool vaults and seasonal jackpot splits.",
    href: "/games",
  },
];

const FEATURES = [
  {
    icon: <ShieldCheck />,
    title: "Provably fair",
    body: "Every round settles from a commit-reveal proof you can verify yourself, offline — no trust in our servers required.",
  },
  {
    icon: <Wallet />,
    title: "No custody, ever",
    body: "Connect with Freighter. StellarCade never holds your keys or your funds.",
  },
  {
    icon: <ScrollText />,
    title: "Real prize pools",
    body: "Payouts are enforced on-chain by Soroban smart contracts, not a database row.",
  },
  {
    icon: <Zap />,
    title: "Built for Stellar",
    body: "Fast, low-fee settlement on Soroban — no waiting, no gas anxiety.",
  },
  {
    icon: <Trophy />,
    title: "Leaderboards & tournaments",
    body: "Compete on live leaderboards, or enter scheduled tournaments with pooled prizes.",
  },
  {
    icon: <Award />,
    title: "Quests & badges",
    body: "Daily and weekly quests earn XP and collectible badges tracked on your profile.",
  },
  {
    icon: <Code2 />,
    title: "Developer SDK",
    body: "@stellarcade/sdk ships the same fairness-verification and connector code the app runs on.",
  },
  {
    icon: <Bot />,
    title: "Telegram & Discord bot",
    body: "Link your wallet once, then check stats and claim rewards straight from chat — no custody there either.",
  },
  {
    icon: <Gauge />,
    title: "Audited settlement",
    body: "Every payout writes to a hash-chained audit log; disputes resolve against that chain, not a support ticket.",
  },
];

const FAQS = [
  {
    question: "Is StellarCade custodial?",
    answer:
      "No. StellarCade never holds your keys or your funds — you connect with Freighter and every transaction is signed in your own wallet.",
    meta: "Custody",
  },
  {
    question: "How do I know a round wasn't rigged?",
    answer:
      "Before you bet, the server publishes sha256(serverSeed) — a commitment it can't change afterward. Once the round settles, it reveals serverSeed, and you (or the SDK) can recompute the hash and the outcome yourself, offline. If it doesn't match, the round is provably invalid.",
    meta: "Fairness",
  },
  {
    question: "What wallet do I need?",
    answer:
      "Freighter, the Stellar browser wallet. No seed phrase ever leaves it — StellarCade only ever requests a signature.",
    meta: "Wallet",
  },
  {
    question: "What happens if I disagree with a result?",
    answer:
      "Every settlement writes to a hash-chained audit log. The arbiter service exposes a dispute-resolution path that resolves against that chain, so a disagreement is checked against cryptographic history, not just a support agent's word.",
    meta: "Disputes",
  },
  {
    question: "Can I play without the website?",
    answer:
      "Yes — the StellarCade Telegram and Discord bot let you link your wallet (via a signature challenge, no custody involved) and play, check stats, and claim rewards straight from chat.",
    meta: "Bot",
  },
  {
    question: "Is there a developer SDK?",
    answer:
      "Yes. @stellarcade/sdk ships the same fairness-verification and wallet-connector code the app itself runs on, so you can build your own tools against StellarCade rounds.",
    meta: "Developers",
  },
];

export default function LandingPage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <LandingNav />

      <NeonMesh className="fixed inset-0 h-screen opacity-60" />

      <main id="main">
        {/* HERO SECTION */}
        <section className={styles.hero}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} />
            Live on Stellar testnet
          </span>

          <h1 className={styles.title}>
            The <span className={styles.gradientText}>provably-fair</span> arcade, on-chain
          </h1>

          <p className={styles.subtitle}>
            StellarCade is a decentralized arcade on Stellar/Soroban — games, prize pools, quests
            and tournaments, with every result independently verifiable.
          </p>

          <div className={styles.cta}>
            <Button asChild variant="brand" size="pill">
              <Link href="/app">Enter the arcade</Link>
            </Button>
            <Button asChild variant="brand-outline" size="pill">
              <Link href="/games">Browse games</Link>
            </Button>
          </div>

          <div className={styles.stage}>
            <div className={styles.stageCardWrap}>
              <FairnessProofMockup />
            </div>
            <div className={`${styles.stageCardWrap} ${styles.stageCardOffset}`}>
              <PrizePoolMockup />
            </div>
            <div className={styles.stageCardWrap}>
              <QuestMockup />
            </div>
          </div>

          {/* PROTOCOL METRICS STRIP */}
          <div className={`${styles.wrap} w-full`}>
            <div className={styles.statsStrip}>
              {PROTOCOL_METRICS.map((m) => (
                <div key={m.label} className={styles.statItem}>
                  <div className={styles.statNumber}>{m.value}</div>
                  <div className={styles.statLabel}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GAMES ARENA SHOWCASE */}
        <section className={styles.sec} id="games">
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <span className={styles.eyebrow}>Games Arena</span>
              <h2 className={styles.secTitle}>On-Chain Matches. Instant Settlement.</h2>
              <p className={styles.secBody}>
                Challenge the house or duel other players in real-time. Every match executes non-custodially via Soroban smart contracts.
              </p>
            </div>

            <div className={styles.gamesGrid}>
              {FEATURED_GAMES.map((game) => (
                <div key={game.id} className={styles.gameCard}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      {game.icon}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          background: "rgba(0, 255, 204, 0.12)",
                          color: "var(--accent)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {game.category}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 8px 0" }}>{game.title}</h3>
                    <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: 1.6, margin: "0 0 16px 0" }}>
                      {game.desc}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-dim)", paddingTop: "12px", borderTop: "1px solid var(--glass-border)" }}>
                      <span>Wager: <strong style={{ color: "#fff" }}>{game.wagerRange}</strong></span>
                      <span>Odds: <strong style={{ color: "var(--accent)" }}>{game.odds}</strong></span>
                    </div>
                  </div>

                  <Button asChild variant="brand" size="sm" className="w-full">
                    <Link href={game.href}>
                      Play {game.title} <ArrowRight size={14} style={{ marginLeft: "6px" }} />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTERACTIVE VERIFIER SANDBOX */}
        <section className={styles.sec} id="sandbox">
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <span className={styles.eyebrow}>Live Cryptography</span>
              <h2 className={styles.secTitle}>Audit Any Round in Real-Time</h2>
              <p className={styles.secBody}>
                Don&apos;t take our word for it. StellarCade uses standard NIST-compliant SHA-256 WebCrypto functions you can execute right now in your browser.
              </p>
            </div>

            <InteractiveVerifierSandbox />
          </div>
        </section>

        {/* HOW IT WORKS / FAIRNESS EXPLAINER */}
        <section className={styles.sec} id="fairness">
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <span className={styles.eyebrow}>How it works</span>
              <h2 className={styles.secTitle}>Commit, reveal, verify.</h2>
              <p className={styles.secBody}>
                Every round follows the same provably-fair scheme, checked client-side by
                @stellarcade/sdk — you never have to take our word for a result.
              </p>
            </div>
            <div className={styles.stepsGrid}>
              <div className={styles.step}>
                <span className={styles.stepNum}>01</span>
                <h4>Commit</h4>
                <p>
                  Before you bet, the server publishes sha256(serverSeed) — a commitment it can no
                  longer change.
                </p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>02</span>
                <h4>Play</h4>
                <p>
                  Your round settles from serverSeed:clientSeed:nonce:ledgerHash — deterministic,
                  not discretionary.
                </p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>03</span>
                <h4>Verify</h4>
                <p>
                  Recompute the hash yourself, offline, with the SDK or by hand. If it doesn&apos;t
                  match, the round is provably invalid.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* VAULT & ECONOMICS BREAKDOWN */}
        <section className={styles.sec} id="economics">
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <span className={styles.eyebrow}>Autonomous Economics</span>
              <h2 className={styles.secTitle}>Transparent 2% Vault Allocation</h2>
              <p className={styles.secBody}>
                Unlike traditional casinos, StellarCade fees route directly into autonomous, on-chain reward pools for the community.
              </p>
            </div>

            <div className={styles.vaultGrid}>
              <div className={styles.vaultCard}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <TrendingUp size={24} style={{ color: "var(--accent)" }} />
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>98% Direct Winner Return</h3>
                </div>
                <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  98% of all match stakes are disbursed immediately to the winning player&apos;s wallet upon Soroban contract resolution.
                </p>
              </div>

              <div className={styles.vaultCard}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <Trophy size={24} style={{ color: "var(--accent)" }} />
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>70% of Fee → Weekly Jackpot</h3>
                </div>
                <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  The largest portion of protocol fees accumulates in the autonomous prize pool vault, distributed weekly to active tournament players.
                </p>
              </div>

              <div className={styles.vaultCard}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <Award size={24} style={{ color: "var(--accent)" }} />
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>30% of Fee → Quest Treasury</h3>
                </div>
                <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  Funds milestone rewards, Soulbound Badge minting, and leaderboard prizes for seasonal quest participants.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM CARDS */}
        <section className={styles.sec} id="platforms">
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <span className={styles.eyebrow}>Platforms</span>
              <h2 className={styles.secTitle}>Play in the browser, or build on top.</h2>
            </div>
            <div className={styles.platGrid}>
              <div className={styles.platCard}>
                <h3>Web app</h3>
                <p>
                  Connect Freighter and play straight from the browser — no download, no custody.
                </p>
                <Button asChild variant="brand-outline" size="sm" className={styles.platBtn}>
                  <Link href="/app">Launch web app</Link>
                </Button>
                <div className={styles.miniPreview}>
                  <div className={styles.miniRow}>
                    <span>You&apos;re betting</span>
                    <b>25 XLM</b>
                  </div>
                  <div className={styles.miniRow}>
                    <span>Fee</span>
                    <b>Network only</b>
                  </div>
                  <div className={styles.miniRow}>
                    <span>Fairness</span>
                    <b className={styles.ok}>✓ verifiable</b>
                  </div>
                  <div className={styles.miniRow}>
                    <span>Signed with</span>
                    <b>Freighter</b>
                  </div>
                </div>
              </div>

              <div className={`${styles.platCard} ${styles.platCardAccent}`}>
                <h3>Developer SDK</h3>
                <p>
                  @stellarcade/sdk ships the same fairness-verification and connector code the app
                  runs on.
                </p>
                <Button asChild variant="brand" size="sm" className={styles.platBtn}>
                  <Link href="/about">View SDK & Architecture</Link>
                </Button>
                <div className={styles.miniPreview}>
                  <div className={styles.miniRow}>
                    <span className={styles.mono}>$ npm install @stellarcade/sdk</span>
                  </div>
                  <div className={styles.miniRow}>
                    <span className={styles.mono}>import {"{"} verifyFairnessProof {"}"}</span>
                  </div>
                  <div className={styles.miniRow}>
                    <span className={styles.mono}>verifyFairnessProof(round)</span>
                    <b className={styles.ok}>✓ 100% fair</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOT */}
        <section className={styles.sec} id="bot">
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <span className={styles.eyebrow}>Telegram &amp; Discord</span>
              <h2 className={styles.secTitle}>Play without leaving chat.</h2>
              <p className={styles.secBody}>
                The StellarCade bot links to your wallet the same way the web app does — a
                signature challenge, never custody.
              </p>
            </div>
            <div className={styles.stepsGrid}>
              <div className={styles.step}>
                <span className={styles.stepNum}>01</span>
                <h4>Link your wallet</h4>
                <p>
                  Sign a one-time challenge with your Stellar keypair. The bot never sees or holds
                  your keys.
                </p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>02</span>
                <h4>Play &amp; check stats</h4>
                <p>Run rounds, check your balance and quest progress, right from the chat.</p>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>03</span>
                <h4>Claim on-chain</h4>
                <p>
                  Claims settle through the same arbiter service and audit log as the web app — no
                  separate, less-verifiable path.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE GRID */}
        <section className={styles.sec} id="features" aria-labelledby="features-heading">
          <div className={styles.wrap}>
            <div className={styles.secHead}>
              <span className={styles.eyebrow}>Why StellarCade</span>
              <h2 id="features-heading" className={styles.secTitle}>
                Everything a fair arcade should be.
              </h2>
            </div>
            <div className={styles.featureGrid}>
              {FEATURES.map((feature) => (
                <div className={styles.featureCard} key={feature.title}>
                  <div className={styles.featureIcon}>{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.sec} id="faq">
          <div className={styles.wrap}>
            <div className={styles.faqGrid}>
              <div>
                <span className={styles.eyebrow}>Questions</span>
                <h2 className={styles.secTitle} style={{ marginTop: 16 }}>
                  Frequently asked questions
                </h2>
              </div>
              <FaqAccordionMonochrome items={FAQS} />
            </div>
          </div>
        </section>
      </main>

      <CinematicFooter />
    </>
  );
}
