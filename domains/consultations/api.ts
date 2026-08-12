import { API_BASE } from "@/constants/api";
import type { ConsultationCancelReasonType } from "@/domains/chat/types";

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: "pending" | "open" | "ended" | "cancelled" | "rejected";
  description: string;
  reserved_points: number;
  doctor_note: string | null;
  diagnosis_id: string | null;
  cancel_reason_type: ConsultationCancelReasonType | null;
  cancel_reason: string | null;
}

export interface PointsSummary {
  message_points: number;
  points_reserved: number;
  points_spent_total: number;
  points_purchased_total: number;
  points_reimbursed_total?: number;
}

export type ComplaintStatus = "pending" | "accepted" | "rejected";

export interface DoctorConsultation extends Consultation {
  patient_name: string;
  created_at: string;
  closed_at: string | null;
  complaint_status: ComplaintStatus | null;
}

export interface PatientConsultation extends Consultation {
  doctor_name: string;
  created_at: string;
  closed_at: string | null;
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
      (Array.isArray((data as { message?: string[] })?.message)
        ? ((data as { message: string[] }).message).join(", ")
        : (data as { message?: string })?.message) ??
        `Request failed (${res.status})`,
    );
  }
  return data as T;
}

export async function fetchActiveConsultation(
  peerId: string,
  token: string,
): Promise<Consultation | null> {
  return authJson<Consultation | null>(
    `/consultations/active?peer_id=${encodeURIComponent(peerId)}`,
    token,
  );
}

export async function fetchMyConsultations(
  token: string,
): Promise<DoctorConsultation[]> {
  const list = await authJson<DoctorConsultation[]>(`/consultations/mine`, token);
  return Array.isArray(list) ? list : [];
}

export async function fetchPatientConsultations(
  token: string,
): Promise<PatientConsultation[]> {
  const list = await authJson<PatientConsultation[]>(`/consultations/mine`, token);
  return Array.isArray(list) ? list : [];
}

export async function startConsultation(
  doctorId: string,
  description: string,
  token: string,
): Promise<{ consultation: Consultation; points: PointsSummary }> {
  return authJson(`/consultations/start`, token, {
    method: "POST",
    body: JSON.stringify({ doctor_id: doctorId, description }),
  });
}

/** Doctor answers a pending request. */
export async function acceptConsultation(
  consultationId: string,
  token: string,
): Promise<{ consultation: Consultation }> {
  return authJson(`/consultations/${consultationId}/accept`, token, {
    method: "POST",
  });
}

export async function rejectConsultation(
  consultationId: string,
  token: string,
  reason?: string,
): Promise<{ consultation: Consultation }> {
  return authJson(`/consultations/${consultationId}/reject`, token, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function endConsultation(
  consultationId: string,
  payload: {
    note?: string;
    /** @deprecated use diagnosis_details */
    diagnosis?: string;
    diagnosis_details?: {
      desc: string;
      body_part?: string | null;
      symptoms?: { desc: string }[];
      document_ids?: string[];
      prescription_id?: string;
      prescription?: {
        title: string;
        symptoms?: string;
        medications: {
          medication_name: string;
          dose?: string;
          interval?: string;
          notes?: string;
        }[];
        body_part?: string | null;
      };
      intake_exam_assignment_id?: string;
      intake_exam?: {
        intake_test_id: string;
        deadline_at: string;
        recurrence_type?: "none" | "daily" | "weekly" | "monthly" | "yearly";
        recurrence_interval?: number;
      };
    };
  },
  token: string,
): Promise<{ consultation: Consultation }> {
  return authJson(`/consultations/${consultationId}/end`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelConsultation(
  consultationId: string,
  payload: { reason_type: ConsultationCancelReasonType; reason?: string },
  token: string,
): Promise<{ consultation: Consultation }> {
  return authJson(`/consultations/${consultationId}/cancel`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
