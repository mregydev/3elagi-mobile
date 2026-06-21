import { API_BASE } from "@/constants/api";

export interface AdvertisementRow {
  id: string;
  title: string;
  description: string;
  banner_image_url: string;
  clinic_id?: string | null;
  clinic_name?: string | null;
}

export interface SpecialityRow {
  id: string;
  name_en: string;
  name_ar: string;
  image_url: string;
}

export interface SpecialityDoctorRow {
  id: string;
  doctor_id: string;
  name: string;
  photo_url?: string | null;
  specialty?: string | null;
  speciality_id?: string;
  professional_title?: string | null;
  experience_years?: number | null;
  consultation_fee_egp?: number | null;
  rating_average?: number | null;
  rating_total?: number | null;
  message_price?: number | null;
  role: "doctor";
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  bannerImageUrl: string;
  clinicId?: string | null;
  clinicName?: string | null;
}

export interface Speciality {
  id: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string;
}

export interface SpecialityDoctor {
  id: string;
  doctorId: string;
  name: string;
  photoUrl?: string | null;
  specialty?: string | null;
  specialityId?: string;
  professionalTitle?: string | null;
  experienceYears?: number | null;
  consultationFeeEgp?: number | null;
  ratingAverage?: number | null;
  ratingTotal?: number | null;
  messagePrice?: number | null;
}

function mapAdvertisement(row: AdvertisementRow): Advertisement {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    bannerImageUrl: row.banner_image_url,
    clinicId: row.clinic_id,
    clinicName: row.clinic_name,
  };
}

function resolveAssetUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_BASE.replace(/\/$/, "");
  return `${base}/${url.replace(/^\//, "")}`;
}

function mapSpeciality(row: SpecialityRow): Speciality {
  return {
    id: row.id,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    imageUrl: resolveAssetUrl(row.image_url),
  };
}

function mapDoctor(row: SpecialityDoctorRow): SpecialityDoctor {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    name: row.name,
    photoUrl: row.photo_url,
    specialty: row.specialty?.trim() || undefined,
    specialityId: row.speciality_id,
    professionalTitle: row.professional_title?.trim() || undefined,
    experienceYears: row.experience_years ?? undefined,
    consultationFeeEgp: row.consultation_fee_egp ?? undefined,
    ratingAverage: row.rating_average ?? undefined,
    ratingTotal: row.rating_total ?? undefined,
    messagePrice: row.message_price ?? 1,
  };
}

export async function fetchAdvertisements(): Promise<Advertisement[]> {
  const res = await fetch(`${API_BASE}/advertisements`);
  const data = (await res.json().catch(() => [])) as AdvertisementRow[];
  if (!res.ok || !Array.isArray(data)) {
    throw new Error(
      (data as { message?: string })?.message ??
        `Failed to load advertisements (${res.status})`,
    );
  }
  return data.map(mapAdvertisement);
}

export async function fetchSpecialities(): Promise<Speciality[]> {
  const res = await fetch(`${API_BASE}/specialities`);
  const data = (await res.json().catch(() => [])) as SpecialityRow[];
  if (!res.ok || !Array.isArray(data)) {
    throw new Error(
      (data as { message?: string })?.message ??
        `Failed to load specialities (${res.status})`,
    );
  }
  return data.map(mapSpeciality);
}

export async function fetchDoctorsBySpeciality(
  specialityId: string,
): Promise<SpecialityDoctor[]> {
  const res = await fetch(`${API_BASE}/specialities/${specialityId}/doctors`);
  const data = (await res.json().catch(() => [])) as SpecialityDoctorRow[];
  if (!res.ok || !Array.isArray(data)) {
    throw new Error(
      (data as { message?: string })?.message ??
        `Failed to load doctors (${res.status})`,
    );
  }
  return data.map(mapDoctor);
}

/** Merge a realtime doctor payload into an existing speciality roster. */
export function mergeDoctorIntoRoster(
  doctors: SpecialityDoctor[],
  row: SpecialityDoctorRow,
  specialityId: string,
): SpecialityDoctor[] {
  const doctorSpecialityId = row.speciality_id?.trim();
  if (doctorSpecialityId && doctorSpecialityId !== specialityId) return doctors;
  const mapped = mapDoctor(row);
  if (doctors.some((d) => d.id === mapped.id)) return doctors;
  return [...doctors, mapped].sort((a, b) => a.name.localeCompare(b.name));
}
