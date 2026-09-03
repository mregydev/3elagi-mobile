import { usePathname } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import { ProductTourOverlay } from "@/components/onboarding/ProductTourOverlay";
import {
  ensureDoctorOnboarding,
  fetchDoctorMeTourState,
  markDoctorTourComplete,
} from "@/domains/onboarding/doctorTourApi";
import { useProductTourStore } from "@/domains/onboarding/productTourStore";
import { useAuthStore } from "@/domains/auth/store";
import { canUseChat } from "@/domains/chat/access";
import { useChatStore } from "@/domains/chat/store";

function isApproved(
  fromApi: string | null | undefined,
  fromStore: string | null | undefined,
): boolean {
  return fromApi === "approved" || fromStore === "approved";
}

/** Temporary: ignore server tour flags and show the main tour on every page load. */
const ALWAYS_SHOW_DOCTOR_PRODUCT_TOUR = true;

/** Starts doctor onboarding tours once per doctor (tracked on the server). */
export function DoctorTourBootstrap() {
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const doctorApprovalStatus = useAuthStore((s) => s.doctorApprovalStatus);
  const profile = useAuthStore((s) => s.profile);
  const loadConversations = useChatStore((s) => s.loadConversations);

  const startMainTour = useProductTourStore((s) => s.startMainTour);
  const startProfileTour = useProductTourStore((s) => s.startProfileTour);
  const setTestPatientUserId = useProductTourStore((s) => s.setTestPatientUserId);
  const exitReason = useProductTourStore((s) => s.exitReason);
  const completedPhase = useProductTourStore((s) => s.completedPhase);
  const clearExit = useProductTourStore((s) => s.clearExit);
  const setDoctorApprovalStatus = useAuthStore((s) => s.setDoctorApprovalStatus);
  const autoStartedRef = useRef(false);

  const refreshChats = useCallback(async () => {
    if (!accessToken || !profile?.id || role?.toLowerCase() !== "doctor" || !canUseChat(role)) {
      return;
    }
    await loadConversations(accessToken, profile.id, role);
  }, [accessToken, profile?.id, role, loadConversations]);

  const bootstrap = useCallback(async () => {
    if (!hydrated || !role || role.toLowerCase() !== "doctor") return;

    const state = await fetchDoctorMeTourState(accessToken);

    if (state?.approval_status && state.approval_status !== doctorApprovalStatus) {
      setDoctorApprovalStatus(state.approval_status);
    }

    if (!isApproved(state?.approval_status, doctorApprovalStatus)) return;

    if (!state) {
      // API read failed — still start the tour for approved doctors so onboarding is not blocked.
      if (!useProductTourStore.getState().active) startMainTour();
      return;
    }

    const onboardingPatientId = await ensureDoctorOnboarding(accessToken);
    const testPatientId =
      onboardingPatientId ??
      state?.onboarding_test_patient_user_id ??
      null;
    if (testPatientId) setTestPatientUserId(testPatientId);
    await refreshChats();

    const tourActive = useProductTourStore.getState().active;

    if (ALWAYS_SHOW_DOCTOR_PRODUCT_TOUR) {
      if (!tourActive && !autoStartedRef.current) {
        startMainTour();
        autoStartedRef.current = true;
      }
      return;
    }

    const productDone = Boolean(state?.product_tour_completed_at);
    const profileDone = Boolean(state?.profile_tour_completed_at);

    if (!productDone) {
      if (!tourActive) startMainTour();
      return;
    }
    if (!profileDone && !tourActive) {
      startProfileTour();
    }
  }, [
    hydrated,
    accessToken,
    role,
    doctorApprovalStatus,
    setDoctorApprovalStatus,
    setTestPatientUserId,
    startMainTour,
    startProfileTour,
    refreshChats,
  ]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap, pathname, doctorApprovalStatus, accessToken]);

  useEffect(() => {
    if (exitReason !== "complete" || !completedPhase) return;

    const finish = async () => {
      if (completedPhase === "main") {
        if (!ALWAYS_SHOW_DOCTOR_PRODUCT_TOUR) {
          await markDoctorTourComplete(accessToken, "product");
          const state = await fetchDoctorMeTourState(accessToken);
          if (state && !state.profile_tour_completed_at) {
            if (!useProductTourStore.getState().active) startProfileTour();
          }
        }
      } else if (completedPhase === "profile") {
        await markDoctorTourComplete(accessToken, "profile");
      }
      clearExit();
    };

    void finish();
  }, [
    exitReason,
    completedPhase,
    accessToken,
    startProfileTour,
    clearExit,
  ]);

  if (role?.toLowerCase() !== "doctor" || !hydrated) return null;

  return (
    <ProductTourOverlay
      onSkip={() => {
        if (!ALWAYS_SHOW_DOCTOR_PRODUCT_TOUR) {
          void markDoctorTourComplete(accessToken, "product");
        }
      }}
      onCompleteMain={async () => {
        if (ALWAYS_SHOW_DOCTOR_PRODUCT_TOUR) return;
        await markDoctorTourComplete(accessToken, "product");
        const state = await fetchDoctorMeTourState(accessToken);
        if (state && !state.profile_tour_completed_at) {
          if (!useProductTourStore.getState().active) startProfileTour();
        }
      }}
      onCompleteProfile={() => void markDoctorTourComplete(accessToken, "profile")}
    />
  );
}
