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
    root.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale, hydrated]);

  return null;
}
