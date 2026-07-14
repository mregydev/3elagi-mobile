import { Platform } from "react-native";
import { API_BASE } from "@/constants/api";
import type { Locale } from "@/domains/i18n/store";
import type { DiagnosisSymptom, MedicalAiInsight, MedicalRecord, PrescriptionMedication } from "./types";
import { parseBodyPart } from "./bodyParts";
import { fetchIntakeExamsForPatient } from "@/domains/intake-exams/api";

function mapAiInsight(raw: unknown): MedicalAiInsight | null | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const source = raw as Record<string, unknown>;
  const description = String(source.description ?? "").trim();
  const possible_diseases = String(
    source.possible_diseases ?? source.possibleDiseases ?? "",
  ).trim();
  if (!description && !possible_diseases) return undefined;
  return { description, possible_diseases };
}

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
  ai_insight?: MedicalAiInsight | null;
  body_part?: string | null;
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
    aiInsight: mapAiInsight(raw.ai_insight) ?? null,
    bodyPart: parseBodyPart(raw.body_part),
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
  ai_insight?: MedicalAiInsight | null;
  body_part?: string | null;
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
  linked_diagnoses?: Array<{ id: string; desc: string }>;
  ai_insight?: MedicalAiInsight | null;
  body_part?: string | null;
}

function mapLinkedDiagnoses(
  raw: Array<{ id: string; desc: string }> | undefined,
): import("./types").LinkedDiagnosisSummary[] {
  return (raw ?? []).map((item) => ({ id: item.id, title: item.desc }));
}

function mapDocument(doc: RawDocument): MedicalRecord {
  const linkedDiagnoses = mapLinkedDiagnoses(doc.linked_diagnoses);
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
    linkedDiagnoses,
    diagnosisId: linkedDiagnoses[0]?.id ?? doc.diagnosis_id ?? null,
    aiInsight: mapAiInsight(doc.ai_insight) ?? null,
    bodyPart: parseBodyPart(doc.body_part),
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
    aiInsight: mapAiInsight(d.ai_insight) ?? null,
    bodyPart: parseBodyPart(d.body_part),
  };
}

