"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

export interface LegalDocumentProps {
  title: string;
  icon: React.ReactNode;
  /** Shown under the title, e.g. "Last updated: August 2026". */
  meta: string;
  sections: LegalSection[];
}

/**
 * Shared shell for /terms and /privacy — both are the same shape (masthead,
 * back link, numbered prose sections), so they share one component rather
 * than two near-identical copies of the same markup.
 */
export function LegalDocument({ title, icon, meta, sections }: LegalDocumentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto flex w-full max-w-4xl flex-col gap-6"
    >
      <PageHeader
        icon={icon}
        title={title}
        description={meta}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/app">
              <ArrowLeft />
              Back to Arcade
            </Link>
          </Button>
        }
      />

      <article className="flex flex-col divide-y divide-border/70 rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
        {sections.map((section, idx) => (
          <section key={section.heading} className="p-6">
            <h2 className="text-lg font-bold text-primary">
              <span className="mr-2 font-mono text-sm text-primary/60">{idx + 1}.</span>
              {section.heading}
            </h2>
            <div className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {section.body}
            </div>
          </section>
        ))}
      </article>
    </motion.div>
  );
}

/** Inline `<code>` styling shared by the legal pages. */
export function LegalCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[13px] text-foreground">
      {children}
    </code>
  );
}

/** Inline link styling shared by the legal pages. */
export function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-primary underline underline-offset-4 hover:opacity-80">
      {children}
    </Link>
  );
}

export default LegalDocument;
