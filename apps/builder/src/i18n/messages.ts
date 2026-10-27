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

// Keep locale JSON payloads unchanged: this single feature label is added at
// the message registry boundary for every enabled locale. Missing translations
// use the English source until native copy is provided by translators.
const withCallPhoneLabel = <T extends { flows: { actions: object } }>(
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
})

export const messagesByLocale: Record<Locale, Record<string, unknown>> = {
  ar: withCallPhoneLabel(ar, "ar"),
  az: withCallPhoneLabel(az, "az"),
  da: withCallPhoneLabel(da, "da"),
  de: withCallPhoneLabel(de, "de"),
  en: withCallPhoneLabel(en, "en"),
  es: withCallPhoneLabel(es, "es"),
  fi: withCallPhoneLabel(fi, "fi"),
  fr: withCallPhoneLabel(fr, "fr"),
  he: withCallPhoneLabel(he, "he"),
  id: withCallPhoneLabel(id, "id"),
  it: withCallPhoneLabel(it, "it"),
  ja: withCallPhoneLabel(ja, "ja"),
  nl: withCallPhoneLabel(nl, "nl"),
  "pt-BR": withCallPhoneLabel(ptBR, "pt-BR"),
  "pt-PT": withCallPhoneLabel(ptPT, "pt-PT"),
  ro: withCallPhoneLabel(ro, "ro"),
  sv: withCallPhoneLabel(sv, "sv"),
  tr: withCallPhoneLabel(tr, "tr"),
  vi: withCallPhoneLabel(vi, "vi"),
  "zh-CN": withCallPhoneLabel(zhCN, "zh-CN"),
  "zh-TW": withCallPhoneLabel(zhTW, "zh-TW"),
}
