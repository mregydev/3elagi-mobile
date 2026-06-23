export type MedicalCategory = "diagnosis" | "lab" | "xray" | "intake" | "prescription";

export interface PrescriptionMedication {
  id?: string;
  medication_name: string;
  interval?: string;
  dose?: string;
  notes?: string;
}

export interface DiagnosisSymptom {
  id: string;
  desc: string;
  createdAt: string;
}

export interface LinkedDiagnosisSummary {
  id: string;
  title: string;
}

export interface MedicalRecord {
  id: string;
  ownerId: string;
  category: MedicalCategory;
  title: string;
  notes?: string;
  /** Free-form value: lab result text, intake answer, etc. */
  value?: string;
  date: string; // ISO
  createdAt: string;
  /** Set for lab/xray records loaded from the API */
  fileUrl?: string;
  fileName?: string;
  /** Linked symptoms when category is diagnosis */
  symptoms?: DiagnosisSymptom[];
  /** Doctor who created the diagnosis (when set by a doctor) */
  doctorName?: string | null;
  /** Doctor entity id when a doctor created this diagnosis */
  doctorId?: string | null;
  /** Lab / X-ray records linked to this diagnosis */
  linkedDocuments?: MedicalRecord[];
  /** Diagnoses linked to this lab/xray record */
  linkedDiagnoses?: LinkedDiagnosisSummary[];
  /** @deprecated Use linkedDiagnoses — kept for older API responses */
  diagnosisId?: string | null;
  /** Medication rows when category is prescription */
  medications?: PrescriptionMedication[];
  /** Generated PDF for doctor prescriptions */
  pdfUrl?: string | null;
  /** Scanned/uploaded prescription photo */
  imageUrl?: string | null;
}
