import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { StatusRibbon } from "./StatusRibbon";

describe("StatusRibbon", () => {
  it("renders status ribbon with variant label", () => {
    render(<StatusRibbon status="active" label="Live Matchmaking" />);
    expect(screen.getByText("Live Matchmaking")).toBeInTheDocument();
  });
});