async function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  uri: string,
  mimeType: string,
  fileName: string,
  webFile?: File | Blob,
): Promise<void> {
  if (Platform.OS === "web") {
    let body: Blob | File | null = webFile ?? null;
    if (!body && (uri.startsWith("blob:") || uri.startsWith("data:"))) {
      const response = await fetch(uri);
      body = await response.blob();
    }
    if (!body) {
      throw new Error("Could not read the selected file on web.");
    }
    const resolvedType =
      mimeType ||
      (body instanceof File ? body.type : body.type) ||
      "application/octet-stream";
    const payload =
      body instanceof File && body.type === resolvedType
        ? body
        : new File([body], fileName, { type: resolvedType });
    formData.append(fieldName, payload, fileName);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData.append(fieldName, { uri, name: fileName, type: mimeType } as any);
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
  webFile?: File | Blob,
): Promise<{ objectPath: string; url: string }> {
  const formData = new FormData();
  await appendFileToFormData(formData, "file", uri, mimeType, fileName, webFile);

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

/**
 * Resolve a document/prescription by id for a doctor when the URL carries no
 * patient context (a bare /medical/{id} link). The deployed backend has no
 * doctor-scoped "record by id" endpoint, so we scan the doctor's patients'
 * lists (existing endpoints) and match the id.
 * ponytail: O(patients) fan-out; only runs on cold bare-URL loads, not in-app
 * navigation (which passes patientUserId). Add a by-id endpoint if this gets hot.
 */
export async function findDoctorRecordById(
  id: string,
  token: string,
): Promise<MedicalRecord | null> {
  const patients = await fetchDoctorPatients(token).catch(() => []);
  const lists = await Promise.all(
    patients.map((p) =>
      Promise.all([
        fetchDocumentsForPatientUser(p.user_id, token),
        fetchPrescriptionsForPatientUser(p.user_id, token),
      ]).then(([docs, rx]) => [...docs, ...rx]),
    ),
  );
  for (const list of lists) {
    const hit = list.find((r) => r.id === id);
    if (hit) return hit;
  }
  return null;
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
  lang: Locale = "en",
  webFile?: File | Blob,
): Promise<PrescriptionMedication[]> {
  const formData = new FormData();
  await appendFileToFormData(formData, "file", uri, mimeType, fileName, webFile);
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
    body_part?: string | null;
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
      body_part: payload.body_part ?? null,
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
    const [documents, diagnoses, prescriptions, intakeExams] = await Promise.all([
      fetchDocumentsForPatientUser(patientId, token),
      fetchDiagnosesForPatientUser(patientId, token).catch(() => [] as MedicalRecord[]),
      fetchPrescriptionsForPatientUser(patientId, token),
      fetchIntakeExamsForPatient(patientId, token).catch(() => [] as MedicalRecord[]),
    ]);
    return [...diagnoses, ...prescriptions, ...documents, ...intakeExams];
  }
  const [documents, diagnoses, prescriptions, intakeExams] = await Promise.all([
    fetchPatientDocuments(patientId, token),
    fetchPatientDiagnoses(token).catch(() => [] as MedicalRecord[]),
    fetchPrescriptionsForPatientUser(patientId, token),
    fetchIntakeExamsForPatient(patientId, token).catch(() => [] as MedicalRecord[]),
  ]);
  return [...diagnoses, ...prescriptions, ...documents, ...intakeExams];
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
    patient_user_id?: string;
    body_part?: string | null;
    ai_insight?: MedicalAiInsight;
    generate_ai_insight?: boolean;
    lang?: Locale;
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
    body_part?: string | null;
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
    body_part?: string | null;
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

export interface AnalyzedMedicalRecordImage {
  type: "lab" | "xray";
  title: string;
  notes: string;
  ai_insight: MedicalAiInsight;
}

export async function analyzeMedicalRecordImage(
  uri: string,
  mimeType: string,
  fileName: string,
  token: string,
  lang: Locale,
  webFile?: File | Blob,
): Promise<AnalyzedMedicalRecordImage> {
  const formData = new FormData();
  await appendFileToFormData(formData, "file", uri, mimeType, fileName, webFile);
  const res = await fetch(
    `${API_BASE}/patient/medical-documents/analyze-image?lang=${lang}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ??
        `Analyze failed (${res.status})`,
    );
  }
  return data as AnalyzedMedicalRecordImage;
}

export async function createMedicalRecordFromImage(
  uri: string,
  mimeType: string,
  fileName: string,
  token: string,
  lang: Locale,
  webFile?: File | Blob,
  options?: { generateInsight?: boolean },
): Promise<MedicalRecord> {
  const formData = new FormData();
  await appendFileToFormData(formData, "file", uri, mimeType, fileName, webFile);
  const insightParam =
    options?.generateInsight === false ? "&generate_insight=false" : "";
  const res = await fetch(
    `${API_BASE}/patient/medical-documents/from-image?lang=${lang}${insightParam}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ??
        `Create failed (${res.status})`,
    );
  }
  return mapDocument(data as RawDocument);
}

export async function updatePatientMedicalDocument(
  id: string,
  payload: { title?: string; notes?: string },
  token: string,
): Promise<MedicalRecord> {
  const data = await authJson<RawDocument>(
    `/patient/medical-documents/${id}/update`,
    token,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return mapDocument(data);
}

export async function generateMedicalRecordDetails(
  record: MedicalRecord,
  token: string,
  lang: Locale,
): Promise<MedicalRecord> {
  if (record.category !== "lab" && record.category !== "xray") {
    throw new Error("AI details are only supported for lab and imaging records");
  }
  const data = await authJson<RawDocument>(
    `/patient/medical-documents/${record.id}/generate-details?lang=${lang}`,
    token,
    { method: "POST" },
  );
  return mapDocument(data);
}

export async function createMedicalRecordFromChatImage(
  input: {
    uri: string;
    mimeType: string;
    fileName: string;
    webFile?: File | Blob;
    caption?: string;
    patientUserId?: string;
    generateInsight: boolean;
  },
  token: string,
  lang: Locale,
): Promise<MedicalRecord> {
  if (input.generateInsight) {
    return createMedicalRecordFromImage(
      input.uri,
      input.mimeType,
      input.fileName,
      token,
      lang,
      input.webFile,
      { generateInsight: true },
    );
  }

  const uploaded = await uploadFile(
    input.uri,
    input.mimeType,
    input.fileName,
    token,
    input.webFile,
  );
  let type: "lab" | "xray" = "lab";
  let title = input.caption?.trim() || "Medical image";
  let notes = input.caption?.trim() || title;

  try {
    const analyzed = await analyzeMedicalRecordImage(
      input.uri,
      input.mimeType,
      input.fileName,
      token,
      lang,
      input.webFile,
    );
    type = analyzed.type;
    title = analyzed.title;
    notes = analyzed.notes;
  } catch {
    // keep caption-based defaults
  }

  return createPatientMedicalDocument(
    {
      type,
      file_url: uploaded.url || uploaded.objectPath,
      file_name: input.fileName,
      title,
      notes,
      patient_user_id: input.patientUserId,
    },
    token,
  );
}

export async function generateMedicalRecordAiInsight(
  record: MedicalRecord,
  token: string,
  lang: Locale,
): Promise<MedicalRecord> {
  if (record.category === "lab" || record.category === "xray") {
    const data = await authJson<RawDocument>(
      `/patient/medical-documents/${record.id}/generate-insight?lang=${lang}`,
      token,
      { method: "POST" },
    );
    return mapDocument(data);
  }
  if (record.category === "diagnosis") {
    const data = await authJson<RawDiagnosis>(
      `/patient/diagnoses/${record.id}/generate-insight?lang=${lang}`,
      token,
      { method: "POST" },
    );
    return mapDiagnosis(data);
  }
  if (record.category === "prescription") {
    const data = await authJson<RawPrescription>(
      `/prescriptions/patient-user/${record.ownerId}/${record.id}/generate-insight?lang=${lang}`,
      token,
      { method: "POST" },
    );
    return mapPrescription(data);
  }
  throw new Error("AI insight is not supported for this record type");
}
