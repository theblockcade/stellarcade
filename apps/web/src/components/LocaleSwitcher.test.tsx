import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n/provider";
import { LocaleSwitcher } from "./LocaleSwitcher";

describe("LocaleSwitcher", () => {
  it("renders all five locale options", () => {
    render(
      <I18nProvider>
        <LocaleSwitcher />
      </I18nProvider>,
    );
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Español" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Français" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Deutsch" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "日本語" })).toBeInTheDocument();
  });

  it("defaults the select to English", () => {
    render(
      <I18nProvider>
        <LocaleSwitcher />
      </I18nProvider>,
    );
    expect(screen.getByRole("combobox")).toHaveValue("en");
  });

  it("switches locale via the select", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <LocaleSwitcher />
      </I18nProvider>,
    );

    await user.selectOptions(screen.getByRole("combobox"), "fr");
    expect(screen.getByRole("combobox")).toHaveValue("fr");
  });

  it("has a reset button", () => {
    render(
      <I18nProvider>
        <LocaleSwitcher />
      </I18nProvider>,
    );
    expect(screen.getByRole("button", { name: "↺" })).toBeInTheDocument();
  });
});
