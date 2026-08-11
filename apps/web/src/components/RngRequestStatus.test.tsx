import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { RngRequestStatusComponent } from "./RngRequestStatus";
import { RngRequestStatus } from "../types/contracts/rng";

describe("RngRequestStatus", () => {
  it("renders fulfilled RNG result", () => {
    render(
      <RngRequestStatusComponent
        request={{
          requestId: "rng-9988",
          status: RngRequestStatus.Fulfilled,
          result: 42,
          requestedAt: Date.now() - 5000,
        }}
      />
    );

    expect(screen.getByText("ID: rng-9988")).toBeInTheDocument();
    expect(screen.getByText("Fulfilled")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
