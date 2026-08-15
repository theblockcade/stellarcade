import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Static hero product previews — not screenshots of real screens, but
 * grounded in the real fairness/settlement flow (commit-reveal proof,
 * verified client-side by @stellarcade/sdk's fairness.ts) rather than
 * invented UI. Built on shadcn's Card/Badge (21st.dev) instead of the
 * hand-rolled ".pcard" markup this pattern is inspired by.
 *
 * Styling moved from mockups.module.css to Tailwind utilities. The
 * near-solid rgba(10,10,10,.85) background is deliberate: --bg-card is only
 * ~5% white, which let the NeonMesh animation show straight through.
 */

const CARD =
  "w-65 gap-3 rounded-[20px] bg-[rgba(10,10,10,0.85)] p-4.5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-[16px]";
const CARD_COMPACT = "w-55";
const CARD_TOP =
  "flex items-center justify-between text-xs font-semibold tracking-[0.04em] text-muted-foreground uppercase";
const FIELD = "flex flex-col gap-1";
const LABEL = "text-[10px] font-bold tracking-[0.08em] text-muted-foreground";
const MONO = "font-mono text-xs text-foreground";
const MINI_ROWS = "flex flex-col gap-2";
const MINI_ROW = "flex items-center justify-between text-xs text-muted-foreground";
const CHIP =
  "inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground";
const CHIP_ON = "bg-[color:var(--accent-glow)] text-primary";

export function FairnessProofMockup() {
  return (
    <Card className={CARD}>
      <div className={CARD_TOP}>
        <span>Round #48213</span>
        <ShieldCheck size={16} className="text-primary" />
      </div>

      <div className={FIELD}>
        <div className={LABEL}>SERVER SEED HASH</div>
        <div className={MONO}>sha256(...) 9f2a…c701</div>
      </div>

      <div className={FIELD}>
        <div className={LABEL}>OUTCOME</div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">Heads</span>
          <Badge className="border-none bg-emerald-500/18 text-emerald-400">
            <CheckCircle2 size={12} /> Verified fair
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={cn(CHIP, CHIP_ON)}>Commit published</span>
        <span className={cn(CHIP, CHIP_ON)}>Seed revealed</span>
        <span className={CHIP}>
          <Lock size={11} /> No custody
        </span>
      </div>
    </Card>
  );
}

export function PrizePoolMockup() {
  return (
    <Card className={cn(CARD, CARD_COMPACT)}>
      <div className={CARD_TOP}>
        <span>Prize pool</span>
        <span
          className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_var(--sc-success)]"
          aria-hidden="true"
        />
      </div>
      <div className="text-2xl font-bold tracking-[-0.02em]">1,240 XLM</div>
      <div className={MINI_ROWS}>
        <div className={MINI_ROW}>
          <span className={MONO}>reserve_funds()</span>
          <b className="text-emerald-500">✓ on-chain</b>
        </div>
        <div className={MINI_ROW}>
          <span className={MONO}>settle_payout()</span>
          <b className="text-emerald-500">✓ enforced</b>
        </div>
        <div className={MINI_ROW}>
          <span className={MONO}>network fee</span>
          <b>0.00001 XLM</b>
        </div>
      </div>
    </Card>
  );
}

export function QuestMockup() {
  return (
    <Card className={cn(CARD, CARD_COMPACT)}>
      <div className={CARD_TOP}>
        <span>Quest</span>
        <span>◇</span>
      </div>
      <div className="text-sm font-semibold">Win 3 rounds today</div>
      <div className="h-1.5 overflow-hidden rounded-full bg-card">
        <div className="h-full rounded-full bg-primary" style={{ width: "66%" }} />
      </div>
      <div className={MINI_ROWS}>
        <div className={MINI_ROW}>
          <span>2 / 3 complete</span>
          <b>+50 XP</b>
        </div>
      </div>
    </Card>
  );
}
