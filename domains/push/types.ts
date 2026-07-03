export type PushNotificationType =
  | "chat"
  | "ai"
  | "incoming_video_call"
  | "appointment_request"
  | "appointment_status"
  | "appointment_reminder";

export type ChatPushData = {
  type: "chat";
  chatId: string;
  messageId: string;
  senderId: string;
};

export type AiPushData = {
  type: "ai";
  chatId: string;
  messageId: string;
};

export type IncomingVideoCallPushData = {
  type: "incoming_video_call";
  sessionId: string;
  callerId?: string;
  callerName?: string;
};

export type AppointmentReminderPushData = {
  type: "appointment_reminder";
  sessionId: string;
  appointmentId?: string;
  meetingLink?: string;
};

export type AppointmentStatusPushData = {
  type: "appointment_status";
  appointmentId?: string;
  action?: "confirm" | "reject" | "cancel";
};

export type PushNotificationData =
  | ChatPushData
  | AiPushData
  | IncomingVideoCallPushData
  | AppointmentReminderPushData
  | AppointmentStatusPushData;

function readString(
  data: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

/** Normalize Expo notification `data` — Android may nest or stringify payloads. */
export function extractPushNotificationData(
  raw: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!raw) return undefined;

  if (typeof raw.body === "string") {
    try {
      const nested = JSON.parse(raw.body) as Record<string, unknown>;
      if (nested && typeof nested === "object") {
        return { ...nested, ...raw };
      }
    } catch {
      // ignore
    }
  }

  return raw;
}

export function parsePushNotificationData(
  raw: Record<string, unknown> | undefined,
): PushNotificationData | null {
  const data = extractPushNotificationData(raw);
  if (!data) return null;

  const type = readString(data, "type");

  if (type === "incoming_video_call") {
    const sessionId = readString(data, "sessionId", "session_id");
    if (!sessionId) return null;
    return {
      type: "incoming_video_call",
      sessionId,
      callerId: readString(data, "callerId", "caller_id") || undefined,
      callerName: readString(data, "callerName", "caller_name") || undefined,
    };
  }

  if (type === "appointment_reminder") {
    const sessionId = readString(data, "sessionId", "session_id");
    const meetingLink = readString(data, "meetingLink", "meeting_link") || undefined;
    if (!sessionId && !meetingLink) return null;
    return {
      type: "appointment_reminder",
      sessionId: sessionId || "direct",
      appointmentId: readString(data, "appointmentId", "appointment_id") || undefined,
      meetingLink,
    };
  }

  if (type === "appointment_status") {
    return {
      type: "appointment_status",
      appointmentId: readString(data, "appointmentId", "appointment_id") || undefined,
      action: (readString(data, "action") as "confirm" | "reject" | "cancel") || undefined,
    };
  }

  const chatId = readString(data, "chatId", "chat_id", "threadId", "thread_id");
  const messageId = readString(data, "messageId", "message_id");
  if (!chatId) return null;

  const senderId = readString(data, "senderId", "sender_id") || chatId;

  if (type === "ai") {
    return { type: "ai", chatId, messageId };
  }

  if (type === "chat" || senderId) {
    return { type: "chat", chatId, messageId, senderId };
  }

  return null;
}
