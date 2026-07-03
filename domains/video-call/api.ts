import { API_BASE } from "@/constants/api";

export type VideoCallStatus =
  | "ringing"
  | "accepted"
  | "ended"
  | "declined"
  | "missed";

export interface VideoCallSession {
  id: string;
  roomUrl: string;
  status: VideoCallStatus;
  patientUserId: string;
  doctorUserId: string;
  patientName: string;
  doctorName: string;
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
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ??
      data?.error ??
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export async function initiateVideoCall(
  token: string,
  doctorUserId: string,
): Promise<VideoCallSession> {
  return authJson<VideoCallSession>("/video-calls", token, {
    method: "POST",
    body: JSON.stringify({ doctor_user_id: doctorUserId }),
  });
}

export async function fetchVideoCallSession(
  token: string,
  sessionId: string,
): Promise<VideoCallSession> {
  return authJson<VideoCallSession>(`/video-calls/${sessionId}`, token);
}

export async function acceptVideoCall(
  token: string,
  sessionId: string,
): Promise<VideoCallSession> {
  return authJson<VideoCallSession>(`/video-calls/${sessionId}/accept`, token, {
    method: "POST",
  });
}

export async function declineVideoCall(
  token: string,
  sessionId: string,
): Promise<VideoCallSession> {
  return authJson<VideoCallSession>(`/video-calls/${sessionId}/decline`, token, {
    method: "POST",
  });
}

export async function endVideoCall(
  token: string,
  sessionId: string,
): Promise<VideoCallSession> {
  return authJson<VideoCallSession>(`/video-calls/${sessionId}/end`, token, {
    method: "POST",
  });
}

export function toWherebyEmbedUrl(roomUrl: string, displayName: string): string {
  const url = new URL(roomUrl);
  url.searchParams.set("embed", "");
  const name = displayName.trim();
  if (name) {
    url.searchParams.set("displayName", name);
  }
  url.searchParams.set("precallReview", "off");
  return url.toString();
}
