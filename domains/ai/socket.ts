import type { AiConversation, AiStreamEvent } from "./types";
import { getPresenceSocket } from "@/domains/presence";

export function requestAiHistory(): Promise<AiConversation[]> {
  const socket = getPresenceSocket();
  if (!socket?.connected) {
    return Promise.reject(new Error("Not connected to server"));
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("History request timed out"));
    }, 30_000);

    const onHistory = (payload: { conversations?: AiConversation[] }) => {
      cleanup();
      resolve(payload.conversations ?? []);
    };
    const onError = (payload: { error?: string }) => {
      cleanup();
      reject(new Error(payload.error ?? "Could not load history"));
    };

    const cleanup = () => {
      clearTimeout(timer);
      socket.off("ai:chat:history", onHistory);
      socket.off("ai:message:error", onError);
    };

    socket.on("ai:chat:history", onHistory);
    socket.on("ai:message:error", onError);
    socket.emit("ai:chat:history");
  });
}

export function sendAiMessageViaSocket(
  input: {
    message: string;
    chatId?: string;
    patientUserId?: string;
  },
  onEvent: (event: AiStreamEvent) => void,
): Promise<void> {
  const socket = getPresenceSocket();
  if (!socket?.connected) {
    return Promise.reject(new Error("Not connected to server"));
  }

  return new Promise((resolve, reject) => {
    const onAck = (payload: {
      conversationId?: string;
      userMessageId?: string;
    }) => {
      if (payload.conversationId) {
        onEvent({ type: "ack", conversationId: payload.conversationId });
      }
    };

    const onToken = (payload: { content?: string; chatId?: string }) => {
      onEvent({ type: "token", content: payload.content });
      if (payload.chatId) {
        onEvent({ type: "ack", conversationId: payload.chatId });
      }
    };

    const onDone = (payload: {
      chatId?: string;
      messageId?: string;
      cacheHit?: boolean;
      content?: string;
    }) => {
      cleanup();
      onEvent({
        type: "done",
        conversationId: payload.chatId,
        messageId: payload.messageId,
        cacheHit: payload.cacheHit,
        content: payload.content,
      });
      resolve();
    };

    const onError = (payload: { error?: string; code?: string }) => {
      cleanup();
      const err = payload.error ?? "AI request failed";
      onEvent({ type: "error", error: err, code: payload.code });
      const rejection = new Error(err) as Error & { code?: string };
      rejection.code = payload.code;
      reject(rejection);
    };

    const cleanup = () => {
      socket.off("ai:message:ack", onAck);
      socket.off("ai:message:token", onToken);
      socket.off("ai:message:done", onDone);
      socket.off("ai:message:error", onError);
    };

    socket.on("ai:message:ack", onAck);
    socket.on("ai:message:token", onToken);
    socket.on("ai:message:done", onDone);
    socket.on("ai:message:error", onError);

    socket.emit("ai:message:send", {
      message: input.message,
      chatId: input.chatId,
      patientUserId: input.patientUserId,
    });
  });
}

export function joinAiChat(chatId: string): void {
  getPresenceSocket()?.emit("ai:chat:join", { chatId });
}
