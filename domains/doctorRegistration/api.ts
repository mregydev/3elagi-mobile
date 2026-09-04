import { API_BASE } from "@/constants/api";

export async function submitDoctorRegistration(input: {
  doctorName: string;
  email: string;
  phone: string;
  country: string;
  specialityId: string;
  clinicLocation?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/doctor-registration-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      doctor_name: input.doctorName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      country: input.country.trim().toUpperCase(),
      speciality_id: input.specialityId,
      clinic_location: input.clinicLocation?.trim() || undefined,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ??
        data?.error ??
        `Request failed (${res.status})`,
    );
  }
}
