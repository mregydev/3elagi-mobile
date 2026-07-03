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
): Promise<{ objectPath: string; url: string }> {
  return uploadFile(
    `blob:${file.name}`,
    file.type || "application/octet-stream",
    file.name,
    token,
    file,
  );
}
