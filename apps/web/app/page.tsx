import Link from "next/link";
import { Award, Bot, Code2, Gauge, ScrollText, ShieldCheck, Trophy, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqAccordionMonochrome } from "@/components/ui/faq-monochrome";
import { LandingNav } from "./landing/nav";
import { FairnessProofMockup, PrizePoolMockup, QuestMockup } from "./landing/mockups";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { NeonMesh } from "@/components/ui/neon-mesh";
import styles from "./page.module.css";

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

      <main id="main">
        <section className={styles.hero}>
          {/* Purely decorative background — mouse-reactive mesh, no overlay
              text (see neon-mesh.tsx) — so pointer events stay enabled here
              (that's what drives the mesh's cursor interaction) while the
              real hero content below still receives its own clicks, since
              it's positioned later in DOM order at the same stacking level.
              opacity-60: toned down further so it reads as texture behind
              the real headline/CTAs, not a competing focal point. */}
          <NeonMesh className="absolute inset-0 h-full opacity-60" />

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
            {/* No dedicated /games route (see AppShell's routeToPath) — GameLobby
                at /app serves both the lobby and the games concern. */}
            <Button asChild variant="brand-outline" size="pill">
              <Link href="/app">Browse games</Link>
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
        </section>

        {/* FAIRNESS EXPLAINER */}
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
                <div className={styles.miniPreview}>
                  <div className={styles.miniRow}>
                    <span className={styles.mono}>$ npm install @stellarcade/sdk</span>
                  </div>
                  <div className={styles.miniRow}>
                    <span className={styles.mono}>import {"{"} verifyRound {"}"}</span>
                  </div>
                  <div className={styles.miniRow}>
                    <span className={styles.mono}>verifyRound(round)</span>
                    <b className={styles.ok}>✓ fair</b>
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

      {/* Cinematic scroll-reveal footer (see src/components/ui/motion-footer.tsx)
          replaces the old static closing-CTA section + link-column footer —
          it covers both roles: closing CTA ("Ready to enter?") and site nav
          (arcade/games/portfolio/FAQ/terms/privacy). */}
      <CinematicFooter />
    </>
  );
}
