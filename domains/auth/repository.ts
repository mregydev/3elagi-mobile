import { API_BASE } from "@/constants/api";
import { uploadFile } from "@/domains/medical";
import type { AuthSession, Credentials, DoctorApprovalStatus, SignupInput, SignupFile } from "./types";

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ??
      data?.error ??
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

async function authPatch<T>(path: string, token: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ??
        data?.error ??
        `Request failed (${res.status})`,
    );
  }
  return data as T;
}

interface RawAuthResponse {
  access_token: string;
  role: string;
  user_id: string;
  profile: Record<string, unknown>;
}

function doctorSpecialtyFromProfile(profile: Record<string, unknown>): {
  specialty?: string;
  specialityId?: string;
} {
  const speciality = profile.speciality as
    | { id?: string; name_en?: string; name_ar?: string }
    | undefined;
  const specialty = String(
    profile.professional_title ?? speciality?.name_en ?? "",
  ).trim();
  const specialityId = profile.speciality_id
    ? String(profile.speciality_id)
    : speciality?.id
      ? String(speciality.id)
      : undefined;
  return {
    specialty: specialty || undefined,
    specialityId,
  };
}

function readDoctorApprovalStatus(
  profile: Record<string, unknown>,
): DoctorApprovalStatus | null {
  const status = profile.approval_status;
  if (status === "pending" || status === "approved" || status === "rejected") {
    return status;
  }
  return null;
}

function normalizeProfile(
  raw: Record<string, unknown>,
  fallbackEmail: string,
  photoOverride?: string,
) {
  return {
    id: String(raw.user_id ?? raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? raw.full_name ?? ""),
    email: String(raw.email ?? fallbackEmail),
    phone: raw.phone ? String(raw.phone) : undefined,
    avatarUrl: photoOverride
      ?? (raw.photo_url
        ? String(raw.photo_url)
        : raw.avatar_url
          ? String(raw.avatar_url)
          : undefined),
    createdAt: String(
      raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    ),
  };
}

async function uploadSignupFile(file: SignupFile, token: string): Promise<string> {
  const result = await uploadFile(file.uri, file.mimeType, file.fileName, token);
  return result.url;
}

async function applySignupUploads(
  input: SignupInput,
  token: string,
  isDoctor: boolean,
): Promise<string | undefined> {
  let photoUrl: string | undefined;

  if (input.photo) {
    photoUrl = await uploadSignupFile(input.photo, token);
    await authPatch("/users/me", token, { photo_url: photoUrl });
    if (isDoctor) {
      await authPatch("/doctors/me", token, { photo_url: photoUrl });
    } else {
      await authPatch("/patient", token, { photo_url: photoUrl });
    }
  }

  if (isDoctor && (input.graduationCert || input.workPermit)) {
    const patch: Record<string, string> = {};
    if (input.graduationCert) {
      patch.graduation_cert_url = await uploadSignupFile(input.graduationCert, token);
    }
    if (input.workPermit) {
      patch.work_permit_url = await uploadSignupFile(input.workPermit, token);
    }
    await authPatch("/doctors/me", token, patch);
  }

  return photoUrl;
}

export const authRepository = {
  async login(creds: Credentials): Promise<AuthSession> {
    const raw = await post<RawAuthResponse>("/auth/login", {
      email: creds.email.trim().toLowerCase(),
      password: creds.password,
    });
    const profile = raw.profile ?? {};
    const isDoctor = raw.role?.toLowerCase() === "doctor";
    const isAdmin = raw.role?.toLowerCase() === "admin";
    const { specialty, specialityId } = isDoctor
      ? doctorSpecialtyFromProfile(profile)
      : {};
    return {
      accessToken: raw.access_token,
      role: raw.role,
      userId: raw.user_id,
      doctorId: isDoctor ? String(profile.id ?? "") : undefined,
      specialty,
      specialityId,
      doctorApprovalStatus: isDoctor ? readDoctorApprovalStatus(profile) : null,
      profile: normalizeProfile(
        {
          ...profile,
          user_id: isDoctor || isAdmin ? raw.user_id : profile.user_id ?? raw.user_id,
          name: isAdmin ? "Admin" : profile.name,
          email: isAdmin ? creds.email : profile.email,
        },
        creds.email,
      ),
    };
  },

  async signup(input: SignupInput): Promise<AuthSession> {
    const isDoctor = input.role === "doctor";
    const email = input.email.trim().toLowerCase();

    const raw = isDoctor
      ? await post<RawAuthResponse>("/auth/register/doctor", {
          email,
          password: input.password,
          name: input.name.trim(),
          phone: input.phone ?? "",
          speciality_id: input.specialityId,
          message_price: input.messagePrice ?? 1,
        })
      : await post<RawAuthResponse>("/auth/register/patient", {
          email,
          password: input.password,
          name: input.name.trim(),
          phone: input.phone ?? "",
        });

    const photoUrl = await applySignupUploads(
      input,
      raw.access_token,
      isDoctor,
    ).catch(() => undefined);

    const profileRaw = raw.profile ?? {};
    const isDoctorRole = raw.role?.toLowerCase() === "doctor";
    const { specialty, specialityId: profileSpecialityId } = isDoctorRole
      ? doctorSpecialtyFromProfile(profileRaw)
      : {};
    const specialityId = isDoctorRole
      ? input.specialityId ?? profileSpecialityId
      : undefined;

    return {
      accessToken: raw.access_token,
      role: raw.role,
      userId: raw.user_id,
      doctorId: isDoctorRole ? String(profileRaw.id ?? "") : undefined,
      specialty,
      specialityId,
      doctorApprovalStatus: isDoctorRole ? readDoctorApprovalStatus(profileRaw) : null,
      profile: normalizeProfile(
        {
          ...profileRaw,
          user_id: isDoctorRole ? raw.user_id : profileRaw.user_id ?? raw.user_id,
        },
        email,
        photoUrl,
      ),
    };
  },
};
