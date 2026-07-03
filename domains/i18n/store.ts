import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ar, en, type Translations } from "@/constants/translations";
import { patchUserLocale } from "./serverSync";

export type Locale = "en" | "ar";

interface I18nState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (l: Locale) => void;
  syncLocaleToServer: () => void;
}

function syncLocaleIfSignedIn(locale: Locale) {
  void import("@/domains/auth/store").then(({ useAuthStore }) => {
    const token = useAuthStore.getState().accessToken;
    if (token) void patchUserLocale(token, locale);
  });
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: "en",
      hydrated: false,
      setLocale: (locale) => {
        set({ locale });
        syncLocaleIfSignedIn(locale);
      },
      syncLocaleToServer: () => {
        syncLocaleIfSignedIn(get().locale);
      },
    }),
    {
      name: "3elagi-locale",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

export function getDict(locale: Locale): Translations {
  return locale === "ar" ? ar : en;
}

export function getApiLang(): Locale {
  return useI18nStore.getState().locale;
}

export function applyLocaleAfterAuth(
  preferredLocale: Locale | null | undefined,
): void {
  if (preferredLocale === "ar" || preferredLocale === "en") {
    useI18nStore.setState({ locale: preferredLocale });
    return;
  }
  useI18nStore.getState().syncLocaleToServer();
}
