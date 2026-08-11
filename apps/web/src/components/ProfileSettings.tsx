"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  Wallet,
  Copy,
  Check,
  Trophy,
  Award,
  Sparkles,
  ExternalLink,
  Save,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "./ui/button";
import { useWalletStatus } from "../hooks/useWalletStatus";
import GlobalStateStore from "../services/global-state-store";

export const profileStore = new GlobalStateStore();

export const ProfileSettings: React.FC = () => {
  const wallet = useWalletStatus();
  const [username, setUsername] = useState("ArcadePlayer_77");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load username from localStorage if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("stc_player_username");
      if (stored) setUsername(stored);
      else if (wallet.address) {
        setUsername(`Player_${wallet.address.slice(0, 4)}`);
      }
    }
  }, [wallet.address]);

  const handleCopy = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("stc_player_username", username.trim() || "ArcadePlayer_77");
    }
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }, 400);
  };

  const compactAddress = wallet.address
    ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}`
    : "No wallet connected";

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <User size={30} style={{ color: "var(--sc-accent, #00ffcc)" }} />
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Player Profile & Identity</h1>
          </div>
          <p style={{ color: "var(--sc-text-dim, #94a3b8)", margin: 0, fontSize: "1rem" }}>
            Manage your on-chain player identity, connected Freighter credentials, and arcade progression.
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
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={16} /> Profile Saved
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Player Identity Card */}
        <div
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #00ffcc, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#000",
                fontSize: "24px",
                fontWeight: 800,
                boxShadow: "0 0 20px rgba(0, 255, 204, 0.3)",
              }}
            >
              {username.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0" }}>{username}</h2>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "rgba(0, 255, 204, 0.15)",
                  color: "var(--sc-accent, #00ffcc)",
                  textTransform: "uppercase",
                }}
              >
                Level 12 • Cyber Gladiator
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--sc-text-dim, #94a3b8)", marginBottom: "6px" }}>
                Display Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter display name"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            <Button type="submit" disabled={isSaving} variant="brand" size="sm" className="w-full">
              <Save size={14} style={{ marginRight: "6px" }} />
              {isSaving ? "Saving..." : "Save Identity"}
            </Button>
          </form>
        </div>

        {/* Right Column: Connected Wallet Card */}
        <div
          style={{
            background: "var(--sc-bg-card, rgba(255, 255, 255, 0.04))",
            borderRadius: "16px",
            border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.1))",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "1.5rem",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Wallet size={20} style={{ color: "var(--sc-accent, #00ffcc)" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Connected Wallet</h3>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "999px",
                  background: wallet.capabilities.isConnected ? "rgba(0, 255, 204, 0.15)" : "rgba(255, 255, 255, 0.08)",
                  color: wallet.capabilities.isConnected ? "var(--sc-accent, #00ffcc)" : "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                {wallet.capabilities.isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.08)",
                marginBottom: "1rem",
              }}
            >
              <code style={{ fontSize: "13px", color: "#fff", fontFamily: "var(--sc-font-mono, monospace)" }}>
                {compactAddress}
              </code>
              {wallet.address && (
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy Wallet Address"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: copied ? "var(--sc-accent, #00ffcc)" : "var(--sc-text-dim, #94a3b8)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "var(--sc-text-dim, #94a3b8)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                  Network
                </span>
                <strong style={{ color: "#fff" }}>{wallet.network || "Stellar Testnet"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--sc-text-dim, #94a3b8)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                  Provider
                </span>
                <strong style={{ color: "#fff" }}>{wallet.provider?.name || "Freighter"}</strong>
              </div>
            </div>
          </div>

          <div>
            {wallet.capabilities.isConnected ? (
              <Button
                type="button"
                onClick={() => void wallet.disconnect()}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Disconnect Wallet
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void wallet.connect()}
                variant="brand"
                size="sm"
                className="w-full"
              >
                Connect Freighter Wallet
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Spotlight Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        <div
          style={{
            padding: "1.25rem",
            borderRadius: "14px",
            background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
            border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.08))",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
            Total Rounds Played
          </span>
          <strong style={{ fontSize: "1.5rem", color: "#fff" }}>142</strong>
        </div>

        <div
          style={{
            padding: "1.25rem",
            borderRadius: "14px",
            background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
            border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.08))",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
            Win Rate
          </span>
          <strong style={{ fontSize: "1.5rem", color: "var(--sc-accent, #00ffcc)" }}>64.2%</strong>
        </div>

        <div
          style={{
            padding: "1.25rem",
            borderRadius: "14px",
            background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
            border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.08))",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
            XLM Wagered
          </span>
          <strong style={{ fontSize: "1.5rem", color: "#fff" }}>2,850 XLM</strong>
        </div>

        <div
          style={{
            padding: "1.25rem",
            borderRadius: "14px",
            background: "var(--sc-bg-card, rgba(255,255,255,0.04))",
            border: "1px solid var(--sc-border-glass, rgba(255,255,255,0.08))",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--sc-text-dim, #94a3b8)", textTransform: "uppercase", display: "block" }}>
            Soulbound Badges
          </span>
          <strong style={{ fontSize: "1.5rem", color: "var(--sc-accent, #00ffcc)" }}>5 SBTs</strong>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
