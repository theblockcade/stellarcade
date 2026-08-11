import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { CompactMetadataStack } from "./CompactMetadataStack";

describe("CompactMetadataStack", () => {
  it("renders metadata items in a definition list", () => {
    render(
      <CompactMetadataStack
        items={[
          { id: "fee", label: "Estimated Fee", value: "0.00001 XLM" },
          { id: "sequence", label: "Ledger Sequence", value: "12,492" },
        ]}
      />
    );

    expect(screen.getByText("Estimated Fee")).toBeInTheDocument();
    expect(screen.getByText("0.00001 XLM")).toBeInTheDocument();
    expect(screen.getByText("Ledger Sequence")).toBeInTheDocument();
    expect(screen.getByText("12,492")).toBeInTheDocument();
  });
});
