"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "./nav.module.css";

/** Landing sections the nav tracks for scroll-spy highlighting. */
const SECTIONS = [
  { id: "fairness", label: "Fairness" },
  { id: "platforms", label: "Platforms" },
  { id: "faq", label: "FAQ" },
];

/**
 * Floating, scroll-spy landing nav. Same interaction shape as most modern
 * marketing sites (fixed pill bar, active-section highlighting, hash-free
 * smooth scroll): observe each tracked section, highlight its nav link while
 * it's in the viewport's upper-middle band, and strip any landed-on hash from
 * the URL so it never accumulates.
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
    <div className={styles.navOuter}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand} onClick={close}>
          StellarCade
        </Link>

        <div className={`${styles.navLinks} ${open ? styles.open : ""}`}>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`/#${s.id}`}
              className={section === s.id ? styles.active : ""}
              onClick={goTo(s.id)}
            >
              {s.label}
            </a>
          ))}
        </div>

        <Button asChild variant="brand" size="sm" className={styles.launchBtn}>
          <Link href="/app">Launch app</Link>
        </Button>

        <button
          type="button"
          className={styles.navToggle}
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
