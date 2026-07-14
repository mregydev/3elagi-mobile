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
  description?: string | null;
  personal_clinic_location?: string | null;
  certification_urls?: DoctorCertification[] | null;
  speciality_id?: string | null;
  speciality_name_en?: string | null;
  speciality_name_ar?: string | null;
  consultation_price?: number | null;
  video_consultation_price?: number | null;
  video_consultation_minutes?: number | null;
  iban?: string | null;
  account_holder_full_name?: string | null;
  national_id?: string | null;
}

export interface DoctorCertification {
  url: string;
  description: string;
}

export interface AccountProfile {
  userId: string;
  email: string;
  name: string;
  phone: string;
  birthDate?: string;
  professionalTitle?: string;
  info?: string;
  location?: string;
  certifications?: DoctorCertification[];
  specialityId?: string;
  specialityNameEn?: string;
  specialityNameAr?: string;
  consultationPrice?: number;
  videoConsultationPrice?: number;
  videoConsultationMinutes?: number;
  iban?: string;
  accountHolderFullName?: string;
  nationalId?: string;
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
      info: doctor.description ?? undefined,
      location: doctor.personal_clinic_location ?? undefined,
      certifications: Array.isArray(doctor.certification_urls)
        ? doctor.certification_urls
        : [],
      specialityId: doctor.speciality_id ?? undefined,
      specialityNameEn: doctor.speciality_name_en ?? undefined,
      specialityNameAr: doctor.speciality_name_ar ?? undefined,
      consultationPrice: Math.min(100_000, Math.max(1, doctor.consultation_price ?? 1)),
      videoConsultationPrice: Math.min(
        100_000,
        Math.max(1, doctor.video_consultation_price ?? 1),
      ),
      videoConsultationMinutes: doctor.video_consultation_minutes ?? 30,
      iban: doctor.iban ?? undefined,
      accountHolderFullName: doctor.account_holder_full_name ?? undefined,
      nationalId: doctor.national_id ?? undefined,
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
    info?: string;
    location?: string;
    certifications?: DoctorCertification[];
    specialityId?: string;
    consultationPrice?: number;
    videoConsultationPrice?: number;
    videoConsultationMinutes?: number;
    iban?: string;
    accountHolderFullName?: string;
    nationalId?: string;
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
        description: payload.info?.trim() || null,
        personal_clinic_location: payload.location?.trim() || null,
        certification_urls: payload.certifications ?? undefined,
        speciality_id: payload.specialityId ?? undefined,
        consultation_price: payload.consultationPrice ?? undefined,
        video_consultation_price: payload.videoConsultationPrice ?? undefined,
        video_consultation_minutes: payload.videoConsultationMinutes ?? undefined,
        iban: payload.iban ?? undefined,
        account_holder_full_name: payload.accountHolderFullName ?? undefined,
        national_id: payload.nationalId ?? undefined,
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
