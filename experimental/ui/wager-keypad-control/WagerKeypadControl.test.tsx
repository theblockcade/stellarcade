import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { WagerKeypadControl, clampWagerValue, appendDigit, backspace } from "./WagerKeypadControl";

afterEach(() => {
  cleanup();
});

function renderKeypad(overrides: Partial<React.ComponentProps<typeof WagerKeypadControl>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <WagerKeypadControl value="0" maxBalance={1000} minBet={1} onChange={onChange} {...overrides} />,
  );
  return { ...utils, onChange };
}

describe("appendDigit", () => {
  it("appends a digit to the current value", () => {
    expect(appendDigit("1", "2")).toBe("12");
  });

  it("replaces a leading zero with the first digit typed", () => {
    expect(appendDigit("0", "5")).toBe("5");
  });

  it("allows a decimal point after a leading zero (e.g. '0.')", () => {
    expect(appendDigit("0", ".")).toBe("0.");
  });

  it("ignores a second decimal point", () => {
    expect(appendDigit("1.5", ".")).toBe("1.5");
  });
});

describe("backspace", () => {
  it("removes the last character", () => {
    expect(backspace("123")).toBe("12");
  });

  it("resets to '0' when backspacing the last character", () => {
    expect(backspace("1")).toBe("0");
  });
});

describe("clampWagerValue", () => {
  it("returns the value unchanged when within bounds", () => {
    expect(clampWagerValue(50, 1, 1000)).toBe("50");
  });

  it("clamps to maxBalance when the value exceeds it", () => {
    expect(clampWagerValue(5000, 1, 1000)).toBe("1000");
  });

  it("clamps to minBet when the value is below it", () => {
    expect(clampWagerValue(0.1, 1, 1000)).toBe("1");
  });

  it("trims trailing zeros from the formatted result", () => {
    expect(clampWagerValue(25, 1, 1000)).toBe("25");
  });
});

describe("WagerKeypadControl — numeric input", () => {
  it("calls onChange with the digit appended when a number key is pressed", () => {
    const { onChange } = renderKeypad({ value: "1" });
    fireEvent.click(screen.getByTestId("wager-key-2"));
    expect(onChange).toHaveBeenCalledWith("12");
  });

  it("calls onChange with the decimal point appended", () => {
    const { onChange } = renderKeypad({ value: "5" });
    fireEvent.click(screen.getByTestId("wager-key-decimal"));
    expect(onChange).toHaveBeenCalledWith("5.");
  });

  it("calls onChange with the backspaced value", () => {
    const { onChange } = renderKeypad({ value: "50" });
    fireEvent.click(screen.getByTestId("wager-key-backspace"));
    expect(onChange).toHaveBeenCalledWith("5");
  });

  it("displays the current value", () => {
    renderKeypad({ value: "42.5" });
    expect(screen.getByTestId("wager-value-display").textContent).toBe("42.5");
  });
});

describe("WagerKeypadControl — quick multipliers", () => {
  it("2x doubles the current wager, clamped to maxBalance", () => {
    const { onChange } = renderKeypad({ value: "600", maxBalance: 1000 });
    fireEvent.click(screen.getByTestId("wager-quick-double"));
    expect(onChange).toHaveBeenCalledWith("1000");
  });

  it("½x halves the current wager", () => {
    const { onChange } = renderKeypad({ value: "100" });
    fireEvent.click(screen.getByTestId("wager-quick-half"));
    expect(onChange).toHaveBeenCalledWith("50");
  });

  it("MAX sets the value to maxBalance", () => {
    const { onChange } = renderKeypad({ value: "10", maxBalance: 1000 });
    fireEvent.click(screen.getByTestId("wager-quick-max"));
    expect(onChange).toHaveBeenCalledWith("1000");
  });

  it("MIN sets the value to minBet", () => {
    const { onChange } = renderKeypad({ value: "500", minBet: 5 });
    fireEvent.click(screen.getByTestId("wager-quick-min"));
    expect(onChange).toHaveBeenCalledWith("5");
  });

  it("½x never goes below minBet", () => {
    const { onChange } = renderKeypad({ value: "1", minBet: 1 });
    fireEvent.click(screen.getByTestId("wager-quick-half"));
    expect(onChange).toHaveBeenCalledWith("1");
  });
});

describe("WagerKeypadControl — balance validation", () => {
  it("highlights the display in red when value exceeds maxBalance", () => {
    renderKeypad({ value: "5000", maxBalance: 1000 });
    expect(screen.getByTestId("wager-value-display").getAttribute("data-invalid")).toBe("true");
  });

  it("does not flag the display invalid when within balance", () => {
    renderKeypad({ value: "500", maxBalance: 1000 });
    expect(screen.getByTestId("wager-value-display").getAttribute("data-invalid")).toBe("false");
  });
});

describe("WagerKeypadControl — submit", () => {
  it("disables the submit button when value exceeds maxBalance", () => {
    render(
      <WagerKeypadControl value="5000" maxBalance={1000} minBet={1} onChange={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect((screen.getByTestId("wager-submit-button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("disables the submit button when value is 0", () => {
    render(<WagerKeypadControl value="0" maxBalance={1000} minBet={1} onChange={vi.fn()} onSubmit={vi.fn()} />);
    expect((screen.getByTestId("wager-submit-button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("enables the submit button for a valid wager and calls onSubmit when clicked", () => {
    const onSubmit = vi.fn();
    render(<WagerKeypadControl value="50" maxBalance={1000} minBet={1} onChange={vi.fn()} onSubmit={onSubmit} />);
    const button = screen.getByTestId("wager-submit-button");
    expect((button as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not render a submit button when onSubmit is not provided", () => {
    renderKeypad({ value: "50" });
    expect(screen.queryByTestId("wager-submit-button")).toBeNull();
  });
});
