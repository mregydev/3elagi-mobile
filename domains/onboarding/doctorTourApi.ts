import { API_BASE } from "@/constants/api";
import type { DoctorApprovalStatus } from "@/domains/auth/types";
import { withAuthRequestInit } from "@/domains/auth/http";

export type DoctorMeTourState = {
  approval_status?: DoctorApprovalStatus | null;
  product_tour_completed_at?: string | null;
  profile_tour_completed_at?: string | null;
  onboarding_test_patient_user_id?: string | null;
};

async function doctorAuthFetch(
  accessToken: string | null,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, withAuthRequestInit(accessToken, init));
}

/** Loads doctor profile + tour flags (works with cookie and bearer auth). */
export async function fetchDoctorMeTourState(
  accessToken: string | null,
): Promise<DoctorMeTourState | null> {
  const res = await doctorAuthFetch(accessToken, "/doctors/me");
  if (!res.ok) return null;
  return (await res.json()) as DoctorMeTourState;
}

export async function ensureDoctorOnboarding(
  accessToken: string | null,
): Promise<string | null> {
  const res = await doctorAuthFetch(accessToken, "/doctors/me/onboarding", {
    method: "POST",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { test_patient_user_id?: string | null };
  return data.test_patient_user_id ?? null;
}

export async function markDoctorTourComplete(
  accessToken: string | null,
  kind: "product" | "profile",
): Promise<boolean> {
  const res = await doctorAuthFetch(accessToken, "/doctors/me/tours", {
    method: "PATCH",
    body: JSON.stringify({ kind }),
  });
  return res.ok;
}
