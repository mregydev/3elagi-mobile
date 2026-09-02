import { usePathname } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { ProductTourOverlay } from "@/components/onboarding/ProductTourOverlay";
import {
  ensureDoctorOnboarding,
  fetchDoctorMeTourState,
  markDoctorTourComplete,
} from "@/domains/onboarding/doctorTourApi";
import { useProductTourStore } from "@/domains/onboarding/productTourStore";
import { useAuthStore } from "@/domains/auth/store";

function isApproved(
  fromApi: string | null | undefined,
  fromStore: string | null | undefined,
): boolean {
  return fromApi === "approved" || fromStore === "approved";
}

/** Starts doctor onboarding tours once per doctor (tracked on the server). */
export function DoctorTourBootstrap() {
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const doctorApprovalStatus = useAuthStore((s) => s.doctorApprovalStatus);
  const setDoctorApprovalStatus = useAuthStore((s) => s.setDoctorApprovalStatus);

  const startMainTour = useProductTourStore((s) => s.startMainTour);
  const startProfileTour = useProductTourStore((s) => s.startProfileTour);
  const setTestPatientUserId = useProductTourStore((s) => s.setTestPatientUserId);

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

    const productDone = Boolean(state?.product_tour_completed_at);
    const profileDone = Boolean(state?.profile_tour_completed_at);
    const tourActive = useProductTourStore.getState().active;

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
  ]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap, pathname, doctorApprovalStatus, accessToken]);

  if (role?.toLowerCase() !== "doctor" || !hydrated) return null;

  return (
    <ProductTourOverlay
      onCompleteMain={async () => {
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
