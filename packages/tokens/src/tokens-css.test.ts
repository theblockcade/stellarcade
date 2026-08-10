import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { colors } from "./colors.js";
import { typography } from "./typography.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.join(__dirname, "tokens.css"), "utf8");

function cssVar(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`--${name} not found in tokens.css`);
  return match[1]!.trim();
}

describe("tokens.css stays in sync with the TS token exports", () => {
  it("bg tokens match", () => {
    expect(cssVar("sc-bg-dark")).toBe(colors.bg.dark);
    expect(cssVar("sc-bg-card")).toBe(colors.bg.card);
  });

  it("accent tokens match", () => {
    expect(cssVar("sc-accent")).toBe(colors.accent.default);
    expect(cssVar("sc-accent-glow")).toBe(colors.accent.glow);
  });

  it("text tokens match", () => {
    expect(cssVar("sc-text-main")).toBe(colors.text.main);
    expect(cssVar("sc-text-dim")).toBe(colors.text.dim);
  });

  it("border token matches", () => {
    expect(cssVar("sc-border-glass")).toBe(colors.border.glass);
  });

  it("semantic color tokens match", () => {
    expect(cssVar("sc-error")).toBe(colors.semantic.error);
    expect(cssVar("sc-warning")).toBe(colors.semantic.warning);
    expect(cssVar("sc-success")).toBe(colors.semantic.success);
    expect(cssVar("sc-info")).toBe(colors.semantic.info);
  });

  it("typography tokens match", () => {
    expect(cssVar("sc-font-base")).toBe(typography.fontFamily.base);
    expect(cssVar("sc-font-mono")).toBe(typography.fontFamily.mono);
  });
});
