import { create } from "zustand";
import type { LoggedInUser } from "./types";

interface PresenceState {
  users: Record<string, LoggedInUser>;
  setUsers: (users: LoggedInUser[]) => void;
  addUser: (user: LoggedInUser) => void;
  removeUser: (userId: string) => void;
  clear: () => void;
  isOnline: (userId: string) => boolean;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  users: {},
  setUsers: (users) =>
    set({
      users: Object.fromEntries(users.map((u) => [u.id, u])),
    }),
  addUser: (user) =>
    set((state) => ({
      users: { ...state.users, [user.id]: user },
    })),
  removeUser: (userId) =>
    set((state) => {
      const next = { ...state.users };
      delete next[userId];
      return { users: next };
    }),
  clear: () => set({ users: {} }),
  isOnline: (userId) => Boolean(get().users[userId]),
}));
