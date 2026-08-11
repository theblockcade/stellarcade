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

const ROUTE_LABELS: Record<string, string> = {
  app: "Arcade Lobby",
  games: "Games Arena",
  tournaments: "Tournaments",
  quests: "Quests & Badges",
  leaderboard: "Leaderboard",
  history: "Match History",
  rewards: "Claim Rewards",
  portfolio: "Portfolio Vault",
  cleanup: "Account Hygiene",
  profile: "Player Profile",
  settings: "Settings",
  verify: "Fairness Verifier",
  about: "Architecture & About",
  terms: "Terms of Protocol",
  privacy: "Privacy Architecture",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const pathnames = pathname.split("/").filter((x) => x);

  const formatLabel = (segment: string) => {
    return ROUTE_LABELS[segment] || segment.replace(/-/g, " ");
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
