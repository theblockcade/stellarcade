"use client";

import React from "react";
import Link from "next/link";
import {
  Award,
  Bot,
  Gauge,
  ScrollText,
  ShieldCheck,
  Trophy,
  Wallet,
  Zap,
  Dices,
  Coins,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqAccordionMonochrome } from "@/components/ui/faq-monochrome";
import { LandingNav } from "./landing/nav";
import { FairnessProofMockup, PrizePoolMockup, QuestMockup } from "./landing/mockups";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { NeonMesh } from "@/components/ui/neon-mesh";
import { InteractiveVerifierSandbox } from "./landing/interactive-verifier";
import {
  MotionReveal,
  MotionStaggerContainer,
  MotionStaggerItem,
  MotionCyberCard,
  MotionFloating,
} from "@/components/ui/motion-primitives";

const FEATURED_GAMES = [
  {
    id: "coinflip-duel",
    icon: <Coins size={30} style={{ color: "var(--accent)" }} />,
    title: "Coinflip Duel",
    category: "1v1 PvP & House Match",
    wagerRange: "5 – 100 XLM",
    odds: "50.00% Exact Odds",
    desc: "Instant cryptographic coinflip duel backed by SHA-256 commit-reveal entropy and Soroban smart contracts.",
    href: "/games",
  },
  {
    id: "rng-dice",
    icon: <Dices size={30} style={{ color: "var(--accent)" }} />,
    title: "Verifiable Dice Roll",
    category: "Table & Dice",
    wagerRange: "10 – 250 XLM",
    odds: "1.98x – 5.80x Multiplier",
    desc: "Roll against modular smart contract entropy with customizable prediction targets and real-time payout execution.",
    href: "/games",
  },
  {
    id: "prizepool-gauntlet",
    icon: <Trophy size={30} style={{ color: "var(--accent)" }} />,
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

/*
 * Landing-page style vocabulary, previously app/page.module.css.
 *
 * These are shared strings rather than a CSS module so the whole app speaks
 * one language (Tailwind utilities bound to @stellarcade/tokens) instead of
 * two. The non-obvious values are kept verbatim from the CSS they replace:
 *
 *  - GLASS_CARD's near-solid rgba(10,10,10,.85): --bg-card is only ~5% white,
 *    which let the NeonMesh animation bleed straight through every card once
 *    the mesh started running behind all sections.
 *  - The hero's fixed stage height + mask: the mockups are deliberately cut
 *    off and faded instead of pushing the 100vh hero past the fold, and the
 *    max-height queries shrink (then drop) the stage on short viewports.
 */
const GLASS_CARD =
  "rounded-[20px] border border-[color:var(--glass-border)] bg-[rgba(10,10,10,0.85)] backdrop-blur-[16px]";

const EYEBROW =
  "relative inline-flex items-center gap-2 rounded-full border border-[color:var(--glass-border)] bg-card px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em] text-primary uppercase";

const SECTION = "relative border-t border-[color:var(--glass-border)] px-6 py-22";
const WRAP = "mx-auto max-w-[1080px]";
const SEC_HEAD = "mx-auto mb-12 max-w-[640px] text-center";
const SEC_TITLE =
  "mt-3.5 text-[clamp(2rem,4vw,3.1rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance";
const SEC_BODY = "mt-4 text-[16.5px] leading-[1.65] text-muted-foreground";
const STEPS_GRID = "grid gap-8 sm:grid-cols-2 lg:grid-cols-3";
const MINI_ROW = "flex items-center justify-between text-[13px] text-muted-foreground";
const MONO = "font-mono text-xs";

function Step({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <MotionStaggerItem className={`${GLASS_CARD} p-6`}>
      <span className="font-mono text-[13px] font-bold text-primary">{num}</span>
      <h3 className="mt-3 mb-2.5 text-[19px] font-bold tracking-[-0.01em]">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </MotionStaggerItem>
  );
}

const VAULT_SPLITS = [
  {
    icon: <TrendingUp className="size-6" aria-hidden />,
    title: "98% direct winner return",
    body: "98% of all match stakes are disbursed immediately to the winning player's wallet upon Soroban contract resolution.",
  },
  {
    icon: <Trophy className="size-6" aria-hidden />,
    title: "70% of fee to weekly jackpot",
    body: "The largest portion of protocol fees accumulates in the autonomous prize pool vault, distributed weekly to active tournament players.",
  },
  {
    icon: <Award className="size-6" aria-hidden />,
    title: "30% of fee to quest treasury",
    body: "Funds milestone rewards, Soulbound Badge minting, and leaderboard prizes for seasonal quest participants.",
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
        {/* HERO */}
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-30 text-center [@media(max-height:860px)]:pt-24">
          {/* Top glow */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,var(--accent-glow),transparent_70%)]"
            aria-hidden
          />
          {/* Bottom fade — resolves the masked mockups into the next section
              instead of stopping at a hard edge. */}
          <div
            className="pointer-events-none absolute inset-x-0 -bottom-px z-2 h-50 bg-linear-to-b from-transparent to-[color:var(--bg-dark)] to-92%"
            aria-hidden
          />

          <MotionReveal direction="down" duration={0.6}>
            <span className={EYEBROW}>
              <span
                className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--accent-glow)]"
                aria-hidden
              />
              Live on Stellar testnet
            </span>
          </MotionReveal>

          <MotionReveal direction="up" delay={0.1} duration={0.7}>
            <h1 className="relative mt-6 max-w-[15ch] text-[clamp(2.75rem,7.5vw,5.75rem)] leading-[0.96] font-black tracking-[-0.03em] text-balance">
              The{" "}
              <span className="bg-linear-[120deg,var(--accent),#7dffea] bg-clip-text text-transparent">
                provably-fair
              </span>{" "}
              arcade, on-chain
            </h1>
          </MotionReveal>

          <MotionReveal direction="up" delay={0.2} duration={0.7}>
            <p className="relative mt-5 max-w-[560px] text-[clamp(1rem,1.6vw,1.15rem)] leading-relaxed text-muted-foreground">
              StellarCade is a decentralized arcade on Stellar/Soroban — games, prize pools, quests
              and tournaments, with every result independently verifiable.
            </p>
          </MotionReveal>

          <MotionReveal direction="up" delay={0.3} duration={0.6}>
            <div className="relative mt-9 flex flex-wrap justify-center gap-3.5">
              <Button asChild variant="brand" size="pill">
                <Link href="/app">Enter the arcade</Link>
              </Button>
              <Button asChild variant="brand-outline" size="pill">
                <Link href="/games">Browse games</Link>
              </Button>
            </div>
          </MotionReveal>

          {/* Floating mockup stage */}
          <div className="relative mt-13 flex h-75 w-full flex-wrap items-start justify-center gap-5 overflow-hidden [mask-image:linear-gradient(#000_58%,transparent_98%)] [@media(max-height:700px)]:hidden [@media(max-height:860px)]:mt-7 [@media(max-height:860px)]:h-39">
            <MotionFloating yOffset={8} duration={5} className="transition-transform duration-200">
              <FairnessProofMockup />
            </MotionFloating>
            <MotionFloating
              yOffset={12}
              duration={6}
              className="-translate-y-6 transition-transform duration-200 min-[900px]:-translate-y-10"
            >
              <PrizePoolMockup />
            </MotionFloating>
            <MotionFloating
              yOffset={10}
              duration={5.5}
              className="transition-transform duration-200"
            >
              <QuestMockup />
            </MotionFloating>
          </div>
        </section>

        {/* NARRATIVE: TRUST CRISIS -> DECOUPLED ENTROPY */}
        <section className={`${SECTION} bg-black/40`}>
          <div className={`${WRAP} grid items-center gap-12 lg:grid-cols-2`}>
            <MotionReveal direction="left">
              <div className="flex flex-col gap-4">
                <span
                  className={`${EYEBROW} self-start border-rose-500/30 bg-rose-500/8 text-rose-400`}
                >
                  Act I: The Trust Crisis
                </span>
                <h2 className={`${SEC_TITLE} mt-0 text-left`}>
                  Traditional gaming is rigged behind closed doors.
                </h2>
                <p className={`${SEC_BODY} mt-0 text-left text-[15px] leading-relaxed`}>
                  Conventional online platforms execute game wagers inside hidden databases. They
                  promise random outcomes, but control the seed parameters, manipulate multipliers
                  dynamically, and lock your deposits in centralized custodial accounts. You cannot
                  inspect the math, and you cannot audit the server.
                </p>
              </div>
            </MotionReveal>

            <MotionReveal direction="right">
              <div className={`${GLASS_CARD} flex flex-col gap-4 p-8`}>
                <span className={`${EYEBROW} self-start border-primary/30 bg-primary/8`}>
                  Act II: The Cryptographic Truth
                </span>
                <h2 className={`${SEC_TITLE} mt-0 text-left text-[1.9rem]`}>
                  Decoupled on-chain entropy.
                </h2>
                <p className={`${SEC_BODY} mt-0 text-left text-sm leading-relaxed`}>
                  StellarCade forces complete transparency. The server publishes a SHA-256 hash of
                  its secret seed before you commit your bet. Your browser mixes client-side seed
                  parameters with the live, immutable hash of the Stellar ledger, executing the
                  final outcome deterministically via audited Soroban smart contracts.
                </p>
              </div>
            </MotionReveal>
          </div>
        </section>

        {/* GAMES ARENA */}
        <section className={SECTION} id="games">
          <div className={WRAP}>
            <MotionReveal direction="up">
              <div className={SEC_HEAD}>
                <span className={EYEBROW}>Games Arena</span>
                <h2 className={SEC_TITLE}>On-chain matches. Instant settlement.</h2>
                <p className={SEC_BODY}>
                  Challenge the house or duel other players in real-time. Every match executes
                  non-custodially via Soroban smart contracts.
                </p>
              </div>
            </MotionReveal>

            <MotionStaggerContainer
              staggerChildren={0.15}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {FEATURED_GAMES.map((game) => (
                <MotionStaggerItem key={game.id} className="h-full">
                  <MotionCyberCard
                    className={`${GLASS_CARD} flex h-full flex-col justify-between gap-5 p-8 transition-colors hover:border-primary`}
                  >
                    <div>
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <span className="text-primary [&_svg]:size-7.5">{game.icon}</span>
                        <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-bold tracking-[0.05em] text-primary uppercase">
                          {game.category}
                        </span>
                      </div>

                      <h3 className="mb-2.5 text-2xl font-bold tracking-[-0.02em]">{game.title}</h3>
                      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                        {game.desc}
                      </p>

                      <div className="flex justify-between border-t border-[color:var(--glass-border)] pt-3 text-[13px] text-muted-foreground">
                        <span>
                          Wager: <strong className="text-foreground">{game.wagerRange}</strong>
                        </span>
                        <span>
                          Odds: <strong className="text-primary">{game.odds}</strong>
                        </span>
                      </div>
                    </div>

                    <Button asChild variant="brand" size="sm" className="w-full">
                      <Link href={game.href}>
                        Play {game.title}
                        <ArrowRight />
                      </Link>
                    </Button>
                  </MotionCyberCard>
                </MotionStaggerItem>
              ))}
            </MotionStaggerContainer>
          </div>
        </section>

        {/* INTERACTIVE VERIFIER SANDBOX */}
        <section className={SECTION} id="sandbox">
          <div className={WRAP}>
            <MotionReveal direction="up">
              <div className={SEC_HEAD}>
                <span className={EYEBROW}>Live Cryptography</span>
                <h2 className={SEC_TITLE}>Audit any round in real-time</h2>
                <p className={SEC_BODY}>
                  Don&apos;t take our word for it. StellarCade uses standard NIST-compliant SHA-256
                  WebCrypto functions you can execute right now in your browser.
                </p>
              </div>
            </MotionReveal>

            <MotionReveal direction="zoom" delay={0.15}>
              <InteractiveVerifierSandbox />
            </MotionReveal>
          </div>
        </section>

        {/* FAIRNESS EXPLAINER */}
        <section className={SECTION} id="fairness">
          <div className={WRAP}>
            <MotionReveal direction="up">
              <div className={SEC_HEAD}>
                <span className={EYEBROW}>How it works</span>
                <h2 className={SEC_TITLE}>Commit, reveal, verify.</h2>
                <p className={SEC_BODY}>
                  Every round follows the same provably-fair scheme, checked client-side by
                  @stellarcade/sdk — you never have to take our word for a result.
                </p>
              </div>
            </MotionReveal>

            <MotionStaggerContainer staggerChildren={0.15} className={STEPS_GRID}>
              <Step num="01" title="Commit">
                Before you bet, the server publishes sha256(serverSeed) — a commitment it can no
                longer change.
              </Step>
              <Step num="02" title="Play">
                Your round settles from serverSeed:clientSeed:nonce:ledgerHash — deterministic, not
                discretionary.
              </Step>
              <Step num="03" title="Verify">
                Recompute the hash yourself, offline, with the SDK or by hand. If it doesn&apos;t
                match, the round is provably invalid.
              </Step>
            </MotionStaggerContainer>
          </div>
        </section>

        {/* ECONOMICS */}
        <section className={SECTION} id="economics">
          <div className={WRAP}>
            <MotionReveal direction="up">
              <div className={SEC_HEAD}>
                <span className={EYEBROW}>Autonomous Economics</span>
                <h2 className={SEC_TITLE}>Transparent 2% vault allocation</h2>
                <p className={SEC_BODY}>
                  Unlike traditional casinos, StellarCade fees route directly into autonomous,
                  on-chain reward pools for the community.
                </p>
              </div>
            </MotionReveal>

            <MotionStaggerContainer
              staggerChildren={0.15}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {VAULT_SPLITS.map((item) => (
                <MotionStaggerItem key={item.title} className="h-full">
                  <MotionCyberCard className={`${GLASS_CARD} h-full p-7`}>
                    <div className="mb-3 flex items-center gap-2.5 text-primary">
                      {item.icon}
                      <h3 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </MotionCyberCard>
                </MotionStaggerItem>
              ))}
            </MotionStaggerContainer>
          </div>
        </section>

        {/* PLATFORMS */}
        <section className={SECTION} id="platforms">
          <div className={WRAP}>
            <MotionReveal direction="up">
              <div className={SEC_HEAD}>
                <span className={EYEBROW}>Platforms</span>
                <h2 className={SEC_TITLE}>Play in the browser, or build on top.</h2>
              </div>
            </MotionReveal>

            <MotionStaggerContainer staggerChildren={0.15} className="grid gap-5 md:grid-cols-2">
              <MotionStaggerItem className="h-full">
                <MotionCyberCard className={`${GLASS_CARD} h-full p-8`}>
                  <h3 className="mb-2.5 text-2xl font-bold tracking-[-0.02em]">Web app</h3>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                    Connect Freighter and play straight from the browser — no download, no custody.
                  </p>
                  <Button asChild variant="brand-outline" size="sm" className="mb-6">
                    <Link href="/app">Launch web app</Link>
                  </Button>
                  <div className="flex flex-col gap-2.5 rounded-[14px] border border-[color:var(--glass-border)] bg-[color:var(--bg-dark)] p-4">
                    <div className={MINI_ROW}>
                      <span>You&apos;re betting</span>
                      <b className="text-foreground">25 XLM</b>
                    </div>
                    <div className={MINI_ROW}>
                      <span>Fee</span>
                      <b className="text-foreground">Network only</b>
                    </div>
                    <div className={MINI_ROW}>
                      <span>Fairness</span>
                      <b className="text-emerald-400">✓ verifiable</b>
                    </div>
                    <div className={MINI_ROW}>
                      <span>Signed with</span>
                      <b className="text-foreground">Freighter</b>
                    </div>
                  </div>
                </MotionCyberCard>
              </MotionStaggerItem>

              <MotionStaggerItem className="h-full">
                <MotionCyberCard
                  className={`${GLASS_CARD} h-full bg-[linear-gradient(135deg,rgba(0,255,204,0.08),transparent_60%),rgba(10,10,10,0.85)] p-8`}
                >
                  <h3 className="mb-2.5 text-2xl font-bold tracking-[-0.02em]">Developer SDK</h3>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                    @stellarcade/sdk ships the same fairness-verification and connector code the app
                    runs on.
                  </p>
                  <Button asChild variant="brand" size="sm" className="mb-6">
                    <Link href="/about">View SDK &amp; Architecture</Link>
                  </Button>
                  <div className="flex flex-col gap-2.5 rounded-[14px] border border-[color:var(--glass-border)] bg-[color:var(--bg-dark)] p-4">
                    <div className={MINI_ROW}>
                      <span className={MONO}>$ npm install @stellarcade/sdk</span>
                    </div>
                    <div className={MINI_ROW}>
                      <span className={MONO}>import {"{"} verifyFairnessProof {"}"}</span>
                    </div>
                    <div className={MINI_ROW}>
                      <span className={MONO}>verifyFairnessProof(round)</span>
                      <b className="text-emerald-400">✓ 100% fair</b>
                    </div>
                  </div>
                </MotionCyberCard>
              </MotionStaggerItem>
            </MotionStaggerContainer>
          </div>
        </section>

        {/* BOT */}
        <section className={SECTION} id="bot">
          <div className={WRAP}>
            <MotionReveal direction="up">
              <div className={SEC_HEAD}>
                <span className={EYEBROW}>Telegram &amp; Discord</span>
                <h2 className={SEC_TITLE}>Play without leaving chat.</h2>
                <p className={SEC_BODY}>
                  The StellarCade bot links to your wallet the same way the web app does — a
                  signature challenge, never custody.
                </p>
              </div>
            </MotionReveal>

            <MotionStaggerContainer staggerChildren={0.15} className={STEPS_GRID}>
              <Step num="01" title="Link your wallet">
                Sign a one-time challenge with your Stellar keypair. The bot never sees or holds
                your keys.
              </Step>
              <Step num="02" title="Play & check stats">
                Run rounds, check your balance and quest progress, right from the chat.
              </Step>
              <Step num="03" title="Claim on-chain">
                Claims settle through the same arbiter service and audit log as the web app — no
                separate, less-verifiable path.
              </Step>
            </MotionStaggerContainer>
          </div>
        </section>

        {/* FEATURES */}
        <section className={SECTION} id="features" aria-labelledby="features-heading">
          <div className={WRAP}>
            <MotionReveal direction="up">
              <div className={SEC_HEAD}>
                <span className={EYEBROW}>Why StellarCade</span>
                <h2 id="features-heading" className={SEC_TITLE}>
                  Everything a fair arcade should be.
                </h2>
              </div>
            </MotionReveal>

            <MotionStaggerContainer
              staggerChildren={0.08}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {FEATURES.map((feature) => (
                <MotionStaggerItem key={feature.title} className={`${GLASS_CARD} px-7 py-8`}>
                  <div className="mb-3 text-primary [&_svg]:size-5">{feature.icon}</div>
                  <h3 className="mb-2.5 text-xl font-bold tracking-[-0.015em]">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </MotionStaggerItem>
              ))}
            </MotionStaggerContainer>
          </div>
        </section>

        {/* FAQ */}
        <section className={SECTION} id="faq">
          <div className={WRAP}>
            <MotionReveal direction="up">
              <div className="grid gap-12 md:grid-cols-[minmax(200px,320px)_1fr]">
                <div>
                  <span className={EYEBROW}>Questions</span>
                  <h2 className={`${SEC_TITLE} mt-4`}>Frequently asked questions</h2>
                </div>
                <FaqAccordionMonochrome items={FAQS} />
              </div>
            </MotionReveal>
          </div>
        </section>
      </main>

      <CinematicFooter />
    </>
  );
}
