import { create } from "zustand";
import {
  deleteChatMessage,
  editChatMedicalMessage,
  editChatMessage,
  fetchChatContacts,
  fetchConversations,
  fetchContactById,
  fetchMessagesWithPeer,
  mapMessageRow,
  markMessagesRead,
  sendChatMessage,
  type MessageRow,
} from "./api";
import { applyLivePresence } from "./presence";
import { applyPresenceToConversations } from "./presenceConversations";
import { emit, on } from "@/utils/eventBus";
import { CHAT_EVENTS, type ChatMessageReceivedPayload } from "./events";
import { chatMessagePreview, chatNotificationTitle } from "@/utils/chatNotifications";
import { AUTH_EVENTS } from "@/domains/auth/events";
import { chatRepository } from "./repository";
import type { MessageEmotionItem } from "@/domains/emotions";
import type {
  ChatMessage,
  ChatUser,
  Conversation,
  MedicalLinkMeta,
  SendMessageInput,
} from "./types";

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  loading: boolean;
  messagesLoading: Record<string, boolean>;
  error: string | null;
  activeChatPeerId: string | null;
  selfId: string | null;
  peerTyping: Record<string, boolean>;
  loadConversations: (
    token: string | null,
    selfId: string | null,
    selfRole: string | null,
  ) => Promise<void>;
  syncPresence: () => void;
  ensureContacts: (token: string) => Promise<void>;
  ensurePeer: (peerId: string, token: string) => Promise<ChatUser | undefined>;
  resolvePeer: (peerId: string) => ChatUser | undefined;
  loadMessages: (
    peerId: string,
    token: string | null,
    selfId: string | null,
  ) => Promise<void>;
  sendMessage: (
    peerId: string,
    input: SendMessageInput | string,
    token: string | null,
    selfId: string | null,
    selfRole: string | null,
    replaceTempId?: string,
  ) => Promise<void>;
  markRead: (peerId: string, token: string | null) => Promise<void>;
  handleIncomingMessage: (
    payload: { message: MessageRow; peer_id: string; peer_name?: string },
    token: string | null,
    selfId: string | null,
  ) => void;
  handleIncomingMessageDelete: (
    payload: { message_id: string; peer_id: string },
    token: string | null,
    selfId: string | null,
  ) => void;
  removeMessage: (peerId: string, messageId: string) => void;
  deleteMessage: (
    peerId: string,
    messageId: string,
    token: string | null,
    selfId: string | null,
    selfRole: string | null,
  ) => Promise<void>;
  editMessage: (
    peerId: string,
    messageId: string,
    content: string,
    token: string | null,
    selfId: string | null,
    selfRole: string | null,
  ) => Promise<void>;
  editMedicalMessage: (
    peerId: string,
    messageId: string,
    medicalLink: MedicalLinkMeta,
    note: string | undefined,
    recordTitle: string,
    token: string | null,
    selfId: string | null,
    selfRole: string | null,
  ) => Promise<void>;
  handleIncomingMessageUpdate: (
    payload: { message: MessageRow; peer_id: string },
    token: string | null,
    selfId: string | null,
  ) => void;
  setActiveChatPeerId: (peerId: string | null) => void;
  setSelfId: (id: string | null) => void;
  setPeerTyping: (peerId: string, typing: boolean) => void;
  addPendingMessage: (peerId: string, message: ChatMessage) => void;
  resolvePendingMessage: (peerId: string, tempId: string, message: ChatMessage) => void;
  failPendingMessage: (peerId: string, tempId: string) => void;
  getPeer: (conversationId: string) => ChatUser | undefined;
  updateMessageEmotions: (messageId: string, emotions: MessageEmotionItem[]) => void;
  clear: () => void;
}

let baseConversations: Conversation[] = [];

