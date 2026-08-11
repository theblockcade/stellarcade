import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { PageIntro } from "./PageIntro";

describe("PageIntro", () => {
  it("renders page header with eyebrow, title, description, breadcrumbs, and meta stats", () => {
    render(
      <PageIntro
        eyebrow="Soroban System"
        title="Audit Logs"
        description="Verify on-chain telemetry and contract events"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Audit" },
        ]}
        meta={[{ label: "Total Events", value: "1,420" }]}
      />
    );

    expect(screen.getByText("Soroban System")).toBeInTheDocument();
    expect(screen.getByText("Audit Logs")).toBeInTheDocument();
    expect(screen.getByText("Verify on-chain telemetry and contract events")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Total Events")).toBeInTheDocument();
    expect(screen.getByText("1,420")).toBeInTheDocument();
  });
});
