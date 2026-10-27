import ar from "../../messages/ar.json"
import az from "../../messages/az.json"
import da from "../../messages/da.json"
import de from "../../messages/de.json"
import en from "../../messages/en.json"
import es from "../../messages/es.json"
import fi from "../../messages/fi.json"
import fr from "../../messages/fr.json"
import he from "../../messages/he.json"
import id from "../../messages/id.json"
import it from "../../messages/it.json"
import ja from "../../messages/ja.json"
import nl from "../../messages/nl.json"
import ptBR from "../../messages/pt-BR.json"
import ptPT from "../../messages/pt-PT.json"
import ro from "../../messages/ro.json"
import sv from "../../messages/sv.json"
import tr from "../../messages/tr.json"
import vi from "../../messages/vi.json"
import zhCN from "../../messages/zh-CN.json"
import zhTW from "../../messages/zh-TW.json"
import type { Locale } from "./config"

const callPhoneLabels: Record<string, string> = {
  ar: "اتصل برقم هاتف",
  en: "Call phone number",
  fr: "Appeler un numéro",
  de: "Telefonnummer anrufen",
  es: "Llamar a un número",
  it: "Chiama un numero",
  "pt-BR": "Ligar para um número",
  "pt-PT": "Ligar para um número",
}

// Keep locale JSON payloads unchanged: import small community feature labels
// at the registry boundary for every enabled locale. Missing native translations
// use English until translators supply localized copy.
const withCommunityLabels = <
  T extends { flows: { actions: object }; condition: { languages: object } },
>(
  messages: T,
  locale: Locale,
) => ({
  ...messages,
  flows: {
    ...messages.flows,
    actions: {
      ...messages.flows.actions,
      callPhoneNumber: callPhoneLabels[locale] ?? callPhoneLabels.en,
    },
  },
  condition: {
    ...messages.condition,
    languages: {
      ...messages.condition.languages,
      uz: locale === "ar" ? "الأوزبكية" : "Uzbek",
    },
  },
})

export const messagesByLocale: Record<Locale, Record<string, unknown>> = {
  ar: withCommunityLabels(ar, "ar"),
  az: withCommunityLabels(az, "az"),
  da: withCommunityLabels(da, "da"),
  de: withCommunityLabels(de, "de"),
  en: withCommunityLabels(en, "en"),
  es: withCommunityLabels(es, "es"),
  fi: withCommunityLabels(fi, "fi"),
  fr: withCommunityLabels(fr, "fr"),
  he: withCommunityLabels(he, "he"),
  id: withCommunityLabels(id, "id"),
  it: withCommunityLabels(it, "it"),
  ja: withCommunityLabels(ja, "ja"),
  nl: withCommunityLabels(nl, "nl"),
  "pt-BR": withCommunityLabels(ptBR, "pt-BR"),
  "pt-PT": withCommunityLabels(ptPT, "pt-PT"),
  ro: withCommunityLabels(ro, "ro"),
  sv: withCommunityLabels(sv, "sv"),
  tr: withCommunityLabels(tr, "tr"),
  vi: withCommunityLabels(vi, "vi"),
  "zh-CN": withCommunityLabels(zhCN, "zh-CN"),
  "zh-TW": withCommunityLabels(zhTW, "zh-TW"),
}
