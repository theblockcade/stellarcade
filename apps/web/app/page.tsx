import Link from "next/link";
import styles from "./page.module.css";

const FEATURES = [
  {
    title: "Provably fair",
    body: "Every round settles from a commit-reveal proof you can verify yourself, offline — no trust in our servers required.",
  },
  {
    title: "No custody, ever",
    body: "Connect with Freighter. StellarCade never holds your keys or your funds.",
  },
  {
    title: "Real prize pools",
    body: "Payouts are enforced on-chain by Soroban smart contracts, not a database row.",
  },
  {
    title: "Built for Stellar",
    body: "Fast, low-fee settlement on Soroban — no waiting, no gas anxiety.",
  },
];

export default function LandingPage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <main id="main">
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
            <Link href="/app" className={`${styles.btn} ${styles.btnPrimary}`}>
              Enter the arcade
            </Link>
            <Link href="/games" className={`${styles.btn} ${styles.btnSecondary}`}>
              Browse games
            </Link>
          </div>
        </section>

        <section className={styles.features} aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
            Why StellarCade
          </h2>
          <div className={styles.featureGrid}>
            {FEATURES.map((feature) => (
              <div className={styles.featureCard} key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© 2026 StellarCade. All rights reserved.</p>
        <div>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </footer>
    </>
  );
}