function mergeMessagesById(
  live: ChatMessage[],
  fetched: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const message of fetched) byId.set(message.id, message);
  for (const message of live) {
    if (!byId.has(message.id)) byId.set(message.id, message);
  }
  return Array.from(byId.values()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

function peerFromHint(peerId: string, name?: string): ChatUser {
  const trimmed = name?.trim();
  return {
    id: peerId,
    name: trimmed || "…",
    presence: "offline",
  };
}

function upsertConversation(
  peerId: string,
  user: ChatUser | undefined,
  lastMessage: ChatMessage,
  incrementUnread: boolean,
  nameHint?: string,
) {
  const resolvedUser = user ?? peerFromHint(peerId, nameHint);
  const idx = baseConversations.findIndex((c) => c.id === peerId);
  if (idx >= 0) {
    const existing = baseConversations[idx];
    baseConversations[idx] = {
      ...existing,
      user: user ?? existing.user,
      lastMessage,
      unreadCount: incrementUnread ? existing.unreadCount + 1 : existing.unreadCount,
    };
  } else {
    baseConversations.unshift({
      id: peerId,
      user: resolvedUser,
      lastMessage,
      unreadCount: incrementUnread ? 1 : 0,
    });
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  loading: false,
  messagesLoading: {},
  error: null,
  activeChatPeerId: null,
  selfId: null,
  peerTyping: {},

  setActiveChatPeerId: (peerId) => set({ activeChatPeerId: peerId }),
  setSelfId: (id) => set({ selfId: id }),

  setPeerTyping: (peerId, typing) =>
    set((s) => ({
      peerTyping: typing
        ? { ...s.peerTyping, [peerId]: true }
        : Object.fromEntries(
            Object.entries(s.peerTyping).filter(([id]) => id !== peerId),
          ),
    })),

  addPendingMessage: (peerId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [peerId]: [...(s.messages[peerId] || []), message],
      },
    })),

  resolvePendingMessage: (peerId, tempId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [peerId]: (s.messages[peerId] || []).map((m) =>
          m.id === tempId ? message : m,
        ),
      },
    })),

  failPendingMessage: (peerId, tempId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [peerId]: (s.messages[peerId] || []).map((m) =>
          m.id === tempId ? { ...m, pending: false, failed: true } : m,
        ),
      },
    })),

  loadConversations: async (token, selfId, _selfRole) => {
    if (!token || !selfId) {
      baseConversations = [];
      chatRepository.clearUsers();
      set({
        conversations: [],
        messages: {},
        messagesLoading: {},
        loading: false,
        error: null,
        selfId: null,
      });
      return;
    }

    const switchedUser = get().selfId !== null && get().selfId !== selfId;
    set({
      loading: true,
      error: null,
      selfId,
      ...(switchedUser ? { messages: {}, messagesLoading: {} } : {}),
    });

    try {
      const rows = await fetchConversations(token, selfId);
      baseConversations = rows.map((row) => ({
        id: row.peerId,
        user: row.user,
        lastMessage: row.lastMessage,
        unreadCount: row.unreadCount,
      }));
      chatRepository.cacheUsers(baseConversations.map((c) => c.user));

      const allowedPeerIds = new Set(baseConversations.map((c) => c.id));
      const activePeer = get().activeChatPeerId;
      if (activePeer) allowedPeerIds.add(activePeer);

      set((s) => ({
        conversations: applyPresenceToConversations(baseConversations),
        messages: Object.fromEntries(
          Object.entries(s.messages).filter(([peerId]) => allowedPeerIds.has(peerId)),
        ),
        loading: false,
        error: null,
      }));
    } catch (e) {
      baseConversations = [];
      chatRepository.clearUsers();
      set({
        conversations: [],
        messages: {},
        messagesLoading: {},
        loading: false,
        error: (e as Error).message,
      });
    }
  },

  syncPresence: () => {
    set({ conversations: applyPresenceToConversations(baseConversations) });
    const cached = chatRepository.getAllUsers();
    if (cached.length > 0) {
      chatRepository.cacheUsers(
        cached.map((user) => applyLivePresence(user)),
      );
    }
  },

  ensureContacts: async (token) => {
    const users = await fetchChatContacts(token);
    chatRepository.cacheUsers(users);
  },

  ensurePeer: async (peerId, token) => {
    const existing = get().resolvePeer(peerId);
    if (existing) return existing;
    try {
      const user = await fetchContactById(token, peerId);
      chatRepository.cacheUsers([user]);
      return user;
    } catch {
      return undefined;
    }
  },

  resolvePeer: (peerId) => {
    const fromConversation = get().conversations.find((c) => c.id === peerId)?.user;
    if (fromConversation) return fromConversation;
    const cached = chatRepository.getUser(peerId);
    return cached ? { ...cached, ...applyLivePresence(cached) } : undefined;
  },

  loadMessages: async (peerId, token, selfId) => {
    if (!token || !selfId) {
      set((s) => ({ messages: { ...s.messages, [peerId]: [] } }));
      return;
    }

    set((s) => ({
      messagesLoading: { ...s.messagesLoading, [peerId]: true },
    }));

    try {
      const msgs = await fetchMessagesWithPeer(token, peerId, selfId);
      set((s) => {
        const live = s.messages[peerId] ?? [];
        return {
          messages: {
            ...s.messages,
            [peerId]: mergeMessagesById(live, msgs),
          },
          messagesLoading: { ...s.messagesLoading, [peerId]: false },
        };
      });
    } catch {
      set((s) => ({
        messages: { ...s.messages, [peerId]: [] },
        messagesLoading: { ...s.messagesLoading, [peerId]: false },
      }));
    }
  },

  sendMessage: async (peerId, input, token, selfId, selfRole, replaceTempId) => {
    if (!token || !selfId) return;

    const payload: SendMessageInput =
      typeof input === "string"
        ? { recipientId: peerId, content: input.trim(), type: "text" }
        : { ...input, recipientId: peerId };

    if (payload.type === "text" && !payload.content?.trim()) return;

    const msg = await sendChatMessage(token, payload, selfId);
    if (payload.type !== "access_action") {
      emit(CHAT_EVENTS.MESSAGE_SENT, { token });
    }
    const peer = get().resolvePeer(peerId);
    upsertConversation(peerId, peer, msg, false);

    set((s) => ({
      messages: {
        ...s.messages,
        [peerId]: replaceTempId
          ? (s.messages[peerId] || []).map((m) => (m.id === replaceTempId ? msg : m))
          : [...(s.messages[peerId] || []), msg],
      },
      conversations: applyPresenceToConversations(baseConversations),
      peerTyping: Object.fromEntries(
        Object.entries(s.peerTyping).filter(([id]) => id !== peerId),
      ),
    }));

    void get().loadConversations(token, selfId, selfRole);
  },

  markRead: async (peerId, token) => {
    if (token) {
      try {
        await markMessagesRead(token, peerId);
      } catch {
        // ignore
      }
    }
    const idx = baseConversations.findIndex((c) => c.id === peerId);
    if (idx >= 0) {
      baseConversations[idx] = { ...baseConversations[idx], unreadCount: 0 };
    }
    set((s) => ({
      conversations: applyPresenceToConversations(baseConversations),
    }));
  },

  removeMessage: (peerId, messageId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [peerId]: (s.messages[peerId] || []).filter((m) => m.id !== messageId),
      },
    })),

  deleteMessage: async (peerId, messageId, token, selfId, selfRole) => {
    if (!token || !selfId) return;

    const isLocalOnly = messageId.startsWith("pending-");
    if (isLocalOnly) {
      get().removeMessage(peerId, messageId);
      return;
    }

    const previous = get().messages[peerId] || [];
    get().removeMessage(peerId, messageId);

    try {
      await deleteChatMessage(token, messageId);
      await get().loadConversations(token, selfId, selfRole);
    } catch {
      set((s) => ({
        messages: {
          ...s.messages,
          [peerId]: previous,
        },
      }));
      throw new Error("Failed to delete message");
    }
  },

  handleIncomingMessageDelete: (payload, token, selfId) => {
    if (!selfId) return;
    const peerId = payload.peer_id;
    get().removeMessage(peerId, payload.message_id);
    if (token) {
      void get().loadConversations(token, selfId, null);
    }
  },

  editMedicalMessage: async (
    peerId,
    messageId,
    medicalLink,
    note,
    recordTitle,
    token,
    selfId,
    selfRole,
  ) => {
    if (!token || !selfId) return;

    const trimmedNote = note?.trim();
    const content = trimmedNote || recordTitle;
    const previous = get().messages[peerId] || [];

    set((s) => ({
      messages: {
        ...s.messages,
        [peerId]: (s.messages[peerId] || []).map((m) =>
          m.id === messageId
            ? {
                ...m,
                text: content,
                medicalLink,
                editedAt: new Date().toISOString(),
              }
            : m,
        ),
      },
    }));

    try {
      const saved = await editChatMedicalMessage(token, messageId, peerId, selfId, {
        content,
        medicalLink,
      });
      set((s) => ({
        messages: {
          ...s.messages,
          [peerId]: (s.messages[peerId] || []).map((m) =>
            m.id === messageId ? saved : m,
          ),
        },
      }));
      const peer = get().resolvePeer(peerId);
      upsertConversation(peerId, peer, saved, false);
      set({ conversations: applyPresenceToConversations(baseConversations) });
      await get().loadConversations(token, selfId, selfRole);
    } catch {
      set((s) => ({
        messages: { ...s.messages, [peerId]: previous },
      }));
      throw new Error("Failed to update medical record");
    }
  },

  editMessage: async (peerId, messageId, content, token, selfId, selfRole) => {
    if (!token || !selfId) return;

    const trimmed = content.trim();
    if (!trimmed) return;

    const previous = get().messages[peerId] || [];
    const updated = previous.map((m) =>
      m.id === messageId ? { ...m, text: trimmed, editedAt: new Date().toISOString() } : m,
    );

    set((s) => ({
      messages: { ...s.messages, [peerId]: updated },
    }));

    try {
      const saved = await editChatMessage(token, messageId, trimmed, peerId, selfId);
      set((s) => ({
        messages: {
          ...s.messages,
          [peerId]: (s.messages[peerId] || []).map((m) =>
            m.id === messageId ? saved : m,
          ),
        },
      }));
      const peer = get().resolvePeer(peerId);
      upsertConversation(peerId, peer, saved, false);
      set({ conversations: applyPresenceToConversations(baseConversations) });
      await get().loadConversations(token, selfId, selfRole);
    } catch {
      set((s) => ({
        messages: { ...s.messages, [peerId]: previous },
      }));
      throw new Error("Failed to edit message");
    }
  },

  handleIncomingMessageUpdate: (payload, token, selfId) => {
    if (!selfId) return;
    const peerId = payload.peer_id;
    const msg = mapMessageRow(payload.message, peerId, selfId);

    set((s) => ({
      messages: {
        ...s.messages,
        [peerId]: (s.messages[peerId] || []).map((m) =>
          m.id === msg.id ? msg : m,
        ),
      },
    }));

    const peer = get().resolvePeer(peerId);
    upsertConversation(peerId, peer, msg, false);
    set({ conversations: applyPresenceToConversations(baseConversations) });
  },

  handleIncomingMessage: (payload, token, selfId) => {
    if (!selfId) return;
    const peerId = payload.peer_id;
    const peerNameHint =
      typeof (payload as { peer_name?: string }).peer_name === "string"
        ? (payload as { peer_name?: string }).peer_name
        : undefined;
    const msg = mapMessageRow(payload.message, peerId, selfId);
    const isOwnMessage = msg.senderId === "me";

    const active = get().activeChatPeerId;
    const isViewing = active === peerId;
    let peer = get().resolvePeer(peerId) ?? chatRepository.getUser(peerId);

    if (!peer && peerNameHint) {
      peer = peerFromHint(peerId, peerNameHint);
      chatRepository.cacheUsers([peer]);
    }

    const appendMessage = () => {
      set((s) => {
        const thread = s.messages[peerId] || [];
        if (thread.some((m) => m.id === msg.id)) return s;
        return {
          messages: {
            ...s.messages,
            [peerId]: [...thread, msg],
          },
          peerTyping: isViewing
            ? Object.fromEntries(
                Object.entries(s.peerTyping).filter(([id]) => id !== peerId),
              )
            : s.peerTyping,
        };
      });
    };

    if (isOwnMessage) {
      appendMessage();
      upsertConversation(peerId, peer, msg, false, peerNameHint);
      set({ conversations: applyPresenceToConversations(baseConversations) });
      return;
    }

    if (isViewing) {
      appendMessage();
      if (token) void get().markRead(peerId, token);
    } else {
      appendMessage();
      upsertConversation(peerId, peer, msg, true, peerNameHint);
      set({ conversations: applyPresenceToConversations(baseConversations) });

      if ((!peer || peer.name === "…") && token) {
        void get()
          .ensurePeer(peerId, token)
          .then((resolved) => {
            if (!resolved) return;
            upsertConversation(peerId, resolved, msg, false);
            set({ conversations: applyPresenceToConversations(baseConversations) });
          })
          .catch(() => undefined);
      }

      const senderName = peer?.name ?? peerNameHint ?? "…";
      const notice: ChatMessageReceivedPayload = {
        peerId,
        senderName,
        preview: chatMessagePreview(msg),
        messageId: msg.id,
      };
      emit(CHAT_EVENTS.MESSAGE_RECEIVED, notice);
    }
  },

  getPeer: (conversationId) => get().resolvePeer(conversationId),

  updateMessageEmotions: (messageId, emotions) => {
    set((state) => {
      const nextMessages: Record<string, ChatMessage[]> = {};
      for (const [peerId, rows] of Object.entries(state.messages)) {
        nextMessages[peerId] = rows.map((message) =>
          message.id === messageId ? { ...message, emotions } : message,
        );
      }
      return { messages: nextMessages };
    });
  },

  clear: () => {
    baseConversations = [];
    chatRepository.clearUsers();
    set({
      conversations: [],
      messages: {},
      messagesLoading: {},
      loading: false,
      error: null,
      activeChatPeerId: null,
      selfId: null,
      peerTyping: {},
    });
  },
}));

// Cross-domain subscription: clear on logout
on(AUTH_EVENTS.LOGOUT, () => {
  useChatStore.getState().clear();
});
