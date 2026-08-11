import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { EmptyHintRow } from "./EmptyHintRow";

describe("EmptyHintRow", () => {
  it("renders table row with message and colSpan", () => {
    render(
      <table>
        <tbody>
          <EmptyHintRow colSpan={4} message="No recent transactions found" />
        </tbody>
      </table>
    );
    expect(screen.getByText("No recent transactions found")).toBeInTheDocument();
    const cell = screen.getByRole("cell");
    expect(cell).toHaveAttribute("colSpan", "4");
  });
});
