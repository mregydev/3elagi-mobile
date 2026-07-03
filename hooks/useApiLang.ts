import { useI18nStore } from "@/domains/i18n/store";

/** API language code from the persisted user locale (not layout direction). */
export function useApiLang(): "ar" | "en" {
  return useI18nStore((s) => s.locale);
}
