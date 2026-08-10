import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { colors } from "./colors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_CSS_PATH = path.resolve(__dirname, "../../../frontend/src/index.css");

function extractRootVar(css: string, name: string): string | null {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return match ? match[1]!.trim() : null;
}

describe("colors", () => {
  it("has no duplicate hex values across distinct semantic roles", () => {
    const flat = { ...colors.semantic };
    const values = Object.values(flat);
    expect(new Set(values).size).toBe(values.length);
  });

  it("every color value looks like a valid CSS color (hex or rgba)", () => {
    function walk(obj: Record<string, unknown>): string[] {
      return Object.values(obj).flatMap((v) =>
        typeof v === "string" ? [v] : walk(v as Record<string, unknown>),
      );
    }
    for (const value of walk(colors)) {
      expect(value).toMatch(/^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))$/);
    }
  });

  // Regression guard: these tokens were extracted from the live frontend's
  // `:root` block. If the frontend's colors change without this package
  // being updated (or vice versa), this test catches the drift instead of
  // the two silently diverging further.
  describe("stays in sync with frontend/src/index.css :root", () => {
    let css: string;
    try {
      css = readFileSync(FRONTEND_CSS_PATH, "utf8");
    } catch {
      css = "";
    }

    it.skipIf(css === "")("--bg-dark matches colors.bg.dark", () => {
      expect(extractRootVar(css, "bg-dark")).toBe(colors.bg.dark);
    });

    it.skipIf(css === "")("--bg-card matches colors.bg.card", () => {
      expect(extractRootVar(css, "bg-card")).toBe(colors.bg.card);
    });

    it.skipIf(css === "")("--accent matches colors.accent.default", () => {
      expect(extractRootVar(css, "accent")).toBe(colors.accent.default);
    });

    it.skipIf(css === "")("--accent-glow matches colors.accent.glow", () => {
      expect(extractRootVar(css, "accent-glow")).toBe(colors.accent.glow);
    });

    it.skipIf(css === "")("--text-main matches colors.text.main", () => {
      expect(extractRootVar(css, "text-main")).toBe(colors.text.main);
    });

    it.skipIf(css === "")("--text-dim matches colors.text.dim", () => {
      expect(extractRootVar(css, "text-dim")).toBe(colors.text.dim);
    });

    it.skipIf(css === "")("--glass-border matches colors.border.glass", () => {
      expect(extractRootVar(css, "glass-border")).toBe(colors.border.glass);
    });
  });
});
