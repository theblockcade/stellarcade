"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Home
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
                  <BreadcrumbPage className="text-emerald-400 font-semibold capitalize">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className="hover:text-emerald-400 transition-colors capitalize">
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
