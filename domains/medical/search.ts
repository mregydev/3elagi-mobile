import type { MedicalRecord } from "./types";

export type DateFilterMode = "any" | "on" | "range" | "before" | "after";

export interface MedicalHistoryFilters {
  text: string;
  /** Diagnosis only — matches the doctor who created the diagnosis */
  doctorName: string;
  dateMode: DateFilterMode;
  dateFrom: Date | null;
  dateTo: Date | null;
  singleDate: Date | null;
}

export const EMPTY_MEDICAL_FILTERS: MedicalHistoryFilters = {
  text: "",
  doctorName: "",
  dateMode: "any",
  dateFrom: null,
  dateTo: null,
  singleDate: null,
};

export function hasActiveFilters(filters: MedicalHistoryFilters): boolean {
  if (filters.text.trim()) return true;
  if (filters.doctorName.trim()) return true;
  if (filters.dateMode === "any") return false;
  if (filters.dateMode === "range") return !!(filters.dateFrom || filters.dateTo);
  if (filters.dateMode === "on" || filters.dateMode === "before" || filters.dateMode === "after") {
    return filters.singleDate !== null;
  }
  return false;
}

export function filterMedicalRecords(
  records: MedicalRecord[],
  filters: MedicalHistoryFilters,
): MedicalRecord[] {
  return records.filter(
    (record) =>
      matchesText(record, filters.text) &&
      matchesDoctorName(record, filters.doctorName) &&
      matchesDateFilter(record, filters),
  );
}

function matchesText(record: MedicalRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const textParts = [
    record.title,
    record.notes,
    record.value,
    record.fileName,
    ...(record.symptoms?.map((s) => s.desc) ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return textParts.includes(q);
}

function matchesDoctorName(record: MedicalRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (record.category !== "diagnosis") return true;
  const name = record.doctorName?.toLowerCase() ?? "";
  return name.includes(q);
}

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function recordDay(record: MedicalRecord): number {
  const raw = record.date || record.createdAt;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return 0;
  return startOfDay(d);
}

function matchesDateFilter(record: MedicalRecord, filters: MedicalHistoryFilters): boolean {
  if (filters.dateMode === "any") return true;

  const day = recordDay(record);

  if (filters.dateMode === "on") {
    if (!filters.singleDate) return true;
    return day === startOfDay(filters.singleDate);
  }

  if (filters.dateMode === "before") {
    if (!filters.singleDate) return true;
    return day < startOfDay(filters.singleDate);
  }

  if (filters.dateMode === "after") {
    if (!filters.singleDate) return true;
    return day > startOfDay(filters.singleDate);
  }

  if (filters.dateMode === "range") {
    if (!filters.dateFrom && !filters.dateTo) return true;
    if (filters.dateFrom && day < startOfDay(filters.dateFrom)) return false;
    if (filters.dateTo && day > startOfDay(filters.dateTo)) return false;
    return true;
  }

  return true;
}
