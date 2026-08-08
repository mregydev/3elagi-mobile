import { create } from "zustand";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/domains/notifications/api";

type NotificationsState = {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  load: (token: string) => Promise<void>;
  refreshUnread: (token: string) => Promise<void>;
  prepend: (item: AppNotification) => void;
  markRead: (token: string, id: string) => Promise<void>;
  markAllRead: (token: string) => Promise<void>;
  clear: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,

  load: async (token) => {
    set({ loading: true, error: null });
    try {
      const [items, unreadCount] = await Promise.all([
        fetchNotifications(token),
        fetchUnreadNotificationCount(token),
      ]);
      set({ items, unreadCount, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load notifications",
      });
    }
  },

  refreshUnread: async (token) => {
    try {
      const unreadCount = await fetchUnreadNotificationCount(token);
      set({ unreadCount });
    } catch {
      // ignore transient errors
    }
  },

  prepend: (item) => {
    const exists = get().items.some((n) => n.id === item.id);
    if (exists) return;
    const wasUnread = !item.read_at;
    set((s) => ({
      items: [item, ...s.items],
      unreadCount: wasUnread ? s.unreadCount + 1 : s.unreadCount,
    }));
  },

  markRead: async (token, id) => {
    const prev = get().items.find((n) => n.id === id);
    if (prev && !prev.read_at) {
      set((s) => ({
        items: s.items.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    }
    try {
      const saved = await markNotificationRead(token, id);
      set((s) => ({
        items: s.items.map((n) => (n.id === saved.id ? saved : n)),
      }));
    } catch {
      await get().refreshUnread(token);
    }
  },

  markAllRead: async (token) => {
    set((s) => ({
      items: s.items.map((n) =>
        n.read_at ? n : { ...n, read_at: new Date().toISOString() },
      ),
      unreadCount: 0,
    }));
    try {
      await markAllNotificationsRead(token);
    } catch {
      await get().load(token);
    }
  },

  clear: () => set({ items: [], unreadCount: 0, loading: false, error: null }),
}));
