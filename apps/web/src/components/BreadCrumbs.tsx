"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
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
  portfolio: { key: "nav.portfolio", fallback: "Portfolio" },
  cleanup: { key: "nav.cleanup", fallback: "Cleanup" },
  profile: { key: "nav.profile", fallback: "Player Profile" },
  settings: { key: "nav.settings", fallback: "Settings" },
  verify: { key: "nav.verify", fallback: "Fairness Verifier" },
  about: { key: "nav.about", fallback: "About" },
  terms: { key: "nav.terms", fallback: "Terms" },
  privacy: { key: "nav.privacy", fallback: "Privacy" },
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
    <Breadcrumb className="inline-flex items-center">
      <BreadcrumbList style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, padding: 0 }}>
        {pathnames.map((segment, index) => {
          const isLast = index === pathnames.length - 1;
          const href = `/${pathnames.slice(0, index + 1).join("/")}`;
          const label = formatLabel(segment);

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator className="text-zinc-600">
                <ChevronRight size={13} />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage
                    style={{
                      color: "var(--sc-accent, #00ffcc)",
                      fontSize: "13px",
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
                        fontSize: "13px",
                        fontWeight: 500,
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
  );
}
