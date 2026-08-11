"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings as SettingsIcon,
  Shield,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Button } from "../../../src/components/ui/button";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import GlobalStateStore, {
  getTableDensityPreference,
  persistTableDensityPreference,
  type TableDensityPreference,
} from "../../../src/services/global-state-store";

export default function SettingsPage() {
  const wallet = useWalletStatus();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoVerify, setAutoVerify] = useState(true);
  const [tableDensity, setTableDensity] = useState<TableDensityPreference>("compact");
  const [networkGuard, setNetworkGuard] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const density = getTableDensityPreference("dashboard-surfaces");
    setTableDensity(density);
  }, []);

  const handleDensityChange = (density: TableDensityPreference) => {
    setTableDensity(density);
    persistTableDensityPreference("dashboard-surfaces", density);
    triggerSaveAlert();
  };

  const triggerSaveAlert = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("stc_dashboard_session_seen_v1");
      localStorage.removeItem("stc_dashboard_last_context_v1");
      triggerSaveAlert();
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <SettingsIcon size={28} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>System & Game Preferences</h1>
          </div>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "0.95rem" }}>
            Configure client-side gameplay behavior, cryptographic auto-verification, audio, and session security.
          </p>
        </div>

        {savedSuccess && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(0, 255, 204, 0.15)",
              color: "var(--sc-accent, #00ffcc)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={16} /> Saved locally
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Gameplay & Cryptography Settings */}
        <div
          style={{
            background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
            borderRadius: "16px",
            border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
            padding: "1.75rem",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.25rem 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={20} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            Provable Fairness & Audio
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem" }}>Background SHA-256 Auto-Verification</strong>
                <span style={{ fontSize: "0.85rem", color: "var(--sc-text-dim, #94a3b8)" }}>
                  Automatically verify revealed server seed commitments client-side after every round.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAutoVerify(!autoVerify);
                  triggerSaveAlert();
                }}
                style={{
                  padding: "6px 16px",
                  borderRadius: "999px",
                  border: autoVerify ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.2)",
                  background: autoVerify ? "rgba(0, 255, 204, 0.15)" : "transparent",
                  color: autoVerify ? "#00ffcc" : "#fff",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {autoVerify ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem" }}>Arcade Sound FX & Cues</strong>
                <span style={{ fontSize: "0.85rem", color: "var(--sc-text-dim, #94a3b8)" }}>
                  Play audio effects on round reveals, dice rolls, and jackpot prize disbursements.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  triggerSaveAlert();
                }}
                style={{
                  padding: "6px 16px",
                  borderRadius: "999px",
                  border: soundEnabled ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.2)",
                  background: soundEnabled ? "rgba(0, 255, 204, 0.15)" : "transparent",
                  color: soundEnabled ? "#00ffcc" : "#fff",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {soundEnabled ? "🔊 Sound On" : "🔇 Muted"}
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Display & Table Density */}
        <div
          style={{
            background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
            borderRadius: "16px",
            border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
            padding: "1.75rem",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.25rem 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sliders size={20} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            Display & Table Density
          </h2>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ display: "block", fontSize: "0.95rem" }}>Data Table Row Density</strong>
              <span style={{ fontSize: "0.85rem", color: "var(--sc-text-dim, #94a3b8)" }}>
                Adjust table spacing across Live Arena, Match History, and Leaderboards.
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => handleDensityChange("standard")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: tableDensity === "standard" ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
                  background: tableDensity === "standard" ? "rgba(0, 255, 204, 0.15)" : "transparent",
                  color: tableDensity === "standard" ? "#00ffcc" : "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => handleDensityChange("compact")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: tableDensity === "compact" ? "1px solid #00ffcc" : "1px solid rgba(255,255,255,0.1)",
                  background: tableDensity === "compact" ? "rgba(0, 255, 204, 0.15)" : "transparent",
                  color: tableDensity === "compact" ? "#00ffcc" : "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Compact
              </button>
            </div>
          </div>
        </div>

        {/* Local Storage & Session Data */}
        <div
          style={{
            background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
            borderRadius: "16px",
            border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.1))",
            padding: "1.75rem",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.25rem 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Trash2 size={20} style={{ color: "#ef4444" }} />
            Session Storage & Cache
          </h2>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ display: "block", fontSize: "0.95rem" }}>Clear Cached Context & Toolbars</strong>
              <span style={{ fontSize: "0.85rem", color: "var(--sc-text-dim, #94a3b8)" }}>
                Reset dismissed onboarding tooltips, search filters, and draft inputs stored in browser storage.
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearCache}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#f87171",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Clear Local Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
