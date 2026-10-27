import { describe, expect, test } from "vitest"
import { locales } from "@/i18n/config"
import { enabledUiLocales, toEnabledUiLocale } from "@/i18n/enabled-locales"

describe("enabledUiLocales", () => {
  test("offers every shipped locale when unset or empty", () => {
    expect(enabledUiLocales(undefined)).toEqual(locales)
    expect(enabledUiLocales("")).toEqual(locales)
    expect(enabledUiLocales("xx, ,yy")).toEqual(locales)
  })

  test("restricts to the allow-list", () => {
    expect(enabledUiLocales("en")).toEqual(["en"])
    expect(enabledUiLocales(" vi , ja ")).toEqual(["en", "ja", "vi"])
  })
})

describe("toEnabledUiLocale", () => {
  test("keeps an enabled locale and falls back to the default otherwise", () => {
    expect(toEnabledUiLocale("en", ["en"])).toBe("en")
    expect(toEnabledUiLocale("zh-TW", ["en"])).toBe("en")
    expect(toEnabledUiLocale("zh-TW", locales)).toBe("zh-TW")
  })
})
