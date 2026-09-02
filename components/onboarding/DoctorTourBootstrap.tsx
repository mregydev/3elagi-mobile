import React, { useCallback, useEffect } from "react";
import { API_BASE } from "@/constants/api";
import { ProductTourOverlay } from "@/components/onboarding/ProductTourOverlay";
import { useProductTourStore } from "@/domains/onboarding/productTourStore";
import { useAuthStore } from "@/domains/auth/store";

type DoctorMe = {
  product_tour_completed_at?: string | null;
  profile_tour_completed_at?: string | null;
  onboarding_test_patient_user_id?: string | null;
};

async function fetchDoctorTourState(token: string): Promise<DoctorMe> {
  const res = await fetch(`${API_BASE}/doctors/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return {};
  return (await res.json()) as DoctorMe;
}

async function ensureDoctorOnboarding(token: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/doctors/me/onboarding`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { test_patient_user_id?: string | null };
  return data.test_patient_user_id ?? null;
}

async function markTourComplete(
  token: string,
  kind: "product" | "profile",
): Promise<void> {
  await fetch(`${API_BASE}/doctors/me/tours`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ kind }),
  });
}

/** Starts doctor onboarding tours once after approval. */
export function DoctorTourBootstrap() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const doctorApprovalStatus = useAuthStore((s) => s.doctorApprovalStatus);
  const startMainTour = useProductTourStore((s) => s.startMainTour);
  const startProfileTour = useProductTourStore((s) => s.startProfileTour);
  const setTestPatientUserId = useProductTourStore((s) => s.setTestPatientUserId);

  const bootstrap = useCallback(async () => {
    if (!accessToken || role?.toLowerCase() !== "doctor") return;
    if (doctorApprovalStatus !== "approved") return;

    const onboardingPatientId = await ensureDoctorOnboarding(accessToken);
    const state = await fetchDoctorTourState(accessToken);
    const testPatientId =
      onboardingPatientId ?? state.onboarding_test_patient_user_id ?? null;
    if (testPatientId) setTestPatientUserId(testPatientId);

    if (!state.product_tour_completed_at) {
      startMainTour();
      return;
    }
    if (!state.profile_tour_completed_at) {
      startProfileTour();
    }
  }, [
    accessToken,
    doctorApprovalStatus,
    role,
    setTestPatientUserId,
    startMainTour,
    startProfileTour,
  ]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (role?.toLowerCase() !== "doctor" || !accessToken) return null;

  return (
    <ProductTourOverlay
      onCompleteMain={async () => {
        await markTourComplete(accessToken, "product");
        const state = await fetchDoctorTourState(accessToken);
        if (!state.profile_tour_completed_at) {
          startProfileTour();
        }
      }}
      onCompleteProfile={() => void markTourComplete(accessToken, "profile")}
    />
  );
}
