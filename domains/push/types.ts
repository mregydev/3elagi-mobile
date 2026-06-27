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
  }
  return "";
}

export function parsePushNotificationData(
  data: Record<string, unknown> | undefined,
): PushNotificationData | null {
  if (!data) return null;

  const type = data.type;
  const chatId = readString(data, "chatId", "chat_id", "threadId", "thread_id");
  const messageId = readString(data, "messageId", "message_id");
  if (!chatId) return null;

  if (type === "chat") {
    const senderId = readString(data, "senderId", "sender_id");
    if (!senderId) return null;
    return { type: "chat", chatId, messageId, senderId };
  }

  if (type === "ai") {
    return { type: "ai", chatId, messageId };
  }

  return null;
}
