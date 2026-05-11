export type MedicalCategory = "symptom" | "lab" | "xray" | "intake";

export interface MedicalRecord {
  id: string;
  ownerId: string;
  category: MedicalCategory;
  title: string;
  notes?: string;
  /** Free-form value: lab result text, symptom severity, intake answer, etc. */
  value?: string;
  date: string; // ISO
  createdAt: string;
}
