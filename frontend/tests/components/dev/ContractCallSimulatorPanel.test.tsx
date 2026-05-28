/**
 * @vitest-environment happy-dom
 */

import { ContractCallSimulatorPanel } from "@/components/dev/ContractCallSimulatorPanel";
import {
  devClearContractSimResults,
  devPeekContractSimResult,
} from "@/services/soroban-contract-dev";
import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

describe("ContractCallSimulatorPanel", () => {
  afterEach(() => {
    devClearContractSimResults();
  });

  it("expands and registers a success mock from the form", () => {
    if (import.meta.env.PROD) return;
    render(<ContractCallSimulatorPanel />);

    fireEvent.click(screen.getByTestId("contract-call-simulator-toggle"));

    fireEvent.change(screen.getByTestId("contract-call-simulator-contract"), {
      target: {
        value: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      },
    });
    fireEvent.change(screen.getByTestId("contract-call-simulator-method"), {
      target: { value: "get_pool_state" },
    });
    fireEvent.change(screen.getByTestId("contract-call-simulator-payload"), {
      target: { value: '{"available": "10", "reserved": "2"}' },
    });

    fireEvent.click(screen.getByTestId("contract-call-simulator-register"));

    const hit = devPeekContractSimResult(
      "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      "get_pool_state",
    );
    expect(hit?.success).toBe(true);
    if (hit?.success) {
      expect(hit.data).toEqual({ available: "10", reserved: "2" });
    }

    expect(
      screen.getByTestId("contract-call-simulator-keys"),
    ).toBeInTheDocument();
  });

  it("clear removes registered mocks", () => {
    if (import.meta.env.PROD) return;
    render(<ContractCallSimulatorPanel />);
    fireEvent.click(screen.getByTestId("contract-call-simulator-toggle"));

    fireEvent.change(screen.getByTestId("contract-call-simulator-contract"), {
      target: {
        value: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      },
    });
    fireEvent.change(screen.getByTestId("contract-call-simulator-method"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByTestId("contract-call-simulator-register"));

    fireEvent.click(screen.getByTestId("contract-call-simulator-clear"));

    expect(
      devPeekContractSimResult(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
        "x",
      ),
    ).toBeNull();
  });

  it("applies preset values deterministically", () => {
    if (import.meta.env.PROD) return;
    render(<ContractCallSimulatorPanel />);
    fireEvent.click(screen.getByTestId("contract-call-simulator-toggle"));

    fireEvent.change(screen.getByTestId("contract-call-simulator-preset"), {
      target: { value: "pool-state-success" },
    });

    expect(
      (
        screen.getByTestId(
          "contract-call-simulator-contract",
        ) as HTMLInputElement
      ).value,
    ).toBe("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4");
    expect(
      (screen.getByTestId("contract-call-simulator-method") as HTMLInputElement)
        .value,
    ).toBe("get_pool_state");
    expect(
      (
        screen.getByTestId(
          "contract-call-simulator-payload",
        ) as HTMLTextAreaElement
      ).value,
    ).toBe('{"available":"100","reserved":"20"}');
  });

  it("renders contextual helper text for advanced contract fields", () => {
    if (import.meta.env.PROD) return;
    render(<ContractCallSimulatorPanel />);
    fireEvent.click(screen.getByTestId("contract-call-simulator-toggle"));

    expect(
      screen.getByText(
        "Use the exact contract address the page will simulate or invoke.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Match the Soroban method name, including underscores."),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contract-call-simulator-contract"),
    ).toHaveAttribute(
      "aria-describedby",
      "contract-call-simulator-contract-helper",
    );
    expect(
      screen.getByTestId("contract-call-simulator-payload"),
    ).toHaveAttribute(
      "aria-describedby",
      "contract-call-simulator-payload-helper",
    );
  });

  it("switches payload helper text for failure mode", () => {
    if (import.meta.env.PROD) return;
    render(<ContractCallSimulatorPanel />);
    fireEvent.click(screen.getByTestId("contract-call-simulator-toggle"));
    fireEvent.click(screen.getByTestId("contract-call-simulator-mode-failure"));

    expect(
      screen.getByText(
        "Write the message callers should receive for the simulated failure.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contract-call-simulator-failure-code"),
    ).toHaveAttribute(
      "aria-describedby",
      "contract-call-simulator-failure-helper",
    );
  });

  it("allows manual overrides after preset application", () => {
    if (import.meta.env.PROD) return;
    render(<ContractCallSimulatorPanel />);
    fireEvent.click(screen.getByTestId("contract-call-simulator-toggle"));

    fireEvent.change(screen.getByTestId("contract-call-simulator-preset"), {
      target: { value: "coin-flip-fail" },
    });
    fireEvent.change(screen.getByTestId("contract-call-simulator-method"), {
      target: { value: "custom_method" },
    });

    fireEvent.click(screen.getByTestId("contract-call-simulator-register"));
    expect(
      devPeekContractSimResult(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
        "custom_method",
      ),
    ).not.toBeNull();
  });

  it("creates a log entry when a mock is registered", () => {
    if (import.meta.env.PROD) return;
    render(<ContractCallSimulatorPanel />);
    fireEvent.click(screen.getByTestId("contract-call-simulator-toggle"));

    fireEvent.change(screen.getByTestId("contract-call-simulator-contract"), {
      target: {
        value: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      },
    });
    fireEvent.change(screen.getByTestId("contract-call-simulator-method"), {
      target: { value: "test_method" },
    });
    fireEvent.click(screen.getByTestId("contract-call-simulator-register"));

    const entries = screen.getAllByTestId("contract-call-simulator-log-entry");
    expect(entries.length).toBe(1);
    expect(entries[0]).toHaveTextContent("test_method");
  });

  it("clears log entries when clear log is clicked", () => {
    if (import.meta.env.PROD) return;
    render(<ContractCallSimulatorPanel />);
    fireEvent.click(screen.getByTestId("contract-call-simulator-toggle"));

    fireEvent.change(screen.getByTestId("contract-call-simulator-contract"), {
      target: {
        value: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      },
    });
    fireEvent.change(screen.getByTestId("contract-call-simulator-method"), {
      target: { value: "m1" },
    });
    fireEvent.click(screen.getByTestId("contract-call-simulator-register"));

    fireEvent.click(screen.getByTestId("contract-call-simulator-log-clear"));

    expect(
      screen.queryByTestId("contract-call-simulator-log-entry"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("contract-call-simulator-log-empty"),
    ).toBeInTheDocument();
  });

  it("shows empty state when no log entries exist", () => {
    if (import.meta.env.PROD) return;
    render(<ContractCallSimulatorPanel />);
    fireEvent.click(screen.getByTestId("contract-call-simulator-toggle"));

    expect(
      screen.getByTestId("contract-call-simulator-log-empty"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contract-call-simulator-log-empty"),
    ).toHaveTextContent("No requests logged yet");
  });
});
