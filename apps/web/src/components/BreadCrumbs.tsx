"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { useI18n } from "../i18n/provider";

const ROUTE_KEYS: Record<string, { key: string; fallback: string }> = {
  app: { key: "nav.lobby", fallback: "Arcade Lobby" },
  games: { key: "nav.games", fallback: "Games Arena" },
  tournaments: { key: "nav.tournaments", fallback: "Tournaments" },
  quests: { key: "nav.quests", fallback: "Quests & Badges" },
  leaderboard: { key: "nav.leaderboard", fallback: "Leaderboard" },
  history: { key: "nav.history", fallback: "Match History" },
  rewards: { key: "nav.rewards", fallback: "Claim Rewards" },
  portfolio: { key: "nav.portfolio", fallback: "Portfolio Vault" },
  cleanup: { key: "nav.cleanup", fallback: "Account Hygiene" },
  profile: { key: "nav.profile", fallback: "Player Profile" },
  settings: { key: "nav.settings", fallback: "Settings" },
  verify: { key: "nav.verify", fallback: "Fairness Verifier" },
  about: { key: "nav.about", fallback: "Architecture & About" },
  terms: { key: "nav.terms", fallback: "Terms of Protocol" },
  privacy: { key: "nav.privacy", fallback: "Privacy Architecture" },
};

export default function Breadcrumbs() {
  const { t } = useI18n();
  const pathname = usePathname();
  const pathnames = pathname.split("/").filter((x) => x);

  const formatLabel = (segment: string) => {
    const config = ROUTE_KEYS[segment];
    if (config) {
      return t(config.key, config.fallback);
    }
    return segment.replace(/-/g, " ");
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        width: "100%",
        padding: "1rem 2rem 0 2rem",
      }}
    >
      <Breadcrumb
        style={{
          display: "inline-flex",
          padding: "6px 14px",
          borderRadius: "999px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.08))",
          backdropFilter: "blur(12px)",
        }}
      >
        <BreadcrumbList style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "var(--sc-text-dim, #94a3b8)",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
              >
                <Home size={13} style={{ color: "var(--sc-accent, #00ffcc)" }} />
                <span>{t("nav.home", "Home")}</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {pathnames.map((segment, index) => {
            const isLast = index === pathnames.length - 1;
            const href = `/${pathnames.slice(0, index + 1).join("/")}`;
            const label = formatLabel(segment);

            return (
              <React.Fragment key={href}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage
                      style={{
                        color: "var(--sc-accent, #00ffcc)",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={href}
                        style={{
                          color: "var(--sc-text-dim, #94a3b8)",
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "color 0.15s ease",
                        }}
                      >
                        {label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
