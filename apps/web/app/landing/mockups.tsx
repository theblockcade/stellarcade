import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import styles from "./mockups.module.css";

/**
 * Static hero product previews — not screenshots of real screens, but
 * grounded in the real fairness/settlement flow (commit-reveal proof,
 * verified client-side by @stellarcade/sdk's fairness.ts) rather than
 * invented UI. Built on shadcn's Card/Badge (21st.dev) instead of the
 * hand-rolled ".pcard" markup this pattern is inspired by.
 */
export function FairnessProofMockup() {
  return (
    <Card className={styles.card}>
      <div className={styles.cardTop}>
        <span>Round #48213</span>
        <ShieldCheck size={16} className={styles.accentIcon} />
      </div>

      <div className={styles.field}>
        <div className={styles.label}>SERVER SEED HASH</div>
        <div className={styles.mono}>sha256(...) 9f2a…c701</div>
      </div>

      <div className={styles.field}>
        <div className={styles.label}>OUTCOME</div>
        <div className={styles.row}>
          <span className={styles.bigValue}>Heads</span>
          <Badge className={styles.successBadge}>
            <CheckCircle2 size={12} /> Verified fair
          </Badge>
        </div>
      </div>

      <div className={styles.chips}>
        <span className={`${styles.chip} ${styles.chipOn}`}>Commit published</span>
        <span className={`${styles.chip} ${styles.chipOn}`}>Seed revealed</span>
        <span className={styles.chip}>
          <Lock size={11} /> No custody
        </span>
      </div>
    </Card>
  );
}

export function PrizePoolMockup() {
  return (
    <Card className={`${styles.card} ${styles.cardCompact}`}>
      <div className={styles.cardTop}>
        <span>Prize pool</span>
        <span className={styles.dotPulse} aria-hidden="true" />
      </div>
      <div className={styles.bal}>1,240 XLM</div>
      <div className={styles.miniRows}>
        <div className={styles.miniRow}>
          <span className={styles.mono}>reserve_funds()</span>
          <b className={styles.ok}>✓ on-chain</b>
        </div>
        <div className={styles.miniRow}>
          <span className={styles.mono}>settle_payout()</span>
          <b className={styles.ok}>✓ enforced</b>
        </div>
        <div className={styles.miniRow}>
          <span className={styles.mono}>network fee</span>
          <b>0.00001 XLM</b>
        </div>
      </div>
    </Card>
  );
}

export function QuestMockup() {
  return (
    <Card className={`${styles.card} ${styles.cardCompact}`}>
      <div className={styles.cardTop}>
        <span>Quest</span>
        <span>◇</span>
      </div>
      <div className={styles.questTitle}>Win 3 rounds today</div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: "66%" }} />
      </div>
      <div className={styles.miniRows}>
        <div className={styles.miniRow}>
          <span>2 / 3 complete</span>
          <b>+50 XP</b>
        </div>
      </div>
    </Card>
  );
}
