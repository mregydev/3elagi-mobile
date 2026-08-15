import type { PublicDoctorClinic } from "@/domains/doctor/api";

export type DoctorLocationInfo = {
  clinicName: string;
  address: string;
  mapQuery: string;
  mapSearchQuery: string;
};

export function resolveDoctorLocation(
  clinic: PublicDoctorClinic | null | undefined,
): DoctorLocationInfo | null {
  if (!clinic) return null;
  const clinicName = clinic.name?.trim() ?? "";
  const address = clinic.location?.trim() ?? "";
  if (!clinicName && !address) return null;
  const mapQuery = address || clinicName;
  const mapSearchQuery = [clinicName, address].filter(Boolean).join(", ");
  return { clinicName, address, mapQuery, mapSearchQuery };
}

export function googleMapsEmbedUrl(query: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

export function googleMapsOpenUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function formatReviewDate(iso: string, locale: string): string {
  if (!iso?.trim()) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const tag = locale === "ar" ? "ar-EG" : locale === "de" ? "de-DE" : locale === "es" ? "es-ES" : "en-US";
  return date.toLocaleDateString(tag, { year: "numeric", month: "short", day: "numeric" });
}
