import { clientEnv } from "@/lib/client-env"
import { defaultLocale, isLocale, type Locale, locales } from "./config"

/**
 * UI locales offered in the language selector. `NEXT_PUBLIC_UI_LOCALES` is a
 * comma-separated allow-list (e.g. "en"); unset or with no valid entries,
 * every shipped locale is offered. The default locale is always kept so a
 * stale cookie can still fall back to it.
 */
export function enabledUiLocales(
  raw: string | undefined = clientEnv("NEXT_PUBLIC_UI_LOCALES"),
): readonly Locale[] {
  const requested = (raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(isLocale)
  if (requested.length === 0) {
    return locales
  }
  return locales.filter(
    (locale) => locale === defaultLocale || requested.includes(locale),
  )
}

export function toEnabledUiLocale(
  locale: Locale,
  enabled: readonly Locale[] = enabledUiLocales(),
): Locale {
  return enabled.includes(locale) ? locale : defaultLocale
}
