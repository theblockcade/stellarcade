import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ContentShell } from "./ContentShell";

describe("ContentShell", () => {
  it("renders title, description, and children with proper heading level", () => {
    render(
      <ContentShell
        title="Player Dashboard"
        description="View your active match stats"
        headingLevel={2}
      >
        <div>Content body</div>
      </ContentShell>
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Player Dashboard");
    expect(screen.getByText("View your active match stats")).toBeInTheDocument();
    expect(screen.getByText("Content body")).toBeInTheDocument();
  });
});
