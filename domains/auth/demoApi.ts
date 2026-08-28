import { API_BASE } from "@/constants/api";
import type { WebViewAuthSession } from "@/constants/nativeWebViewBridge";
import type { DemoSlot } from "@/constants/demo";
import type { AuthSession } from "./types";

type RawAuthResponse = {
  access_token: string;
  role: string;
  user_id: string;
  profile: Record<string, unknown>;
  email_verified?: boolean;
};

type DemoSessionsResponse = {
  mobile: RawAuthResponse;
  laptop: RawAuthResponse;
};

function mapRawToWebViewSession(raw: RawAuthResponse): WebViewAuthSession {
  const profile = raw.profile ?? {};
  const isDoctor = raw.role?.toLowerCase() === "doctor";
  const speciality = profile.speciality as
    | { id?: string; name_en?: string }
    | undefined;
  const specialty = String(
    profile.professional_title ?? speciality?.name_en ?? "",
  ).trim();
  const specialityId = profile.speciality_id
    ? String(profile.speciality_id)
    : speciality?.id
      ? String(speciality.id)
      : null;
  const approval = profile.approval_status;
  const doctorApprovalStatus =
    approval === "pending" || approval === "approved" || approval === "rejected"
      ? approval
      : null;

  return {
    accessToken: raw.access_token,
    role: raw.role,
    doctorId: isDoctor ? String(profile.id ?? "") : null,
    specialty: specialty || null,
    specialityId,
    doctorApprovalStatus: isDoctor ? doctorApprovalStatus : null,
    emailVerified: raw.email_verified !== false,
    profile: {
      id: String(profile.user_id ?? profile.id ?? raw.user_id),
      name: String(profile.name ?? ""),
      email: String(profile.email ?? ""),
      phone: profile.phone ? String(profile.phone) : undefined,
      country: profile.country ? String(profile.country).toUpperCase() : undefined,
      avatarUrl: profile.photo_url
        ? String(profile.photo_url)
        : profile.avatar_url
          ? String(profile.avatar_url)
          : undefined,
      createdAt: String(
        profile.created_at ?? profile.createdAt ?? new Date().toISOString(),
      ),
    },
  };
}

export type DemoPanelSessions = Record<DemoSlot, WebViewAuthSession>;

export async function fetchDemoPanelSessions(): Promise<DemoPanelSessions> {
  const res = await fetch(`${API_BASE}/auth/demo/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const data = (await res.json().catch(() => ({}))) as DemoSessionsResponse & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(
      (typeof data?.message === "string" ? data.message : null) ??
        `Demo sessions unavailable (${res.status})`,
    );
  }
  return {
    mobile: mapRawToWebViewSession(data.mobile),
    laptop: mapRawToWebViewSession(data.laptop),
  };
}

/** Convert a normal auth session for `_st` embed bootstrap. */
export function authSessionToWebViewSession(session: AuthSession): WebViewAuthSession {
  return {
    accessToken: session.accessToken,
    profile: session.profile,
    role: session.role,
    doctorId: session.doctorId ?? null,
    specialty: session.specialty ?? null,
    specialityId: session.specialityId ?? null,
    doctorApprovalStatus: session.doctorApprovalStatus ?? null,
    emailVerified: session.emailVerified !== false,
  };
}
