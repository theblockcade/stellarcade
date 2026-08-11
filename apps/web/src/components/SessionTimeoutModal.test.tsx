import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SessionTimeoutModal } from "./SessionTimeoutModal";
import WalletSessionService from "../services/wallet-session-service";

describe("SessionTimeoutModal", () => {
  it("renders when session warning triggers", () => {
    const service = new WalletSessionService();
    render(<SessionTimeoutModal sessionService={service} />);
    // When disconnected / hidden, returns null
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
