import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { PropertyList } from "./PropertyList";

describe("PropertyList", () => {
  it("renders key-value items with custom types", () => {
    render(
      <PropertyList
        title="Contract Details"
        properties={[
          { key: "Network", value: "Soroban Testnet", type: "badge", tone: "info" },
          { key: "Contract ID", value: "CA3B...9X1A", type: "code" },
        ]}
      />
    );

    expect(screen.getByText("Contract Details")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("Soroban Testnet")).toBeInTheDocument();
    expect(screen.getByText("Contract ID")).toBeInTheDocument();
    expect(screen.getByText("CA3B...9X1A")).toBeInTheDocument();
  });
});
