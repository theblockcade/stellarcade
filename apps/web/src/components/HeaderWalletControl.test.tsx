import { render, screen } from "@testing-library/react";
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
});
