import { API_BASE } from "@/constants/api";
import type { MessageRow } from "@/domains/chat/api";
import type { AppointmentActionMeta } from "@/domains/chat/types";

export interface UpcomingAppointment {
  id: string;
  date: string;
  time: string | null;
  status: string;
  meeting_link: string | null;
  other_name: string;
  /** Counterpart's user id (patient for a doctor, doctor for a patient). */
  other_user_id: string | null;
  booked_via_app: boolean;
}

export async function fetchMyAppointments(
  token: string,
): Promise<UpcomingAppointment[]> {
  const res = await fetch(`${API_BASE}/appointments/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to load appointments (${res.status})`);
  return res.json();
}

export async function cancelAppointment(
  token: string,
  appointmentId: string,
): Promise<MessageRow> {
  const res = await fetch(`${API_BASE}/appointments/${appointmentId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = (await res.json().catch(() => ({}))) as MessageRow & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Failed to cancel appointment (${res.status})`);
  }
  return data;
}

export interface ChatBookResult {
  appointment: { id: string; status: string; date: string; time: string | null };
  message: MessageRow;
}

export async function bookChatAppointment(
  token: string,
  doctorUserId: string,
  date: string,
  time: string,
): Promise<ChatBookResult> {
  const res = await fetch(`${API_BASE}/appointments/chat-book`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      doctor_user_id: doctorUserId,
      date,
      time,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as ChatBookResult & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message ?? `Failed to book appointment (${res.status})`);
  }
  return data;
}

export async function sendAppointmentAction(
  token: string,
  recipientId: string,
  meta: AppointmentActionMeta,
): Promise<MessageRow> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient_id: recipientId,
      type: "appointment_action",
      attachment_meta: meta,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as MessageRow & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Failed to update appointment (${res.status})`);
  }
  return data;
}
