"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Landing sections the nav tracks for scroll-spy highlighting. */
const SECTIONS = [
  { id: "fairness", label: "Fairness" },
  { id: "platforms", label: "Platforms" },
  { id: "faq", label: "FAQ" },
];

/** Nav link chrome, shared by the tracked-section links and the Docs link. */
const NAV_LINK =
  "rounded-full px-3.5 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground max-[720px]:px-3.5 max-[720px]:py-3";

/**
 * Floating, scroll-spy landing nav. Same interaction shape as most modern
 * marketing sites (fixed pill bar, active-section highlighting, hash-free
 * smooth scroll): observe each tracked section, highlight its nav link while
 * it's in the viewport's upper-middle band, and strip any landed-on hash from
 * the URL so it never accumulates.
 *
 * Styling moved from nav.module.css to Tailwind utilities. The one thing to
 * preserve carefully: below 720px the link row collapses out of the pill and
 * re-opens as an absolutely-positioned sheet under it, which is why the
 * open/closed states carry two different layouts rather than a simple toggle.
 */
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
      history.replaceState(null, "", "/");
    }
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSection(entry.target.id);
          } else {
            setSection((prev) => (prev === entry.target.id ? null : prev));
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    targets.forEach((el) => observer.observe(el));

    const onHashChange = () => {
      if (window.location.hash) history.replaceState(null, "", "/");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  const goTo = (id: string) => (e: React.MouseEvent) => {
    close();
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    history.replaceState(null, "", "/");
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-60 flex justify-center px-6 pt-4">
      <nav className="pointer-events-auto flex w-full max-w-[900px] items-center gap-2.5 rounded-full border border-[color:var(--glass-border)] bg-[rgba(5,5,5,0.72)] py-2 pr-2.5 pl-5 backdrop-blur-[14px]">
        <Link
          href="/"
          className="group mr-auto inline-flex items-center leading-none"
          onClick={close}
        >
          {/* The logo asset is a 1536x1024 canvas: the "S" sits at x 237-1181 /
              y 198-989 and the sparkle floats out to x 1415 / y 17. The box below
              is sized to the S alone (so it butts up against "tellarCade" like a
              real cap) and the sparkle is allowed to overhang above and right. */}
          <span className="relative block h-[18px] w-6 shrink-0 origin-left transition-transform group-hover:scale-105">
            <Image
              src="/favicon-logo.webp"
              alt="StellarCade Logo"
              width={35}
              height={23}
              className="absolute -top-[4.5px] -left-[5.4px] block h-[23.3px] w-[35px] max-w-none object-contain"
            />
          </span>
          <span
            className="mt-px text-[15px] leading-none font-bold tracking-[-0.02em] text-foreground"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            tellarCade
          </span>
        </Link>

        <div
          className={cn(
            "flex gap-0.5",
            open
              ? "max-[720px]:absolute max-[720px]:top-[62px] max-[720px]:right-4 max-[720px]:left-4 max-[720px]:flex-col max-[720px]:rounded-2xl max-[720px]:border max-[720px]:border-[color:var(--glass-border)] max-[720px]:bg-[rgba(5,5,5,0.95)] max-[720px]:p-2.5 max-[720px]:backdrop-blur-[14px]"
              : "max-[720px]:hidden",
          )}
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`/#${s.id}`}
              className={cn(NAV_LINK, section === s.id && "bg-[color:var(--accent-glow)] text-primary")}
              onClick={goTo(s.id)}
            >
              {s.label}
            </a>
          ))}
          <a
            href="https://docs.stellarcade.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className={NAV_LINK}
          >
            Docs
          </a>
        </div>

        <Button asChild variant="brand" size="sm" className="shrink-0">
          <Link href="/app">Launch app</Link>
        </Button>

        <button
          type="button"
          className="hidden size-9 shrink-0 place-items-center rounded-full border border-[color:var(--glass-border)] bg-transparent text-foreground max-[720px]:grid"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          <span aria-hidden="true">☰</span>
        </button>
      </nav>
    </div>
  );
}
