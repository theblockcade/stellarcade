"use client";

import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Shield,
  Sliders,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";

import { PageHeader } from "../../../src/components/ui/page-header";
import { cn } from "../../../src/lib/utils";
import {
  getTableDensityPreference,
  persistTableDensityPreference,
  type TableDensityPreference,
} from "../../../src/services/global-state-store";

/* ── Building blocks ────────────────────────────────────────────────────── */

function SettingsCard({
  icon,
  title,
  tone = "default",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
      <h2
        className={cn(
          "flex items-center gap-2 border-b border-border/70 px-5 py-4 text-sm font-semibold text-foreground [&_svg]:size-4.5",
          tone === "danger" ? "[&_svg]:text-destructive" : "[&_svg]:text-primary",
        )}
      >
        {icon}
        {title}
      </h2>
      <div className="divide-y divide-border/70">{children}</div>
    </section>
  );
}

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0 max-w-xl">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

/**
 * A real `role="switch"` rather than a styled button with a text label.
 * Screen readers announce on/off state from aria-checked, so the visible
 * label no longer has to carry it.
 */
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
        "focus-visible:ring-[3px] focus-visible:ring-primary/30 focus-visible:outline-none",
        checked ? "border-primary bg-primary/25" : "border-border bg-background/60",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full transition-transform",
          checked ? "translate-x-6 bg-primary" : "translate-x-1 bg-muted-foreground",
        )}
        aria-hidden
      />
    </button>
  );
}

function SegmentedChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ id: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex rounded-lg border border-border bg-background/50 p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            value === option.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

const DENSITY_OPTIONS = [
  { id: "standard", label: "Standard" },
  { id: "compact", label: "Compact" },
] as const satisfies ReadonlyArray<{ id: TableDensityPreference; label: string }>;

export default function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoVerify, setAutoVerify] = useState(true);
  const [tableDensity, setTableDensity] = useState<TableDensityPreference>("compact");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setTableDensity(getTableDensityPreference("dashboard-surfaces"));
  }, []);

  const triggerSaveAlert = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDensityChange = (density: TableDensityPreference) => {
    setTableDensity(density);
    persistTableDensityPreference("dashboard-surfaces", density);
    triggerSaveAlert();
  };

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("stc_dashboard_session_seen_v1");
      localStorage.removeItem("stc_dashboard_last_context_v1");
      triggerSaveAlert();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto flex w-full max-w-5xl flex-col gap-6"
    >
      <PageHeader
        icon={<SettingsIcon />}
        title="System & Game Preferences"
        description="Configure client-side gameplay behavior, cryptographic auto-verification, audio, and session security."
        actions={
          savedSuccess ? (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3.5 py-1.5 text-[13px] font-semibold text-primary"
            >
              <CheckCircle2 className="size-4" aria-hidden />
              Saved locally
            </span>
          ) : null
        }
      />

      <SettingsCard icon={<Shield />} title="Provable Fairness & Audio">
        <SettingRow
          title="Background SHA-256 Auto-Verification"
          description="Automatically verify revealed server seed commitments client-side after every round."
          control={
            <Switch
              checked={autoVerify}
              label="Background SHA-256 auto-verification"
              onChange={(next) => {
                setAutoVerify(next);
                triggerSaveAlert();
              }}
            />
          }
        />
        <SettingRow
          title="Arcade Sound FX & Cues"
          description="Play audio effects on round reveals, dice rolls, and jackpot prize disbursements."
          control={
            <Switch
              checked={soundEnabled}
              label="Arcade sound effects"
              onChange={(next) => {
                setSoundEnabled(next);
                triggerSaveAlert();
              }}
            />
          }
        />
      </SettingsCard>

      <SettingsCard icon={<Sliders />} title="Display & Table Density">
        <SettingRow
          title="Data Table Row Density"
          description="Adjust table spacing across Live Arena, Match History, and Leaderboards."
          control={
            <SegmentedChoice
              label="Data table row density"
              value={tableDensity}
              options={DENSITY_OPTIONS}
              onChange={handleDensityChange}
            />
          }
        />
      </SettingsCard>

      <SettingsCard icon={<Trash2 />} title="Session Storage & Cache" tone="danger">
        <SettingRow
          title="Clear Cached Context & Toolbars"
          description="Reset dismissed onboarding tooltips, search filters, and draft inputs stored in browser storage."
          control={
            <button
              type="button"
              onClick={handleClearCache}
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-[13px] font-semibold text-rose-400 transition-colors hover:bg-destructive/20"
            >
              Clear Local Cache
            </button>
          }
        />
      </SettingsCard>
    </motion.div>
  );
}
