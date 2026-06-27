import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authRepository } from "./repository";
import { emit } from "@/utils/eventBus";
import { AUTH_EVENTS } from "./events";
import type { Credentials, DoctorApprovalStatus, PatientProfile, SignupInput } from "./types";
import type { WebViewAuthSession } from "@/constants/nativeWebViewBridge";

interface AuthState {
  profile: PatientProfile | null;
  accessToken: string | null;
  role: string | null;
  doctorId: string | null;
  specialty: string | null;
  specialityId: string | null;
  doctorApprovalStatus: DoctorApprovalStatus | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  login: (c: Credentials) => Promise<void>;
  signup: (s: SignupInput) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setProfile: (profile: PatientProfile) => void;
  setDoctorApprovalStatus: (status: DoctorApprovalStatus | null) => void;
  applyWebViewSession: (session: WebViewAuthSession) => void;
  clearWebViewSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      accessToken: null,
      role: null,
      doctorId: null,
      specialty: null,
      specialityId: null,
      doctorApprovalStatus: null,
      loading: false,
      error: null,
      hydrated: false,
      login: async (creds) => {
        set({ loading: true, error: null });
        try {
          const session = await authRepository.login(creds);
          const role = session.role.toLowerCase();
          if (role === "admin" && Platform.OS !== "web") {
            set({ loading: false });
            throw new Error("__UNSUPPORTED_ROLE__");
          }
          if (role !== "patient" && role !== "doctor" && role !== "admin") {
            set({ loading: false });
            throw new Error("__UNSUPPORTED_ROLE__");
          }
          set({
            profile: session.profile,
            accessToken: session.accessToken,
            role: session.role,
            doctorId: session.doctorId ?? null,
            specialty: session.specialty ?? null,
            specialityId: session.specialityId ?? null,
            doctorApprovalStatus: session.doctorApprovalStatus ?? null,
            loading: false,
          });
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
          throw e;
        }
      },
      signup: async (input) => {
        set({ loading: true, error: null });
        try {
          const session = await authRepository.signup(input);
          set({
            profile: session.profile,
            accessToken: session.accessToken,
            role: session.role,
            doctorId: session.doctorId ?? null,
            specialty: session.specialty ?? null,
            specialityId: session.specialityId ?? null,
            doctorApprovalStatus: session.doctorApprovalStatus ?? null,
            loading: false,
          });
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
          throw e;
        }
      },
      logout: () => {
        const userId = useAuthStore.getState().profile?.id;
        set({
          profile: null,
          accessToken: null,
          role: null,
          doctorId: null,
          specialty: null,
          specialityId: null,
          doctorApprovalStatus: null,
          error: null,
        });
        emit(AUTH_EVENTS.LOGOUT, { userId });
      },
      clearError: () => set({ error: null }),
      setProfile: (profile) => set({ profile }),
      setDoctorApprovalStatus: (status) => set({ doctorApprovalStatus: status }),
      applyWebViewSession: (session) => {
        set({
          profile: session.profile,
          accessToken: session.accessToken,
          role: session.role,
          doctorId: session.doctorId,
          specialty: session.specialty,
          specialityId: session.specialityId,
          doctorApprovalStatus: session.doctorApprovalStatus,
          hydrated: true,
          error: null,
        });
      },
      clearWebViewSession: () => {
        const userId = useAuthStore.getState().profile?.id;
        set({
          profile: null,
          accessToken: null,
          role: null,
          doctorId: null,
          specialty: null,
          specialityId: null,
          doctorApprovalStatus: null,
          error: null,
        });
        emit(AUTH_EVENTS.LOGOUT, { userId });
      },
    }),
    {
      name: "3elagi-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        profile: s.profile,
        accessToken: s.accessToken,
        role: s.role,
        doctorId: s.doctorId,
        specialty: s.specialty,
        specialityId: s.specialityId,
        doctorApprovalStatus: s.doctorApprovalStatus,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
