import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_FEATURE_FLAGS, FeatureFlagsProvider, useFeatureFlags } from "./feature-flags.js";

function Probe() {
  const { flags, getFlag, setFlag, resetFlags } = useFeatureFlags();
  return (
    <div>
      <span data-testid="command-palette">{String(getFlag("commandPalette"))}</span>
      <span data-testid="flags-json">{JSON.stringify(flags)}</span>
      <button onClick={() => setFlag("commandPalette", false)}>disable</button>
      <button onClick={() => resetFlags()}>reset</button>
    </div>
  );
}

describe("FeatureFlagsProvider", () => {
  it("defaults to DEFAULT_FEATURE_FLAGS", () => {
    render(
      <FeatureFlagsProvider>
        <Probe />
      </FeatureFlagsProvider>,
    );
    expect(screen.getByTestId("flags-json")).toHaveTextContent(JSON.stringify(DEFAULT_FEATURE_FLAGS));
  });

  it("applies explicit overrides at mount", () => {
    render(
      <FeatureFlagsProvider overrides={{ commandPalette: false }}>
        <Probe />
      </FeatureFlagsProvider>,
    );
    expect(screen.getByTestId("command-palette")).toHaveTextContent("false");
  });

  it("setFlag updates a single flag", async () => {
    render(
      <FeatureFlagsProvider>
        <Probe />
      </FeatureFlagsProvider>,
    );
    expect(screen.getByTestId("command-palette")).toHaveTextContent("true");

    await act(async () => {
      screen.getByText("disable").click();
    });
    expect(screen.getByTestId("command-palette")).toHaveTextContent("false");
  });

  it("resetFlags restores defaults after a change", async () => {
    render(
      <FeatureFlagsProvider>
        <Probe />
      </FeatureFlagsProvider>,
    );

    await act(async () => {
      screen.getByText("disable").click();
    });
    expect(screen.getByTestId("command-palette")).toHaveTextContent("false");

    await act(async () => {
      screen.getByText("reset").click();
    });
    expect(screen.getByTestId("command-palette")).toHaveTextContent("true");
  });
});

describe("useFeatureFlags outside a provider", () => {
  it("falls back to the default context value (all getFlag calls false)", () => {
    function BareProbe() {
      const { getFlag } = useFeatureFlags();
      return <span data-testid="value">{String(getFlag("commandPalette"))}</span>;
    }
    render(<BareProbe />);
    expect(screen.getByTestId("value")).toHaveTextContent("false");
  });
});
