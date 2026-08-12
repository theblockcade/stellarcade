import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n/provider";
import { LocaleSwitcher } from "./LocaleSwitcher";

// LocaleSwitcher was rewritten from a native <select> to a custom
// button+listbox dropdown — options only exist in the DOM once opened, and
// the current locale is a label on the trigger button, not a <select>
// value. The old "reset to default" button was removed entirely (no
// replacement found anywhere else in the app) rather than relocated.

function renderSwitcher() {
  return render(
    <I18nProvider>
      <LocaleSwitcher />
    </I18nProvider>,
  );
}

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    // I18nProvider persists the selected locale to localStorage, which
    // otherwise leaks a selection from one test into the next test's
    // "fresh" render within the same file.
    localStorage.clear();
  });

  it("defaults to English on the trigger button", () => {
    renderSwitcher();
    expect(screen.getByRole("button", { name: /English/i })).toBeInTheDocument();
  });

  it("renders all five locale options once opened", async () => {
    const user = userEvent.setup();
    renderSwitcher();
    await user.click(screen.getByRole("button", { name: /English/i }));

    expect(screen.getByRole("option", { name: /English/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Español/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Français/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Deutsch/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /日本語/i })).toBeInTheDocument();
  });

  it("switches locale when an option is selected", async () => {
    const user = userEvent.setup();
    renderSwitcher();
    await user.click(screen.getByRole("button", { name: /English/i }));
    await user.click(screen.getByRole("option", { name: /Français/i }));

    expect(screen.getByRole("button", { name: /Français/i })).toBeInTheDocument();
  });

  it("closes the dropdown after a selection", async () => {
    const user = userEvent.setup();
    renderSwitcher();
    await user.click(screen.getByRole("button", { name: /English/i }));
    await user.click(screen.getByRole("option", { name: /Deutsch/i }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
