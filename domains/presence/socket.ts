import { io, type Socket } from "socket.io-client";
import { SOCKET_BASE } from "@/constants/api";
import { on } from "@/utils/eventBus";
import { AUTH_EVENTS } from "@/domains/auth/events";
import type { AuthLogoutPayload } from "@/domains/auth/events";
import type { DoctorPatientAccessStatus, MessageRow } from "@/domains/chat";
import { usePresenceStore } from "./store";
import type { LoggedInUser } from "./types";

let socket: Socket | null = null;

type IncomingMessageHandler = (payload: {
  message: MessageRow;
  peer_id: string;
  peer_name?: string;
  peer_photo_url?: string | null;
  peer_role?: string | null;
}) => void;

let onMessageNew: IncomingMessageHandler | null = null;
let onMessageDeletedHandler:
  | ((payload: { message_id: string; peer_id: string }) => void)
  | null = null;
let onMessageUpdatedHandler:
  | ((payload: { message: MessageRow; peer_id: string }) => void)
  | null = null;
let onTypingHandler: ((payload: { peer_id: string }) => void) | null = null;
let onStopTypingHandler: ((payload: { peer_id: string }) => void) | null = null;
let onAccessUpdatedHandler:
  | ((payload: { status: DoctorPatientAccessStatus; peer_id: string }) => void)
  | null = null;
let onMessageEmotionUpdatedHandler:
  | ((payload: {
      message_id: string;
      message_source: "chat" | "ai";
      emotions: Array<{ user_id: string; emotion: import("@/domains/emotions/types").MessageEmotionType }>;
    }) => void)
  | null = null;
let onDoctorRegisteredHandler:
  | ((payload: import("@/domains/home/api").SpecialityDoctorRow) => void)
  | null = null;

export function onChatMessageNew(handler: IncomingMessageHandler | null) {
  onMessageNew = handler;
}

export function onChatMessageDeleted(
  handler: ((payload: { message_id: string; peer_id: string }) => void) | null,
) {
  onMessageDeletedHandler = handler;
}

export function onChatMessageUpdated(
  handler: ((payload: { message: MessageRow; peer_id: string }) => void) | null,
) {
  onMessageUpdatedHandler = handler;
}

export function onChatTyping(handler: ((payload: { peer_id: string }) => void) | null) {
  onTypingHandler = handler;
}

export function onChatStopTyping(handler: ((payload: { peer_id: string }) => void) | null) {
  onStopTypingHandler = handler;
}

export function onChatAccessUpdated(
  handler: ((payload: { status: DoctorPatientAccessStatus; peer_id: string }) => void) | null,
) {
  onAccessUpdatedHandler = handler;
}

export function onMessageEmotionUpdated(
  handler:
    | ((payload: {
        message_id: string;
        message_source: "chat" | "ai";
        emotions: Array<{ user_id: string; emotion: import("@/domains/emotions/types").MessageEmotionType }>;
      }) => void)
    | null,
) {
  onMessageEmotionUpdatedHandler = handler;
}

export function onDoctorRegistered(
  handler: ((payload: import("@/domains/home/api").SpecialityDoctorRow) => void) | null,
) {
  onDoctorRegisteredHandler = handler;
}

export function emitChatTyping(recipientId: string, userId: string) {
  socket?.emit("chat:typing", { recipient_id: recipientId, user_id: userId });
}

export function emitChatStopTyping(recipientId: string, userId: string) {
  socket?.emit("chat:stopTyping", { recipient_id: recipientId, user_id: userId });
}

export function getPresenceSocket() {
  return socket;
}

