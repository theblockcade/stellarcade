import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { EntityActionShortcuts } from "./EntityActionShortcuts";

describe("EntityActionShortcuts", () => {
  it("renders links and alerts inside content shell", () => {
    render(
      <EntityActionShortcuts
        title="Contract Actions"
        description="Quick shortcuts for this contract"
        links={[{ id: "1", label: "View Audit Log" }]}
        alerts={[{ id: "a1", variant: "info", description: "Contract is healthy" }]}
      />
    );

    expect(screen.getByText("Contract Actions")).toBeInTheDocument();
    expect(screen.getByText("View Audit Log")).toBeInTheDocument();
    expect(screen.getByText("Contract is healthy")).toBeInTheDocument();
  });
});
