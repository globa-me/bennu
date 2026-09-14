export const PREFERENCES_KEY = "bennu.preferences.v1";
export const PREFERENCES_VERSION = 1;

export const DEFAULT_PREFERENCES = Object.freeze({
  version: PREFERENCES_VERSION,
  language: "en",
  panels: Object.freeze({
    sidebarOpen: true,
    inspectorOpen: true,
  }),
  viewport: Object.freeze({
    preset: "desktop",
    customWidth: 1024,
    portrait: true,
  }),
  onboardingVersion: 0,
});

const VIEWPORT_PRESETS = new Set(["desktop", "tablet", "mobile", "custom"]);
const MIN_VIEWPORT_WIDTH = 240;
const MAX_VIEWPORT_WIDTH = 3840;

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function booleanOr(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function numberInRange(value, fallback, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max
    ? number
    : fallback;
}

/**
 * Converts legacy/unversioned preference shapes to the current schema. Unknown
 * keys are intentionally discarded so corrupt or stale data cannot leak into UI state.
 */
export function migratePreferences(value) {
  const source = plainObject(value);
  if (source.version === PREFERENCES_VERSION) return source;

  return {
    version: PREFERENCES_VERSION,
    language: source.language ?? source.locale,
    panels: source.panels ?? {
      sidebarOpen: source.isSidebarOpen,
      inspectorOpen: source.isInspectorOpen,
    },
    viewport: source.viewport ?? {
      preset: source.viewportPreset,
      customWidth: source.customViewportWidth,
      portrait: source.isPortrait,
    },
    onboardingVersion: source.onboardingVersion ?? source.tourVersion,
  };
}

export function sanitizePreferences(value) {
  const source = migratePreferences(value);
  const panels = plainObject(source.panels);
  const viewport = plainObject(source.viewport);

  return {
    version: PREFERENCES_VERSION,
    language:
      source.language === "ru" || source.language === "en"
        ? source.language
        : DEFAULT_PREFERENCES.language,
    panels: {
      sidebarOpen: booleanOr(
        panels.sidebarOpen,
        DEFAULT_PREFERENCES.panels.sidebarOpen,
      ),
      inspectorOpen: booleanOr(
        panels.inspectorOpen,
        DEFAULT_PREFERENCES.panels.inspectorOpen,
      ),
    },
    viewport: {
      preset: VIEWPORT_PRESETS.has(viewport.preset)
        ? viewport.preset
        : DEFAULT_PREFERENCES.viewport.preset,
      customWidth: numberInRange(
        viewport.customWidth,
        DEFAULT_PREFERENCES.viewport.customWidth,
        MIN_VIEWPORT_WIDTH,
        MAX_VIEWPORT_WIDTH,
      ),
      portrait: booleanOr(
        viewport.portrait,
        DEFAULT_PREFERENCES.viewport.portrait,
      ),
    },
    onboardingVersion: Math.floor(
      numberInRange(source.onboardingVersion, 0, 0, 10000),
    ),
  };
}

function defaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function loadPreferences(storage = defaultStorage()) {
  if (!storage) return sanitizePreferences(DEFAULT_PREFERENCES);
  try {
    const stored = storage.getItem(PREFERENCES_KEY);
    return stored
      ? sanitizePreferences(JSON.parse(stored))
      : sanitizePreferences(DEFAULT_PREFERENCES);
  } catch {
    return sanitizePreferences(DEFAULT_PREFERENCES);
  }
}

export function savePreferences(preferences, storage = defaultStorage()) {
  const safe = sanitizePreferences(preferences);
  if (!storage) return safe;
  try {
    storage.setItem(PREFERENCES_KEY, JSON.stringify(safe));
  } catch {
    // Private browsing and full storage must not prevent the editor from working.
  }
  return safe;
}

export function updatePreferences(patch, storage = defaultStorage()) {
  const current = loadPreferences(storage);
  const nextPatch = plainObject(patch);
  return savePreferences(
    {
      ...current,
      ...nextPatch,
      panels: { ...current.panels, ...plainObject(nextPatch.panels) },
      viewport: { ...current.viewport, ...plainObject(nextPatch.viewport) },
    },
    storage,
  );
}

export function resetPreferences(storage = defaultStorage()) {
  try {
    storage?.removeItem(PREFERENCES_KEY);
  } catch {
    // A failed reset is non-fatal; return dependable in-memory defaults.
  }
  return sanitizePreferences(DEFAULT_PREFERENCES);
}