function bindListeners(client: Socket) {
  client.on("newlogin", (user: LoggedInUser) => {
    if (user?.id) usePresenceStore.getState().addUser(user);
  });

  client.on("newlogout", (user: LoggedInUser) => {
    if (user?.id) usePresenceStore.getState().removeUser(user.id);
  });

  client.on("loggedIn:users", (users: LoggedInUser[]) => {
    if (Array.isArray(users)) usePresenceStore.getState().setUsers(users);
  });

  client.on("presence:sync", (payload: { users?: LoggedInUser[] }) => {
    if (Array.isArray(payload?.users)) {
      usePresenceStore.getState().setUsers(payload.users);
    }
  });

  client.on(
    "message:new",
    (payload: {
      message: MessageRow;
      peer_id: string;
      peer_name?: string;
      peer_photo_url?: string | null;
      peer_role?: string | null;
    }) => {
      onMessageNew?.(payload);
    },
  );

  client.on("message:deleted", (payload: { message_id: string; peer_id: string }) => {
    if (payload?.message_id && payload?.peer_id) onMessageDeletedHandler?.(payload);
  });

  client.on("message:updated", (payload: { message: MessageRow; peer_id: string }) => {
    if (payload?.message?.id && payload?.peer_id) onMessageUpdatedHandler?.(payload);
  });

  client.on("chat:typing", (payload: { peer_id: string }) => {
    if (payload?.peer_id) onTypingHandler?.(payload);
  });

  client.on("chat:stopTyping", (payload: { peer_id: string }) => {
    if (payload?.peer_id) onStopTypingHandler?.(payload);
  });

  client.on("access:updated", (payload: { status: DoctorPatientAccessStatus; peer_id: string }) => {
    if (payload?.status && payload?.peer_id) onAccessUpdatedHandler?.(payload);
  });

  client.on(
    "message:emotion:updated",
    (payload: {
      message_id?: string;
      message_source?: "chat" | "ai";
      emotions?: Array<{ user_id: string; emotion: import("@/domains/emotions/types").MessageEmotionType }>;
    }) => {
      if (payload?.message_id && payload?.message_source && Array.isArray(payload.emotions)) {
        onMessageEmotionUpdatedHandler?.({
          message_id: payload.message_id,
          message_source: payload.message_source,
          emotions: payload.emotions,
        });
      }
    },
  );

  client.on("doctor:registered", (payload: import("@/domains/home/api").SpecialityDoctorRow) => {
    if (payload?.id && payload?.doctor_id && payload?.speciality_id) {
      onDoctorRegisteredHandler?.(payload);
    }
  });
}

/** Re-register presence on an existing socket (e.g. doctor returns to a browser tab). */
export function announcePresenceLogin(user: LoggedInUser, accessToken?: string) {
  if (!socket?.connected) {
    connectPresenceSocket(user, accessToken);
    return;
  }
  socket.emit("user:loggedIn", user);
  socket.emit("get:loggedIn:users");
}

/** Mark user offline without tearing down the socket (web tab hidden). */
export function announcePresenceLogout(userId: string) {
  if (socket?.connected) {
    socket.emit("user:loggedOut", { id: userId });
  }
}

export function connectPresenceSocket(user: LoggedInUser, accessToken?: string) {
  if (socket?.connected) {
    announcePresenceLogin(user, accessToken);
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_BASE, {
    transports: ["websocket", "polling"],
    autoConnect: true,
    auth: accessToken ? { token: accessToken } : undefined,
  });

  bindListeners(socket);

  socket.on("connect", () => {
    socket?.emit("user:loggedIn", user);
    socket?.emit("get:loggedIn:users");
  });

  socket.on("reconnect", () => {
    socket?.emit("user:loggedIn", user);
    socket?.emit("get:loggedIn:users");
  });

  return socket;
}

export function disconnectPresenceSocket(userId?: string) {
  if (!socket) return;

  if (userId && socket.connected) {
    socket.emit("user:loggedOut", { id: userId });
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  usePresenceStore.getState().clear();
}

// Cross-domain subscription: disconnect on logout
on<AuthLogoutPayload>(AUTH_EVENTS.LOGOUT, ({ userId }) => {
  disconnectPresenceSocket(userId);
});
