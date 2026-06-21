import { API_BASE } from "@/constants/api";

export type AccessActionType =
  | "grant_records"
  | "revoke_records"
  | "patient_block"
  | "doctor_block"
  | "patient_unblock"
  | "doctor_unblock";

export interface DoctorPatientAccessStatus {
  patient_user_id: string;
  doctor_id: string;
  doctor_user_id: string;
  records_allowed: boolean;
  blocked_by_patient: boolean;
  blocked_by_doctor: boolean;
  is_blocked: boolean;
  records_allowed_at: string | null;
}

export async function fetchDoctorPatientAccess(
  token: string,
  peerId: string,
): Promise<DoctorPatientAccessStatus> {
  const res = await fetch(`${API_BASE}/doctor-patient-access/with/${peerId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as DoctorPatientAccessStatus & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message ?? `Failed to load access status (${res.status})`);
  }
  return data;
}

export function canDoctorViewPatientRecords(
  status: DoctorPatientAccessStatus | null | undefined,
): boolean {
  return !!status?.records_allowed && !status?.is_blocked;
}

export function doctorAccessDeniedMessage(isRTL: boolean): string {
  return isRTL
    ? "المريض لم يمنحك صلاحية عرض السجل الطبي بعد. اطلب من المريض منح الصلاحية من المحادثة."
    : "The patient has not granted permission to view medical records yet. Ask them to grant access in chat.";
}

export function isDoctorAccessDeniedError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("permission") ||
    lower.includes("granted") ||
    lower.includes("blocked") ||
    lower.includes("403")
  );
}

export function accessActionLabel(action: AccessActionType, isRTL: boolean): string {
  const labels: Record<AccessActionType, { en: string; ar: string }> = {
    grant_records: {
      en: "Granted access to medical records",
      ar: "تم منح صلاحية الوصول للسجل الطبي",
    },
    revoke_records: {
      en: "Revoked access to medical records",
      ar: "تم إلغاء صلاحية الوصول للسجل الطبي",
    },
    patient_block: {
      en: "Patient blocked this chat",
      ar: "قام المريض بحظر هذه المحادثة",
    },
    doctor_block: {
      en: "Doctor blocked this chat",
      ar: "قام الطبيب بحظر هذه المحادثة",
    },
    patient_unblock: {
      en: "Patient unblocked this chat",
      ar: "أزال المريض الحظر عن هذه المحادثة",
    },
    doctor_unblock: {
      en: "Doctor unblocked this chat",
      ar: "أزال الطبيب الحظر عن هذه المحادثة",
    },
  };
  return isRTL ? labels[action].ar : labels[action].en;
}
