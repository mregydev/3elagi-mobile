import { useEffect } from "react";
import { Platform } from "react-native";
import { useI18nStore } from "@/domains/i18n/store";

/** Keeps web document lang/dir aligned with the persisted locale. */
export function LocaleBootstrap() {
  const locale = useI18nStore((s) => s.locale);
  const hydrated = useI18nStore((s) => s.hydrated);

  useEffect(() => {
    if (Platform.OS !== "web" || !hydrated || typeof document === "undefined") {
      return;
    }
    const root = document.documentElement;
    root.lang = locale;
    // RTL is hand-rolled (flexDirection / textAlign per component), so the
    // document must stay ltr — dir="rtl" would reverse those rows a second
    // time. Arabic-only styling keys off [lang="ar"] (see GLOBAL_WEB_CSS).
    root.dir = "ltr";
  }, [locale, hydrated]);

  return null;
}
