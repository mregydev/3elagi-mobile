import { API_BASE } from "@/constants/api";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface AdminDoctorRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  photo_url?: string | null;
  graduation_cert_url?: string | null;
  work_permit_url?: string | null;
  digital_signature_url?: string | null;
  approval_status: ApprovalStatus;
  created_at: string;
  speciality?: { id: string; name_en: string; name_ar: string } | null;
}

export interface AdminRagSourceRow {
  id: string;
  kind: "text" | "document";
  title: string;
  file_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  created_at: string;
  preview?: string;
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

export async function fetchAdminDoctors(token: string): Promise<AdminDoctorRow[]> {
  const data = await authJson<AdminDoctorRow[]>("/admin/doctors", token);
  return Array.isArray(data) ? data : [];
}

export interface AdminPatientRow {
  user_id: string;
  name: string;
  phone?: string | null;
  country?: string | null;
  photo_url?: string | null;
}

export async function fetchAdminPatients(
  token: string,
): Promise<AdminPatientRow[]> {
  const data = await authJson<AdminPatientRow[]>("/admin/patients", token);
  return Array.isArray(data) ? data : [];
}

export async function setDoctorApproval(
  token: string,
  doctorId: string,
  status: ApprovalStatus,
): Promise<void> {
  await authJson(`/admin/doctors/${doctorId}/approval`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteDoctor(token: string, doctorId: string): Promise<void> {
  await authJson(`/admin/doctors/${doctorId}`, token, {
    method: "DELETE",
  });
}

export async function fetchAdminRagSources(token: string): Promise<AdminRagSourceRow[]> {
  const data = await authJson<AdminRagSourceRow[]>("/admin/rag-sources", token);
  return Array.isArray(data) ? data : [];
}

export async function createAdminRagText(
  token: string,
  payload: { title?: string; content: string },
): Promise<AdminRagSourceRow> {
  return authJson<AdminRagSourceRow>("/admin/rag-sources/text", token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

const RAG_CHUNK_SIZE = 2 * 1024 * 1024;

async function uploadRagChunks(
  token: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const totalChunks = Math.max(1, Math.ceil(file.size / RAG_CHUNK_SIZE));

  const initRes = await fetch(`${API_BASE}/uploads/chunk/init`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      total_size: file.size,
      total_chunks: totalChunks,
    }),
  });
  const initData = await initRes.json().catch(() => ({}));
  if (!initRes.ok) {
    throw new Error(
      (Array.isArray(initData?.message) ? initData.message.join(", ") : initData?.message) ??
        initData?.error ??
        `Upload init failed (${initRes.status})`,
    );
  }

  const uploadId = initData.upload_id as string;
  if (!uploadId) {
    throw new Error("Upload session was not created");
  }

  let uploadedBytes = 0;
  onProgress?.(0);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const start = chunkIndex * RAG_CHUNK_SIZE;
    const end = Math.min(start + RAG_CHUNK_SIZE, file.size);
    const blob = file.slice(start, end);

    const formData = new FormData();
    formData.append("upload_id", uploadId);
    formData.append("chunk_index", String(chunkIndex));
    formData.append("chunk", blob, `${file.name}.part${chunkIndex}`);

    const chunkRes = await fetch(`${API_BASE}/uploads/chunk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const chunkData = await chunkRes.json().catch(() => ({}));
    if (!chunkRes.ok) {
      throw new Error(
        (Array.isArray(chunkData?.message) ? chunkData.message.join(", ") : chunkData?.message) ??
          chunkData?.error ??
          `Chunk upload failed (${chunkRes.status})`,
      );
    }

    uploadedBytes += end - start;
    onProgress?.(Math.min(100, Math.round((uploadedBytes / file.size) * 100)));
  }

  return uploadId;
}

/** Train RAG from a PDF/DOCX without storing the file. */
export async function trainAdminRagDocument(
  token: string,
  file: File,
  options?: {
    title?: string;
    onProgress?: (progress: { phase: "uploading" | "processing"; percent: number }) => void;
  },
): Promise<AdminRagSourceRow> {
  const title = options?.title;
  const onProgress = options?.onProgress;
  const useChunks = file.size > RAG_CHUNK_SIZE;

  if (!useChunks) {
    onProgress?.({ phase: "uploading", percent: 0 });
    const formData = new FormData();
    formData.append("file", file, file.name);
    if (title?.trim()) {
      formData.append("title", title.trim());
    }

    const res = await fetch(`${API_BASE}/admin/rag-sources/document/train`, {
      method: "PUT",
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
          `Training failed (${res.status})`,
      );
    }
    onProgress?.({ phase: "uploading", percent: 100 });
    return data as AdminRagSourceRow;
  }

  const uploadId = await uploadRagChunks(token, file, (percent) => {
    onProgress?.({ phase: "uploading", percent });
  });

  onProgress?.({ phase: "processing", percent: 100 });
  return authJson<AdminRagSourceRow>("/admin/rag-sources/document/train-chunk", token, {
    method: "PUT",
    body: JSON.stringify({
      upload_id: uploadId,
      title: title?.trim() || undefined,
      file_name: file.name,
      mime_type: file.type || undefined,
    }),
  });
}

export async function deleteAdminRagSource(
  token: string,
  id: string,
): Promise<void> {
  await authJson(`/admin/rag-sources/${id}`, token, {
    method: "DELETE",
  });
}

export interface AdminSpecialityRow {
  id: string;
  name_en: string;
  name_ar: string;
  image_url: string;
  visible_eg: boolean;
  visible_jo: boolean;
}

export async function fetchAdminSpecialities(
  token: string,
): Promise<AdminSpecialityRow[]> {
  const data = await authJson<AdminSpecialityRow[]>("/admin/specialities", token);
  return Array.isArray(data) ? data : [];
}

export async function updateSpecialityVisibility(
  token: string,
  specialityId: string,
  patch: { visible_eg?: boolean; visible_jo?: boolean },
): Promise<AdminSpecialityRow> {
  return authJson<AdminSpecialityRow>(
    `/admin/specialities/${specialityId}/visibility`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    },
  );
}

export type AdminPointMarket = "EG" | "JO" | "INTL";

export interface AdminPointPricingRow {
  market: AdminPointMarket;
  currency: "EGP" | "JOD" | "USD";
  pricePerPoint: number;
}

export async function fetchAdminPointPricing(
  token: string,
): Promise<AdminPointPricingRow[]> {
  const data = await authJson<AdminPointPricingRow[]>("/admin/point-pricing", token);
  return Array.isArray(data) ? data : [];
}

export async function updatePointPrice(
  token: string,
  market: AdminPointMarket,
  pricePerPoint: number,
): Promise<AdminPointPricingRow> {
  return authJson<AdminPointPricingRow>(`/admin/point-pricing/${market}`, token, {
    method: "PATCH",
    body: JSON.stringify({ price_per_point: pricePerPoint }),
  });
}
