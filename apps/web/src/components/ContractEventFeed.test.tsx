import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ContractEventFeed } from "./ContractEventFeed";

describe("ContractEventFeed", () => {
  it("renders live status and contract event feed header", () => {
    render(<ContractEventFeed contractId="CA1234567890" />);
    expect(screen.getByText("Contract Events")).toBeInTheDocument();
    expect(screen.getByTestId("contract-event-feed-status")).toBeInTheDocument();
  });
});
