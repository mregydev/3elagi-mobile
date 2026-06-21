import { API_BASE } from "@/constants/api";
import type { DiagnosisSymptom, MedicalRecord, PrescriptionMedication } from "./types";

interface RawPrescriptionMedication {
  id: string;
  medication_name: string;
  interval?: string | null;
  dose?: string | null;
  notes?: string | null;
}

interface RawPrescription {
  id: string;
  patient_user_id: string;
  doctor_id: string | null;
  doctor_name?: string | null;
  title: string;
  symptoms?: string | null;
  pdf_url?: string | null;
  image_url?: string | null;
  created_at: string;
  medications?: RawPrescriptionMedication[];
}

function mapPrescriptionMedication(raw: RawPrescriptionMedication): PrescriptionMedication {
  return {
    id: raw.id,
    medication_name: raw.medication_name,
    interval: raw.interval ?? undefined,
    dose: raw.dose ?? undefined,
    notes: raw.notes ?? undefined,
  };
}

function mapPrescription(raw: RawPrescription): MedicalRecord {
  const meds = (raw.medications ?? []).map(mapPrescriptionMedication);
  const imageUrl = raw.image_url ?? undefined;
  return {
    id: raw.id,
    ownerId: raw.patient_user_id,
    category: "prescription",
    title: raw.title,
    notes: raw.symptoms ?? undefined,
    date: raw.created_at,
    createdAt: raw.created_at,
    doctorName: raw.doctor_name ?? null,
    doctorId: raw.doctor_id ?? null,
    medications: meds,
    pdfUrl: raw.pdf_url ?? null,
    imageUrl,
    fileUrl: imageUrl,
    fileName: imageUrl ? "prescription.jpg" : undefined,
  };
}

interface RawSymptom {
  id: string;
  desc: string;
  created_at: string;
  doctor_id?: string | null;
  doctor_name?: string | null;
}

interface RawDiagnosis {
  id: string;
  desc: string;
  patient_id: string;
  doctor_id: string | null;
  doctor_name?: string | null;
  created_at: string;
  symptoms?: RawSymptom[];
  documents?: RawDocument[];
}

function mapSymptoms(raw: RawSymptom[] | undefined): DiagnosisSymptom[] {
  return (raw ?? []).map((s) => ({
    id: s.id,
    desc: s.desc,
    createdAt: s.created_at,
  }));
}

interface RawDocument {
  id: string;
  patient_id: string;
  type: "lab" | "xray";
  title?: string;
  file_url: string;
  file_name: string;
  notes: string | null;
  created_at: string;
  diagnosis_id?: string | null;
}

function mapDocument(doc: RawDocument): MedicalRecord {
  return {
    id: doc.id,
    ownerId: doc.patient_id,
    category: doc.type,
    title: doc.title ?? doc.file_name,
    notes: doc.notes ?? undefined,
    fileUrl: doc.file_url,
    fileName: doc.file_name,
    date: doc.created_at,
    createdAt: doc.created_at,
    diagnosisId: doc.diagnosis_id ?? null,
  };
}

function mapDiagnosis(d: RawDiagnosis): MedicalRecord {
  return {
    id: d.id,
    ownerId: d.patient_id,
    category: "diagnosis",
    title: d.desc,
    date: d.created_at,
    createdAt: d.created_at,
    symptoms: mapSymptoms(d.symptoms),
    doctorName: d.doctor_name ?? null,
    doctorId: d.doctor_id ?? null,
    linkedDocuments: (d.documents ?? []).map(mapDocument),
  };
}

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

