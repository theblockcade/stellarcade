import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import VerifyPage from "./page";

describe("VerifyPage", () => {
  it("renders page title and inputs", () => {
    render(<VerifyPage />);
    expect(screen.getByRole("heading", { level: 1, name: /Provable Fairness Verifier/i })).toBeInTheDocument();
    expect(screen.getByTestId("input-server-seed")).toBeInTheDocument();
    expect(screen.getByTestId("input-commit-hash")).toBeInTheDocument();
    expect(screen.getByTestId("input-client-seed")).toBeInTheDocument();
    expect(screen.getByTestId("input-nonce")).toBeInTheDocument();
    expect(screen.getByTestId("input-ledger-hash")).toBeInTheDocument();
    expect(screen.getByTestId("select-game-range")).toBeInTheDocument();
  });

  it("verifies the default coin flip test vector as valid", async () => {
    render(<VerifyPage />);
    await waitFor(() => {
      expect(screen.getByTestId("verification-status-banner")).toHaveTextContent(/PROVABLY FAIR VERIFIED/i);
    });
    expect(screen.getByTestId("outcome-value-text")).toBeInTheDocument();
  });

  it("loads and applies test vector preset on click", async () => {
    render(<VerifyPage />);
    const dicePresetBtn = screen.getByTestId("preset-dice-roll-pass");
    fireEvent.click(dicePresetBtn);

    await waitFor(() => {
      expect(screen.getByTestId("input-client-seed")).toHaveValue("high_roller_lucky_777");
    });

    await waitFor(() => {
      expect(screen.getByTestId("verification-status-banner")).toHaveTextContent(/PROVABLY FAIR VERIFIED/i);
    });
  });

  it("shows failure when tampered preset is loaded", async () => {
    render(<VerifyPage />);
    const tamperedBtn = screen.getByTestId("preset-tampered-commit-fail");
    fireEvent.click(tamperedBtn);

    await waitFor(() => {
      expect(screen.getByTestId("verification-status-banner")).toHaveTextContent(/VERIFICATION FAILED/i);
    });
  });

  it("copies audit JSON to clipboard", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<VerifyPage />);
    await waitFor(() => {
      expect(screen.getByTestId("btn-copy-report")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("btn-copy-report"));
    expect(writeTextMock).toHaveBeenCalled();
  });
});
