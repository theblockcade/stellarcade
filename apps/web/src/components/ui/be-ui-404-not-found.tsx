"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

const NOT_FOUND_DEFAULTS = {
  code: "404",
  title: "Page not found",
  description: "The page you are looking for does not exist or has been moved.",
  homeHref: "/",
  homeLabel: "Go home",
  browseHref: "/",
  browseLabel: "Browse pages",
};

export interface NotFoundProps {
  className?: string;
  code?: string;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
  browseHref?: string;
  browseLabel?: string;
}

interface NotFoundStageProps {
  className?: string;
  children: ReactNode;
}

function NotFoundStage({ className, children }: NotFoundStageProps) {
  return (
    <section
      className={cn(
        "flex min-h-dvh w-full flex-col items-center justify-center gap-8 px-6 py-20 text-center",
        className,
      )}
    >
      {children}
    </section>
  );
}

interface NotFoundActionsProps {
  homeHref?: string;
  homeLabel?: string;
  browseHref?: string;
  browseLabel?: string;
}

function NotFoundActions({
  homeHref = NOT_FOUND_DEFAULTS.homeHref,
  homeLabel = NOT_FOUND_DEFAULTS.homeLabel,
  browseHref = NOT_FOUND_DEFAULTS.browseHref,
  browseLabel = NOT_FOUND_DEFAULTS.browseLabel,
}: NotFoundActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button asChild variant="brand" size="pill">
        <a href={homeHref}>{homeLabel}</a>
      </Button>
      <Button asChild variant="brand-outline" size="pill">
        <a href={browseHref}>{browseLabel}</a>
      </Button>
    </div>
  );
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@$?/\\";
const SCRAMBLE_MS = 700;
const TICK_MS = 45;

function Scramble({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (reduce) {
      setDisplay(text);
      return;
    }

    const chars = text.split("");
    const start = performance.now();
    let raf = 0;
    let last = 0;

    const loop = (now: number) => {
      if (now - last >= TICK_MS) {
        last = now;

        const progress = Math.min((now - start) / SCRAMBLE_MS, 1);
        const settled = Math.floor(progress * chars.length);

        setDisplay(
          chars
            .map((ch, i) =>
              i < settled || ch === " "
                ? ch
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            )
            .join(""),
        );
      }

      if (now - start < SCRAMBLE_MS) {
        raf = requestAnimationFrame(loop);
      } else {
        setDisplay(text);
      }
    };

    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, [text, reduce]);

  return <span className="tabular-nums">{display}</span>;
}

export function NotFoundGlitch({
  className,
  code = NOT_FOUND_DEFAULTS.code,
  title = NOT_FOUND_DEFAULTS.title,
  description = NOT_FOUND_DEFAULTS.description,
  homeHref,
  homeLabel,
  browseHref,
  browseLabel,
}: NotFoundProps) {
  return (
    <NotFoundStage className={className}>
      <div className="group relative select-none font-mono font-bold leading-none tracking-tighter text-foreground [font-size:clamp(7rem,24vw,16rem)]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 text-[#ff0040] opacity-0 mix-blend-screen transition-[transform,opacity] duration-150 ease-out group-hover:translate-x-[3px] group-hover:opacity-70 motion-reduce:hidden"
        >
          <Scramble text={code} />
        </span>

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 text-[#00e5ff] opacity-0 mix-blend-screen transition-[transform,opacity] duration-150 ease-out group-hover:-translate-x-[3px] group-hover:opacity-70 motion-reduce:hidden"
        >
          <Scramble text={code} />
        </span>

        <h1 className="relative">
          <Scramble text={code} />
        </h1>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>

      <NotFoundActions
        homeHref={homeHref}
        homeLabel={homeLabel}
        browseHref={browseHref}
        browseLabel={browseLabel}
      />
    </NotFoundStage>
  );
}
