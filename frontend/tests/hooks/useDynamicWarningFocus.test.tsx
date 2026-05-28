/**
 * @vitest-environment happy-dom
 */

import { render, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { useDynamicWarningFocus } from "@/hooks/v1/useDynamicWarningFocus";

interface WarningProps {
  active: boolean;
  onFocusMoved?: (target: HTMLElement) => void;
}

function Warning({ active, onFocusMoved }: WarningProps) {
  const ref = useDynamicWarningFocus<HTMLDivElement>(active, { onFocusMoved });
  return (
    <div ref={ref} data-testid="warning" role="alert">
      <span>A warning</span>
    </div>
  );
}

function TriggerableWarning({
  initiallyActive,
}: {
  initiallyActive: boolean;
}) {
  const [active, setActive] = React.useState(initiallyActive);
  return (
    <div>
      <button
        data-testid="trigger"
        onClick={() => setActive(prev => !prev)}
      >
        Trigger
      </button>
      {active && <Warning active />}
    </div>
  );
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useDynamicWarningFocus (#787)", () => {
  it("moves focus to the warning container when active", () => {
    const onFocusMoved = vi.fn();
    const { getByTestId } = render(
      <Warning active onFocusMoved={onFocusMoved} />
    );
    const warning = getByTestId("warning");
    expect(document.activeElement).toBe(warning);
    expect(warning.getAttribute("tabindex")).toBe("-1");
    expect(onFocusMoved).toHaveBeenCalledWith(warning);
  });

  it("does not move focus when active=false", () => {
    const button = document.createElement("button");
    button.textContent = "outside";
    document.body.appendChild(button);
    button.focus();
    expect(document.activeElement).toBe(button);

    render(<Warning active={false} />);
    // Focus should not have moved to the warning container.
    expect(document.activeElement).toBe(button);
  });

  it("restores focus to the previously focused element on unmount", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "trigger";
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount, getByTestId } = render(<Warning active />);
    // Focus was on `trigger`, hook moved it to the warning.
    expect(document.activeElement).toBe(getByTestId("warning"));
    unmount();
    expect(document.activeElement).toBe(trigger);
  });

  it("does not strip a pre-existing tabindex on the container", () => {
    function PreSetTabIndex() {
      const ref = useDynamicWarningFocus<HTMLDivElement>(true);
      return (
        <div ref={ref} tabIndex={0} data-testid="warning">
          warning
        </div>
      );
    }
    const { unmount, getByTestId } = render(<PreSetTabIndex />);
    const node = getByTestId("warning");
    expect(node.getAttribute("tabindex")).toBe("0");
    unmount();
  });

  it("survives a re-mount of the same warning component", () => {
    const { getByTestId } = render(
      <TriggerableWarning initiallyActive={false} />
    );
    const triggerBtn = getByTestId("trigger");
    triggerBtn.focus();
    act(() => {
      triggerBtn.click();
    });
    const warning = getByTestId("warning");
    expect(document.activeElement).toBe(warning);
    act(() => {
      triggerBtn.click();
    });
    // Warning unmounted — focus should return to the trigger.
    expect(document.activeElement).toBe(triggerBtn);
  });
});
