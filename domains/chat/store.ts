import { create } from "zustand";
import { chatRepository } from "./repository";
import type { ChatMessage, Conversation } from "./types";

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  loadConversations: () => void;
  loadMessages: (conversationId: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
  markRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  loadConversations: () => {
    set({ conversations: chatRepository.listConversations() });
  },
  loadMessages: (id) => {
    const msgs = chatRepository.getMessages(id);
    set((s) => ({ messages: { ...s.messages, [id]: msgs } }));
  },
  sendMessage: (id, text) => {
    const t = text.trim();
    if (!t) return;
    const msg = chatRepository.appendMessage(id, t);
    set((s) => ({
      messages: { ...s.messages, [id]: [...(s.messages[id] || []), msg] },
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, lastMessage: msg, unreadCount: 0 } : c,
      ),
    }));
    setTimeout(() => {
      const reply = chatRepository.simulateReply(id);
      if (!reply) return;
      set((s) => ({
        messages: {
          ...s.messages,
          [id]: [...(s.messages[id] || []), reply],
        },
        conversations: s.conversations.map((c) =>
          c.id === id ? { ...c, lastMessage: reply } : c,
        ),
      }));
    }, 1500 + Math.random() * 1500);
    void get();
  },
  markRead: (id) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c,
      ),
    }));
  },
}));
