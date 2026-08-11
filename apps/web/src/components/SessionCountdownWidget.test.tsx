import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SessionCountdownWidget } from "./SessionCountdownWidget";

describe("SessionCountdownWidget", () => {
  it("renders countdown remaining formatted string", () => {
    render(<SessionCountdownWidget remainingMs={75000} />);
    expect(screen.getByText("1m 15s")).toBeInTheDocument();
  });

  it("renders Expired when remainingMs is 0", () => {
    render(<SessionCountdownWidget remainingMs={0} />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });
});
