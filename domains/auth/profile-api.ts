import { API_BASE } from "@/constants/api";
import type { PatientProfile } from "./types";

async function authJson<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
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

interface RawUser {
  id: string;
  email: string;
  role: string;
  photo_url: string | null;
}

interface RawPatientDetail {
  id: string;
  email: string;
  name: string;
  phone: string;
  birth_date?: string | null;
  photo_url?: string | null;
}

interface RawDoctor {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  photo_url?: string | null;
  professional_title?: string | null;
  speciality_id?: string | null;
  speciality_name_en?: string | null;
  speciality_name_ar?: string | null;
  message_price?: number | null;
}

export interface AccountProfile {
  userId: string;
  email: string;
  name: string;
  phone: string;
  birthDate?: string;
  professionalTitle?: string;
  specialityId?: string;
  specialityNameEn?: string;
  specialityNameAr?: string;
  messagePrice?: number;
  photoUrl?: string;
  role: string;
}

function pickPhoto(user: RawUser, roleRow: { photo_url?: string | null }) {
  return roleRow.photo_url ?? user.photo_url ?? undefined;
}

export async function fetchAccountProfile(
  token: string,
  role: string,
): Promise<AccountProfile> {
  const user = await authJson<RawUser>("/users/me", token);
  const isDoctor = role.toLowerCase() === "doctor";

  if (isDoctor) {
    const doctor = await authJson<RawDoctor>("/doctors/me", token);
    return {
      userId: user.id,
      email: doctor.email ?? user.email,
      name: doctor.name,
      phone: doctor.phone ?? "",
      professionalTitle: doctor.professional_title ?? undefined,
      specialityId: doctor.speciality_id ?? undefined,
      specialityNameEn: doctor.speciality_name_en ?? undefined,
      specialityNameAr: doctor.speciality_name_ar ?? undefined,
      messagePrice: doctor.message_price ?? 1,
      photoUrl: pickPhoto(user, doctor),
      role: user.role,
    };
  }

  const patient = await authJson<RawPatientDetail>("/patient", token);
  return {
    userId: user.id,
    email: patient.email ?? user.email,
    name: patient.name,
    phone: patient.phone ?? "",
    birthDate: patient.birth_date ?? undefined,
    photoUrl: pickPhoto(user, patient),
    role: user.role,
  };
}

export async function updateAccountProfile(
  token: string,
  role: string,
  payload: {
    name: string;
    phone: string;
    birthDate?: string;
    professionalTitle?: string;
    specialityId?: string;
    messagePrice?: number;
    photoUrl?: string | null;
  },
): Promise<PatientProfile> {
  const isDoctor = role.toLowerCase() === "doctor";

  if (payload.photoUrl !== undefined) {
    await authJson<RawUser>("/users/me", token, {
      method: "PATCH",
      body: JSON.stringify({ photo_url: payload.photoUrl }),
    });
  }

  if (isDoctor) {
    const doctor = await authJson<RawDoctor>("/doctors/me", token, {
      method: "PATCH",
      body: JSON.stringify({
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        photo_url: payload.photoUrl ?? undefined,
        professional_title: payload.professionalTitle?.trim() || null,
        speciality_id: payload.specialityId ?? undefined,
        message_price: payload.messagePrice ?? undefined,
      }),
    });
    return {
      id: doctor.user_id,
      name: doctor.name,
      email: doctor.email ?? "",
      phone: doctor.phone ?? undefined,
      avatarUrl: doctor.photo_url ?? payload.photoUrl ?? undefined,
      createdAt: new Date().toISOString(),
    };
  }

  const profile = await authJson<{
    user_id: string;
    name: string;
    phone: string;
    photo_url?: string | null;
  }>("/patient", token, {
    method: "PATCH",
    body: JSON.stringify({
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      birth_date: payload.birthDate || undefined,
      photo_url: payload.photoUrl ?? undefined,
    }),
  });

  const user = await authJson<RawUser>("/users/me", token);

  return {
    id: profile.user_id,
    name: profile.name,
    email: user.email,
    phone: profile.phone,
    avatarUrl: profile.photo_url ?? payload.photoUrl ?? undefined,
    createdAt: new Date().toISOString(),
  };
}

export { authJson };
