import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { I18nProvider, useI18n, resolveIntlLocale, isSupportedLocale } from "./provider";

function Probe() {
  const { locale, t, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="title">{t("app.title")}</span>
      <button onClick={() => setLocale("es")}>switch</button>
    </div>
  );
}

describe("I18nProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("defaults to English and resolves a known key", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("title")).toHaveTextContent("StellarCade");
  });

  it("switches locale and persists the choice", async () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await act(async () => {
      screen.getByText("switch").click();
    });

    expect(screen.getByTestId("locale")).toHaveTextContent("es");
    expect(localStorage.getItem("stellarcade_locale")).toBe("es");
  });
});

describe("isSupportedLocale", () => {
  it("accepts the five supported locales", () => {
    for (const l of ["en", "es", "fr", "de", "ja"]) {
      expect(isSupportedLocale(l)).toBe(true);
    }
  });

  it("rejects unsupported values", () => {
    expect(isSupportedLocale("zz")).toBe(false);
    expect(isSupportedLocale(42)).toBe(false);
  });
});

describe("resolveIntlLocale", () => {
  it("maps a supported locale to its Intl tag", () => {
    expect(resolveIntlLocale("ja")).toBe("ja-JP");
  });

  it("falls back to en-US for null", () => {
    expect(resolveIntlLocale(null)).toBe("en-US");
  });
});
