import type { Locale } from "@/domains/i18n/store";

/** BCP-47 tags tuned for Chrome / Safari Web Speech API. */
export const WEB_SPEECH_LANG: Record<Locale, string> = {
  ar: "ar-SA",
  en: "en-US",
};

export function resolveWebSpeechLang(locale: Locale): string {
  return WEB_SPEECH_LANG[locale];
}

/** Pick ar or en when the browser reports a preferred language list. */
export function pickSpeechLocaleFromBrowser(): Locale {
  if (typeof navigator === "undefined") return "en";
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of langs) {
    const lower = tag.toLowerCase();
    if (lower.startsWith("ar")) return "ar";
    if (lower.startsWith("en")) return "en";
  }
  return "en";
}

export function speechLocaleLabel(locale: Locale, uiLocale: Locale): string {
  if (locale === "ar") {
    return uiLocale === "ar" ? "العربية" : "Arabic";
  }
  return uiLocale === "ar" ? "الإنجليزية" : "English";
}
