import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { StatusAnnouncer } from "./StatusAnnouncer";

describe("StatusAnnouncer", () => {
  it("renders live region container", () => {
    render(<StatusAnnouncer message="Payment confirmed" />);
    expect(screen.getByTestId("status-announcer")).toBeInTheDocument();
  });
});
