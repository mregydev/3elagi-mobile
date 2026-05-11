import { create } from "zustand";
import { ar, en, type Translations } from "@/constants/translations";

export type Locale = "en" | "ar";

interface I18nState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  locale: "en",
  setLocale: (locale) => set({ locale }),
}));

export function getDict(locale: Locale): Translations {
  return locale === "ar" ? ar : en;
}
