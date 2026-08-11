import { describe, it, expect } from "vitest";
import { findFirstFocusable, isFocusable } from "./focus-management";

describe("focus-management", () => {
  it("detects focusable elements correctly", () => {
    const btn = document.createElement("button");
    expect(isFocusable(btn)).toBe(true);

    btn.setAttribute("disabled", "true");
    expect(isFocusable(btn)).toBe(false);

    const div = document.createElement("div");
    const container = document.createElement("div");
    const input = document.createElement("input");
    container.appendChild(div);
    container.appendChild(input);

    expect(findFirstFocusable(container)).toBe(input);
  });
});
