import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveTheme(
  mode: ThemeMode,
  systemScheme: "light" | "dark" | null | undefined,
): ResolvedTheme {
  if (mode === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return mode;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      hydrated: false,
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "3elagi-theme",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<ThemeState> | undefined;
        return {
          ...current,
          ...stored,
          mode: isThemeMode(stored?.mode) ? stored.mode : "system",
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!isThemeMode(state.mode)) state.mode = "system";
          state.hydrated = true;
        }
      },
    },
  ),
);
