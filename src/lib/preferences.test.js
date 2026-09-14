import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
  loadPreferences,
  resetPreferences,
  sanitizePreferences,
  savePreferences,
  updatePreferences,
} from "./preferences.js";

describe("preferences", () => {
  beforeEach(() => localStorage.clear());

  it("returns independent safe defaults when storage is empty or corrupt", () => {
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
    localStorage.setItem(PREFERENCES_KEY, "not-json");
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("validates stored values and drops unknown data", () => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({
      version: 1,
      language: "de",
      panels: { sidebarOpen: false, inspectorOpen: "no" },
      viewport: { preset: "watch", customWidth: 9000, portrait: false },
      onboardingVersion: -3,
      secret: "discard me",
    }));

    expect(loadPreferences()).toEqual({
      version: 1,
      language: "en",
      panels: { sidebarOpen: false, inspectorOpen: true },
      viewport: { preset: "desktop", customWidth: 1024, portrait: false },
      onboardingVersion: 0,
    });
  });

  it("migrates an unversioned legacy shape", () => {
    expect(sanitizePreferences({
      locale: "ru",
      isSidebarOpen: false,
      isInspectorOpen: true,
      viewportPreset: "mobile",
      customViewportWidth: 375,
      isPortrait: false,
      tourVersion: 2,
    })).toEqual({
      version: 1,
      language: "ru",
      panels: { sidebarOpen: false, inspectorOpen: true },
      viewport: { preset: "mobile", customWidth: 375, portrait: false },
      onboardingVersion: 2,
    });
  });

  it("saves, partially updates, and resets preferences", () => {
    savePreferences({ ...DEFAULT_PREFERENCES, language: "ru" });
    const updated = updatePreferences({ panels: { inspectorOpen: false }, onboardingVersion: 3 });
    expect(updated.language).toBe("ru");
    expect(updated.panels).toEqual({ sidebarOpen: true, inspectorOpen: false });
    expect(loadPreferences()).toEqual(updated);
    expect(resetPreferences()).toEqual(DEFAULT_PREFERENCES);
    expect(localStorage.getItem(PREFERENCES_KEY)).toBeNull();
  });

  it("continues with validated values when storage throws", () => {
    const blocked = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
      removeItem() { throw new Error("blocked"); },
    };
    expect(loadPreferences(blocked)).toEqual(DEFAULT_PREFERENCES);
    expect(savePreferences({ language: "ru" }, blocked).language).toBe("ru");
    expect(resetPreferences(blocked)).toEqual(DEFAULT_PREFERENCES);
  });
});

