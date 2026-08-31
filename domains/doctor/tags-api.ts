import { API_BASE } from "@/constants/api";

export type DoctorTagSuggestion = {
  id: string;
  label: string;
  specialityId: string | null;
  source: "speciality" | "common";
};

type RawDoctorTagSuggestion = {
  id: string;
  label: string;
  speciality_id: string | null;
  source: "speciality" | "common";
};

export async function fetchDoctorTagSuggestions(params: {
  specialityIds: string[];
  q?: string;
  limit?: number;
}): Promise<DoctorTagSuggestion[]> {
  const search = new URLSearchParams();
  if (params.specialityIds.length) {
    search.set("speciality_ids", params.specialityIds.join(","));
  }
  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }
  if (params.limit != null) {
    search.set("limit", String(params.limit));
  }

  const qs = search.toString();
  const res = await fetch(`${API_BASE}/doctor-tags${qs ? `?${qs}` : ""}`);
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ??
        `Request failed (${res.status})`,
    );
  }

  if (!Array.isArray(data)) return [];
  return data.map((row: RawDoctorTagSuggestion) => ({
    id: row.id,
    label: row.label,
    specialityId: row.speciality_id,
    source: row.source,
  }));
}
