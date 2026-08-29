import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  AmbientSoundMixer,
  loadPersistedConfig,
  persistConfig,
  applyPreset,
} from "./AmbientSoundMixer";
import { AMBIENT_MIXER_STORAGE_KEY, AudioMixerConfig, DEFAULT_AUDIO_MIXER_CONFIG } from "./types";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

beforeEach(() => {
  window.localStorage.clear();
});

function renderMixer(overrides: Partial<React.ComponentProps<typeof AmbientSoundMixer>> = {}) {
  const onConfigChange = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <AmbientSoundMixer isOpen={true} onConfigChange={onConfigChange} onClose={onClose} {...overrides} />,
  );
  return { ...utils, onConfigChange, onClose };
}

describe("loadPersistedConfig / persistConfig", () => {
  it("returns the fallback when nothing is stored", () => {
    const config = loadPersistedConfig(DEFAULT_AUDIO_MIXER_CONFIG);
    expect(config).toEqual(DEFAULT_AUDIO_MIXER_CONFIG);
  });

  it("round-trips a persisted config", () => {
    const custom: AudioMixerConfig = { ...DEFAULT_AUDIO_MIXER_CONFIG, master: 33, isMuted: true };
    persistConfig(custom);
    const loaded = loadPersistedConfig(DEFAULT_AUDIO_MIXER_CONFIG);
    expect(loaded).toEqual(custom);
  });

  it("falls back gracefully on corrupted stored JSON", () => {
    window.localStorage.setItem(AMBIENT_MIXER_STORAGE_KEY, "{not-json");
    const loaded = loadPersistedConfig(DEFAULT_AUDIO_MIXER_CONFIG);
    expect(loaded).toEqual(DEFAULT_AUDIO_MIXER_CONFIG);
  });

  it("does not throw when localStorage.setItem throws (e.g. quota exceeded)", () => {
    const spy = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => persistConfig(DEFAULT_AUDIO_MIXER_CONFIG)).not.toThrow();
    spy.mockRestore();
  });
});

describe("applyPreset", () => {
  it("changes channel levels while preserving master and mute state", () => {
    const config: AudioMixerConfig = { ...DEFAULT_AUDIO_MIXER_CONFIG, master: 42, isMuted: true };
    const result = applyPreset(config, "silent");
    expect(result.master).toBe(42);
    expect(result.isMuted).toBe(true);
    expect(result.music).toBe(0);
    expect(result.sfx).toBe(0);
    expect(result.ambient).toBe(0);
    expect(result.preset).toBe("silent");
  });
});

describe("AmbientSoundMixer", () => {
  it("does not render when isOpen is false", () => {
    renderMixer({ isOpen: false });
    expect(screen.queryByTestId("ambient-sound-mixer")).toBeNull();
  });

  it("moving the music slider updates its value smoothly from 0 to 100", () => {
    renderMixer();
    const slider = screen.getByTestId("ambient-mixer-music") as HTMLInputElement;

    fireEvent.change(slider, { target: { value: "0" } });
    expect(screen.getByTestId("ambient-mixer-music-value").textContent).toBe("0%");

    fireEvent.change(slider, { target: { value: "100" } });
    expect(screen.getByTestId("ambient-mixer-music-value").textContent).toBe("100%");
  });

  it("updates each channel independently", () => {
    renderMixer();
    fireEvent.change(screen.getByTestId("ambient-mixer-sfx"), { target: { value: "35" } });
    fireEvent.change(screen.getByTestId("ambient-mixer-ambient"), { target: { value: "90" } });

    expect(screen.getByTestId("ambient-mixer-sfx-value").textContent).toBe("35%");
    expect(screen.getByTestId("ambient-mixer-ambient-value").textContent).toBe("90%");
  });

  it("toggling mute disables sliders without losing previously set values", () => {
    renderMixer({
      initialConfig: { ...DEFAULT_AUDIO_MIXER_CONFIG, music: 77, sfx: 44, ambient: 23 },
    });

    fireEvent.click(screen.getByTestId("ambient-mixer-mute-toggle"));

    const musicSlider = screen.getByTestId("ambient-mixer-music") as HTMLInputElement;
    expect(musicSlider.disabled).toBe(true);
    // The underlying value is preserved even while muted/disabled.
    expect(musicSlider.value).toBe("77");
    expect(screen.getByTestId("ambient-mixer-sfx-value").textContent).toBe("44%");
    expect(screen.getByTestId("ambient-mixer-ambient-value").textContent).toBe("23%");

    // Unmuting restores interactivity with the same values intact.
    fireEvent.click(screen.getByTestId("ambient-mixer-mute-toggle"));
    expect((screen.getByTestId("ambient-mixer-music") as HTMLInputElement).disabled).toBe(false);
    expect(screen.getByTestId("ambient-mixer-music-value").textContent).toBe("77%");
  });

  it("selecting a preset switches the pill active state and updates levels", () => {
    renderMixer();

    fireEvent.click(screen.getByTestId("ambient-mixer-preset-synthwave"));

    expect(screen.getByTestId("ambient-mixer-preset-synthwave").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByTestId("ambient-mixer-preset-arcade-80s").getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("persists changes to localStorage across a remount (page refresh simulation)", () => {
    const { unmount } = renderMixer();

    fireEvent.change(screen.getByTestId("ambient-mixer-master"), { target: { value: "15" } });
    unmount();

    // Simulate a fresh page load: a new mount reads from localStorage.
    renderMixer();
    expect(screen.getByTestId("ambient-mixer-master-value").textContent).toBe("15%");
  });

  it("calls onConfigChange whenever the config changes", () => {
    const { onConfigChange } = renderMixer();
    onConfigChange.mockClear();

    fireEvent.change(screen.getByTestId("ambient-mixer-sfx"), { target: { value: "50" } });

    expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ sfx: 50 }));
  });

  it("calls onClose when the close button is clicked", () => {
    const { onClose } = renderMixer();
    fireEvent.click(screen.getByTestId("ambient-mixer-close"));
    expect(onClose).toHaveBeenCalled();
  });
});