export async function uploadFile(
  uri: string,
  mimeType: string,
  fileName: string,
  token: string,
): Promise<{ objectPath: string; url: string }> {
  const formData = new FormData();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData.append("file", { uri, name: fileName, type: mimeType } as any);

  const res = await fetch(`${API_BASE}/uploads/file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (Array.isArray(data?.message)
        ? (data.message as string[]).join(", ")
        : (data?.message as string)) ??
        (data?.error as string) ??
        `Upload failed (${res.status})`,
    );
  }
  return data as { objectPath: string; url: string };
}

export async function fetchPatientDocuments(
  _patientId: string,
  token: string,
): Promise<MedicalRecord[]> {
  try {
    const data = await authJson<RawDocument[]>("/patient/medical-documents", token);
    return (Array.isArray(data) ? data : []).map(mapDocument);
  } catch {
    return [];
  }
}

export async function fetchDocumentsForPatientUser(
  patientUserId: string,
  token: string,
): Promise<MedicalRecord[]> {
  try {
    const data = await authJson<RawDocument[]>(
      `/medical-documents/patient/${patientUserId}`,
      token,
    );
    return (Array.isArray(data) ? data : []).map(mapDocument);
  } catch {
    return [];
  }
}

export interface DoctorPatientListItem {
  user_id: string;
  email: string;
  name: string;
  phone: string;
  photo_url?: string | null;
  last_date: string | null;
  future_count: number;
  past_count: number;
}

export async function fetchDoctorPatients(token: string): Promise<DoctorPatientListItem[]> {
  const data = await authJson<DoctorPatientListItem[]>("/patients/registered", token);
  return Array.isArray(data) ? data : [];
}

export async function fetchDiagnosesForPatientUser(
  patientUserId: string,
  token: string,
): Promise<MedicalRecord[]> {
  const data = await authJson<RawDiagnosis[]>(
    `/diagnosis?patient_id=${encodeURIComponent(patientUserId)}`,
    token,
  );
  return (Array.isArray(data) ? data : []).map(mapDiagnosis);
}

export async function fetchPatientMedicalHistoryAsDoctor(
  patientUserId: string,
  token: string,
): Promise<MedicalRecord[]> {
  const [documents, diagnoses, prescriptions] = await Promise.all([
    authJson<RawDocument[]>(`/medical-documents/patient/${patientUserId}`, token),
    authJson<RawDiagnosis[]>(
      `/diagnosis?patient_id=${encodeURIComponent(patientUserId)}`,
      token,
    ),
    fetchPrescriptionsForPatientUser(patientUserId, token),
  ]);
  return [
    ...(Array.isArray(diagnoses) ? diagnoses : []).map(mapDiagnosis),
    ...(Array.isArray(prescriptions) ? prescriptions : []),
    ...(Array.isArray(documents) ? documents : []).map(mapDocument),
  ];
}

export async function fetchDoctorDiagnosisById(
  id: string,
  token: string,
): Promise<MedicalRecord> {
  const data = await authJson<RawDiagnosis>(`/diagnosis/${id}`, token);
  return mapDiagnosis(data);
}

export async function updateDiagnosis(
  id: string,
  payload: { desc: string },
  token: string,
): Promise<MedicalRecord> {
  const data = await authJson<RawDiagnosis>(`/diagnosis/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapDiagnosis(data);
}

export async function fetchPrescriptionsForPatientUser(
  patientUserId: string,
  token: string,
): Promise<MedicalRecord[]> {
  try {
    const data = await authJson<RawPrescription[]>(
      `/prescriptions/patient-user/${encodeURIComponent(patientUserId)}`,
      token,
    );
    return (Array.isArray(data) ? data : []).map(mapPrescription);
  } catch {
    return [];
  }
}

export async function fetchPrescriptionById(
  id: string,
  patientUserId: string,
  token: string,
): Promise<MedicalRecord> {
  const data = await authJson<RawPrescription>(
    `/prescriptions/patient-user/${encodeURIComponent(patientUserId)}/${encodeURIComponent(id)}`,
    token,
  );
  return mapPrescription(data);
}

export async function analyzePrescriptionImage(
  uri: string,
  mimeType: string,
  fileName: string,
  token: string,
  lang: "ar" | "en" = "en",
): Promise<PrescriptionMedication[]> {
  const formData = new FormData();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData.append("file", { uri, name: fileName, type: mimeType } as any);
  formData.append("lang", lang);

  const res = await fetch(`${API_BASE}/prescriptions/analyze-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ??
        data?.error ??
        `Request failed (${res.status})`,
    );
  }

  const rows = data as Array<{
    medication_name?: string;
    dose?: string;
    interval?: string;
    notes?: string;
  }>;

  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      medication_name: row.medication_name?.trim() ?? "",
      dose: row.dose?.trim() || undefined,
      interval: row.interval?.trim() || undefined,
      notes: row.notes?.trim() || undefined,
    }))
    .filter((row) => row.medication_name.length > 0);
}

export async function createPrescriptionForPatientUser(
  payload: {
    patient_user_id: string;
    title: string;
    symptoms?: string;
    medications: PrescriptionMedication[];
    image_url?: string;
  },
  token: string,
): Promise<MedicalRecord> {
  const data = await authJson<RawPrescription>("/prescriptions/patient-user", token, {
    method: "POST",
    body: JSON.stringify({
      patient_user_id: payload.patient_user_id,
      title: payload.title,
      symptoms: payload.symptoms,
      image_url: payload.image_url,
      medications: payload.medications.map((med) => ({
        medication_name: med.medication_name,
        interval: med.interval,
        dose: med.dose,
        notes: med.notes,
      })),
    }),
  });
  return mapPrescription(data);
}

/** Fetches diagnosis, lab results, and x-rays from the API (no local defaults). */
export async function fetchAllMedicalHistory(
  patientId: string,
  token: string,
  role?: string,
): Promise<MedicalRecord[]> {
  const isDoctor = role?.toLowerCase() === "doctor";
  if (isDoctor) {
    const [documents, diagnoses, prescriptions] = await Promise.all([
      fetchDocumentsForPatientUser(patientId, token),
      fetchDiagnosesForPatientUser(patientId, token).catch(() => [] as MedicalRecord[]),
      fetchPrescriptionsForPatientUser(patientId, token),
    ]);
    return [...diagnoses, ...prescriptions, ...documents];
  }
  const [documents, diagnoses, prescriptions] = await Promise.all([
    fetchPatientDocuments(patientId, token),
    fetchPatientDiagnoses(token).catch(() => [] as MedicalRecord[]),
    fetchPrescriptionsForPatientUser(patientId, token),
  ]);
  return [...diagnoses, ...prescriptions, ...documents];
}

export async function deletePatientMedicalDocument(
  id: string,
  token: string,
): Promise<void> {
  await authJson(`/patient/medical-documents/${id}`, token, { method: "DELETE" });
}

export async function createPatientMedicalDocument(
  payload: {
    type: "lab" | "xray";
    file_url: string;
    file_name: string;
    notes: string;
    title: string;
  },
  token: string,
): Promise<MedicalRecord> {
  const data = await authJson<RawDocument>("/patient/medical-documents", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapDocument(data);
}

export async function createDoctorMedicalDocument(
  payload: {
    patient_id: string;
    type: "lab" | "xray";
    file_url: string;
    file_name: string;
    notes: string;
    title: string;
  },
  token: string,
): Promise<MedicalRecord> {
  const data = await authJson<RawDocument>("/medical-documents", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapDocument(data);
}

export async function fetchPatientDiagnoses(
  token: string,
): Promise<MedicalRecord[]> {
  const data = await authJson<RawDiagnosis[]>("/patient/diagnoses", token);
  return (Array.isArray(data) ? data : []).map(mapDiagnosis);
}

export async function fetchDiagnosisById(
  id: string,
  token: string,
): Promise<MedicalRecord> {
  const data = await authJson<RawDiagnosis>(`/patient/diagnoses/${id}`, token);
  return mapDiagnosis(data);
}

export async function createDiagnosis(
  payload: {
    desc: string;
    patient_id: string;
    doctor_id: string;
    symptoms: { desc: string }[];
    document_ids?: string[];
  },
  token: string,
): Promise<MedicalRecord> {
  const data = await authJson<RawDiagnosis>("/diagnosis", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapDiagnosis(data);
}

export async function createPatientDiagnosis(
  payload: {
    desc: string;
    symptoms: { desc: string }[];
    document_ids?: string[];
  },
  token: string,
): Promise<MedicalRecord> {
  const data = await authJson<RawDiagnosis>("/patient/diagnoses", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapDiagnosis(data);
}

export async function addSymptomToDiagnosis(
  diagnosisId: string,
  desc: string,
  token: string,
): Promise<MedicalRecord> {
  const data = await authJson<RawDiagnosis>(
    `/patient/diagnoses/${diagnosisId}/symptoms`,
    token,
    { method: "POST", body: JSON.stringify({ desc }) },
  );
  return mapDiagnosis(data);
}
