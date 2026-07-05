import { API_BASE } from "@/constants/api";
import { uploadFile } from "@/domains/medical/api";

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

export async function createAdminRagDocument(
  token: string,
  payload: {
    title?: string;
    file_url: string;
    file_name: string;
    mime_type?: string;
  },
): Promise<AdminRagSourceRow> {
  return authJson<AdminRagSourceRow>("/admin/rag-sources/document", token, {
    method: "PUT",
    body: JSON.stringify(payload),
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

export async function uploadAdminRagFile(
  token: string,
  file: File,
  onProgress?: (progress: { phase: "uploading" | "processing"; percent: number }) => void,
): Promise<{ objectPath: string; url: string }> {
  const CHUNK_SIZE = 2 * 1024 * 1024;
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

  if (file.size <= CHUNK_SIZE) {
    onProgress?.({ phase: "uploading", percent: 0 });
    const result = await uploadFile(
      `blob:${file.name}`,
      file.type || "application/octet-stream",
      file.name,
      token,
      file,
    );
    onProgress?.({ phase: "uploading", percent: 100 });
    return result;
  }

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
  onProgress?.({ phase: "uploading", percent: 0 });

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
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
    const percent = Math.min(100, Math.round((uploadedBytes / file.size) * 100));
    onProgress?.({ phase: "uploading", percent });
  }

  const completeRes = await fetch(`${API_BASE}/uploads/chunk/complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ upload_id: uploadId }),
  });
  const completeData = await completeRes.json().catch(() => ({}));
  if (!completeRes.ok) {
    throw new Error(
      (Array.isArray(completeData?.message)
        ? completeData.message.join(", ")
        : completeData?.message) ??
        completeData?.error ??
        `Upload finalize failed (${completeRes.status})`,
    );
  }

  onProgress?.({ phase: "uploading", percent: 100 });
  return completeData as { objectPath: string; url: string };
}
