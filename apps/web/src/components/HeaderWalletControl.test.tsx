import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const connect = vi.fn();
const disconnect = vi.fn();

let mockWallet: Record<string, unknown>;

vi.mock("../hooks/useWalletStatus", () => ({
  useWalletStatus: () => mockWallet,
}));

const { default: HeaderWalletControl } = await import("./HeaderWalletControl");

function walletState(overrides: Record<string, unknown> = {}) {
  return {
    status: "DISCONNECTED",
    address: null,
    network: null,
    error: null,
    capabilities: { isConnected: false, isConnecting: false, isReconnecting: false, canConnect: true },
    connect,
    disconnect,
    ...overrides,
  };
}

describe("HeaderWalletControl", () => {
  beforeEach(() => {
    connect.mockClear();
    disconnect.mockClear();
    mockWallet = walletState();
  });

  it("shows a connect button when disconnected", () => {
    render(<HeaderWalletControl />);
    expect(screen.getByTestId("header-wallet-connect")).toHaveTextContent("Connect Wallet");
  });

  it("passes an adapter to connect() — a bare connect() installs no provider and silently does nothing", () => {
    render(<HeaderWalletControl />);
    screen.getByTestId("header-wallet-connect").click();
    expect(connect).toHaveBeenCalledTimes(1);
    expect(connect.mock.calls[0][0]).toBeDefined();
  });

  it("shows wallet details from the compact account menu once connected", async () => {
    const user = userEvent.setup();
    mockWallet = walletState({
      status: "CONNECTED",
      address: "GABCDEF1234567890XYZWVUTSRQPONMLKJIHGFEDCBA98765432",
      network: "TESTNET",
      capabilities: { isConnected: true, isConnecting: false, isReconnecting: false, canConnect: false },
    });
    render(<HeaderWalletControl />);
    await user.click(screen.getByTestId("header-wallet-menu"));
    expect(await screen.findByTestId("header-wallet-address")).toHaveTextContent("GABC…5432");
    expect(screen.getByTestId("header-wallet-network")).toHaveTextContent("TESTNET");
  });

  it("disconnects from the wallet menu", async () => {
    const user = userEvent.setup();
    mockWallet = walletState({
      status: "CONNECTED",
      address: "GABCDEF1234567890XYZ",
      network: "TESTNET",
      capabilities: { isConnected: true, isConnecting: false, isReconnecting: false, canConnect: false },
    });
    render(<HeaderWalletControl />);
    await user.click(screen.getByTestId("header-wallet-menu"));
    await user.click(await screen.findByTestId("header-wallet-disconnect"));
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("offers an install link instead of connect when Freighter is missing", () => {
    mockWallet = walletState({ status: "PROVIDER_MISSING" });
    render(<HeaderWalletControl />);
    expect(screen.getByTestId("header-wallet-install")).toHaveAttribute(
      "href",
      "https://www.freighter.app/",
    );
    expect(screen.queryByTestId("header-wallet-connect")).not.toBeInTheDocument();
  });

  it("disables the button while connecting", () => {
    mockWallet = walletState({
      status: "CONNECTING",
      capabilities: { isConnected: false, isConnecting: true, isReconnecting: false, canConnect: false },
    });
    render(<HeaderWalletControl />);
    expect(screen.getByTestId("header-wallet-connect")).toBeDisabled();
  });

  describe("screen-reader connection announcements", () => {
    it("announces nothing on initial mount", () => {
      render(<HeaderWalletControl />);
      expect(screen.getByTestId("header-wallet-status-announcer")).toHaveTextContent("");
    });

    it("announces a connection attempt starting", async () => {
      const { rerender } = render(<HeaderWalletControl />);
      const announcerEl = screen.getByTestId("header-wallet-status-announcer");
      mockWallet = walletState({
        status: "CONNECTING",
        capabilities: { isConnected: false, isConnecting: true, isReconnecting: false, canConnect: false },
      });
      rerender(<HeaderWalletControl />);
      await waitFor(() => expect(announcerEl).toHaveTextContent("Connecting to wallet…"));
    });

    it("announces a successful connection with the shortened address", async () => {
      const { rerender } = render(<HeaderWalletControl />);
      const announcerEl = screen.getByTestId("header-wallet-status-announcer");
      mockWallet = walletState({
        status: "CONNECTED",
        address: "GABCDEF1234567890XYZWVUTSRQPONMLKJIHGFEDCBA98765432",
        network: "TESTNET",
        capabilities: { isConnected: true, isConnecting: false, isReconnecting: false, canConnect: false },
      });
      rerender(<HeaderWalletControl />);
      await waitFor(() => expect(announcerEl).toHaveTextContent("Wallet connected: GABC…5432"));
    });

    it("announces a disconnect after having been connected", async () => {
      mockWallet = walletState({
        status: "CONNECTED",
        address: "GABCDEF1234567890XYZ",
        capabilities: { isConnected: true, isConnecting: false, isReconnecting: false, canConnect: false },
      });
      const { rerender } = render(<HeaderWalletControl />);
      const announcerEl = screen.getByTestId("header-wallet-status-announcer");
      mockWallet = walletState({ status: "DISCONNECTED" });
      rerender(<HeaderWalletControl />);
      await waitFor(() => expect(announcerEl).toHaveTextContent("Wallet disconnected"));
    });

    it("does not announce the initial DISCONNECTED state as a disconnect event", () => {
      // Regression: a session that starts disconnected (never connected)
      // must not be treated as a "you got disconnected" transition.
      render(<HeaderWalletControl />);
      expect(screen.getByTestId("header-wallet-status-announcer")).toHaveTextContent("");
    });

    it("announces a non-recoverable error assertively", async () => {
      const { rerender } = render(<HeaderWalletControl />);
      const announcerEl = screen.getByTestId("header-wallet-status-announcer");
      mockWallet = walletState({
        status: "ERROR",
        error: { code: "unknown_error", message: "Network unreachable", recoverable: false },
      });
      rerender(<HeaderWalletControl />);
      await waitFor(() => expect(announcerEl).toHaveTextContent("Network unreachable"));
      expect(announcerEl).toHaveAttribute("aria-live", "assertive");
    });

    it("does not double-announce a recoverable error already shown as visible text", async () => {
      // Regression/edge case: PERMISSION_DENIED/STALE_SESSION already render
      // a visible role="status" message — the hidden announcer must stay
      // silent for those so screen readers don't hear it twice.
      const { rerender } = render(<HeaderWalletControl />);
      const announcerEl = screen.getByTestId("header-wallet-status-announcer");
      mockWallet = walletState({
        status: "PERMISSION_DENIED",
        error: { code: "rejected_signature", message: "Connection request rejected", recoverable: true },
      });
      rerender(<HeaderWalletControl />);
      await waitFor(() =>
        expect(screen.getByTestId("header-wallet-error")).toHaveTextContent(
          "Connection request rejected",
        ),
      );
      // Give the (skipped) announce() call's 100ms debounce window a chance
      // to have fired if the double-announce guard were broken.
      await new Promise((resolve) => setTimeout(resolve, 120));
      expect(announcerEl).toHaveTextContent("");
    });
  });
});
