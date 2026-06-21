import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ar, en, type Translations } from "@/constants/translations";

export type Locale = "en" | "ar";

interface I18nState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "3elagi-locale",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
);

export function getDict(locale: Locale): Translations {
  return locale === "ar" ? ar : en;
}
