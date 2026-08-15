import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AppPage from "./page";

describe("AppPage", () => {
  it("renders the arcade lobby dashboard", async () => {
    render(<AppPage />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: /Arcade Lobby/i })).toBeInTheDocument();
    });
  });

  it("renders the live arena panel with the on-chain game catalog", async () => {
    render(<AppPage />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: /Live arena/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { level: 3, name: /Coinflip Duel/i })).toBeInTheDocument();
  });

  /*
   * The dashboard must never invent numbers. With no settlement data source
   * behind them, the volume/activity/leaderboard panels have to say so rather
   * than render a plausible-looking figure — on a wallet dashboard a
   * placeholder balance reads as a real one.
   */
  it("shows honest empty states instead of placeholder figures", async () => {
    render(<AppPage />);
    await waitFor(() => {
      expect(screen.getByText(/No settled rounds yet/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/No activity yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Nobody on the board yet/i)).toBeInTheDocument();
    expect(screen.getByText(/No proofs to check yet/i)).toBeInTheDocument();
  });

  it("does not render a wallet balance figure while disconnected", async () => {
    render(<AppPage />);
    const tile = await screen.findByTestId("dashboard-balance-tile");

    expect(tile).toHaveTextContent(/Connect a wallet to see your balance/i);
    // The balance tile itself must show an em-dash, never a number. (Other
    // XLM figures on the page are the games catalog's real min-wagers, which
    // are genuine data and must keep rendering.)
    expect(tile).toHaveTextContent("—");
    expect(tile.textContent).not.toMatch(/\d[\d,.]*\s*XLM/);
  });
});
