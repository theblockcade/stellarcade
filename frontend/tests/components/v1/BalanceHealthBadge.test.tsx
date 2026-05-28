import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  BalanceHealthBadge,
  getBalanceHealthMeta,
} from "../../../src/components/v1/BalanceHealthBadge";

describe("BalanceHealthBadge", () => {
  it("renders healthy balance state", () => {
    render(<BalanceHealthBadge balance={25} />);

    expect(screen.getByTestId("balance-health-badge")).toHaveTextContent("Healthy");
    expect(screen.getByTestId("balance-health-badge")).toHaveAttribute(
      "data-tone",
      "success",
    );
  });

  it("renders fallback states for loading and missing balances", () => {
    const loading = getBalanceHealthMeta({ loading: true });
    const unknown = getBalanceHealthMeta({ balance: null });

    expect(loading.health).toBe("loading");
    expect(loading.label).toBe("Checking");
    expect(unknown.health).toBe("unknown");
    expect(unknown.label).toBe("Unknown");
  });
});
