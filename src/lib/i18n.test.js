import { describe, expect, test } from "vitest";
import { createTranslator, dictionaries, languageCodes, normalizeLanguage, t, translate } from "./i18n.js";

function leafKeys(value, prefix = "") {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" ? leafKeys(child, path) : [path];
  });
}

describe("i18n", () => {
  test("keeps English and Russian dictionaries in sync", () => {
    expect(leafKeys(dictionaries.ru).sort()).toEqual(leafKeys(dictionaries.en).sort());
  });

  test("normalizes language tags and safely falls back", () => {
    expect(normalizeLanguage("ru-RU")).toBe("ru");
    expect(normalizeLanguage("unknown")).toBe("en");
    expect(languageCodes).toEqual(["en", "ru"]);
    expect(translate("ru", "missing.key")).toBe("missing.key");
    expect(translate("ru", "__proto__.polluted")).toBe("__proto__.polluted");
  });

  test("interpolates variables without losing unknown placeholders", () => {
    expect(createTranslator("ru")("tour.progress", { current: 2, total: 4 })).toBe("Шаг 2 из 4");
    expect(translate("en", "app.loadedFile", { name: "index.html" })).toBe("Loaded index.html");
    expect(t("app.loadedPackage", { count: 3 })).toBe("Loaded site package: 3 assets");
  });
});

