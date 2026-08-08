import { create } from "zustand";

interface GuestAuthDialogState {
  visible: boolean;
  open: () => void;
  close: () => void;
}

/** Global guest “please log in / sign up” dialog (e.g. tapping a doctor while logged out). */
export const useGuestAuthDialogStore = create<GuestAuthDialogState>((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));
