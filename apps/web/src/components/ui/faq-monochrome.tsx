"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface FaqMonochromeItem {
  question: string;
  answer: string;
  meta?: string;
}

export interface FaqAccordionMonochromeProps {
  items: FaqMonochromeItem[];
  className?: string;
}

/**
 * Expandable FAQ list, from 21st.dev's "FAQ Monochrome" pattern — just the
 * card-list interaction (per-card cursor-following glow, expand/collapse,
 * meta tag), not the full page it shipped in. Dropped from the source:
 *
 * - The outer min-h-screen wrapper, its own "Questions" header, and the
 *   aurora/overlay background layers — this app's landing page already has
 *   its own eyebrow/heading for this section (see app/page.tsx's #faq
 *   section) and its own hero-level background; keeping both would just be
 *   two competing headers stacked on top of each other.
 * - The day/night theme toggle and its MutationObserver/localStorage
 *   ("bento-theme") sync logic — this app has a single dark theme (see
 *   app/globals.css), so there's nothing to toggle.
 * - The "Signal FAQ" intro pill (spinning conic-gradient beam + pulse ring)
 *   — decorative chrome that duplicated the section's own heading context
 *   without adding real information.
 *
 * Also fixed to compile under this project's strict TypeScript: the source
 * left several callback params (`event`, `index`) implicitly `any`, and set
 * a custom CSS property (`--faq-outline`) directly in a style object, which
 * React.CSSProperties doesn't recognize without a cast.
 */
export function FaqAccordionMonochrome({ items, className }: FaqAccordionMonochromeProps) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const toggleQuestion = (index: number) => setActiveIndex((prev) => (prev === index ? -1 : index));

  const setCardGlow = (event: React.MouseEvent<HTMLLIElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--faq-x", `${event.clientX - rect.left}px`);
    target.style.setProperty("--faq-y", `${event.clientY - rect.top}px`);
  };

  const clearCardGlow = (event: React.MouseEvent<HTMLLIElement>) => {
    const target = event.currentTarget;
    target.style.removeProperty("--faq-x");
    target.style.removeProperty("--faq-y");
  };

  return (
    <ul className={cn("space-y-4", className)}>
      {items.map((item, index) => {
        const open = activeIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-trigger-${index}`;

        return (
          <li
            key={item.question}
            // bg-card (--sc-bg-card) is only 5% white — fine as a glass tint
            // over a solid page, but this app now runs an animated mesh
            // behind every section, so a literal near-opaque background is
            // used instead of the token (still blurred, so it still reads as
            // "glass," just not see-through to the moving lines underneath).
            className="group relative overflow-hidden rounded-3xl border border-border bg-[rgba(10,10,10,0.85)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-0.5 focus-within:-translate-y-0.5 shadow-[0_36px_140px_-60px_rgba(10,10,10,0.95)]"
            onMouseMove={setCardGlow}
            onMouseLeave={clearCardGlow}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 transition-opacity duration-500",
                open ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
              style={{
                background:
                  "radial-gradient(240px circle at var(--faq-x, 50%) var(--faq-y, 50%), var(--accent-glow), transparent 70%)",
              }}
            />

            <button
              type="button"
              id={buttonId}
              aria-controls={panelId}
              aria-expanded={open}
              onClick={() => toggleQuestion(index)}
              style={{ "--faq-outline": "var(--accent)" } as React.CSSProperties}
              className="relative flex w-full items-start gap-6 px-8 py-7 text-left transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--faq-outline)]"
            >
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted transition-all duration-500 group-hover:scale-105">
                <span
                  className={cn(
                    "pointer-events-none absolute inset-0 rounded-full border border-border opacity-30",
                    open && "animate-ping",
                  )}
                />
                <svg
                  className={cn("relative h-5 w-5 text-foreground transition-transform duration-500", open && "rotate-45")}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <h3 className="text-lg font-medium leading-tight text-foreground sm:text-xl">{item.question}</h3>
                  {item.meta && (
                    <span className="inline-flex w-fit items-center rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-muted-foreground sm:ml-auto">
                      {item.meta}
                    </span>
                  )}
                </div>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={cn(
                    "overflow-hidden text-sm leading-relaxed text-muted-foreground transition-[max-height] duration-500 ease-out",
                    open ? "max-h-64" : "max-h-0",
                  )}
                >
                  <p className="pr-2">{item.answer}</p>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default FaqAccordionMonochrome;
