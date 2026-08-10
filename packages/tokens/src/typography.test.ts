import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { typography } from "./typography.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_CSS_PATH = path.resolve(__dirname, "../../../frontend/src/index.css");

describe("typography", () => {
  it("base font family matches the frontend's --font-family", () => {
    let css: string;
    try {
      css = readFileSync(FRONTEND_CSS_PATH, "utf8");
    } catch {
      return;
    }
    const match = css.match(/--font-family:\s*([^;]+);/);
    expect(match?.[1]?.trim()).toBe(typography.fontFamily.base);
  });
});
