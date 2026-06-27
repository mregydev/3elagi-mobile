export type PushNotificationType = "chat" | "ai";

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

export type PushNotificationData = ChatPushData | AiPushData;

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
