import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authRepository } from "./repository";
import type { Credentials, PatientProfile, SignupInput } from "./types";

interface AuthState {
  profile: PatientProfile | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  login: (c: Credentials) => Promise<void>;
  signup: (s: SignupInput) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      loading: false,
      error: null,
      hydrated: false,
      login: async (creds) => {
        set({ loading: true, error: null });
        try {
          const profile = await authRepository.login(creds);
          set({ profile, loading: false });
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
          throw e;
        }
      },
      signup: async (input) => {
        set({ loading: true, error: null });
        try {
          const profile = await authRepository.signup(input);
          set({ profile, loading: false });
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
          throw e;
        }
      },
      logout: () => set({ profile: null, error: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "3elagi-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ profile: s.profile }),
      onRehydrateStorage: () => (state) => {
        state?.hydrated && state;
        if (state) state.hydrated = true;
      },
    },
  ),
);
