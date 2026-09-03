import { create } from "zustand";

interface Ask3elagiAiWidgetState {
  open: boolean;
  /** Sent once when the panel opens / expands. */
  pendingQuestion: string | null;
  /** Scopes doctor AI answers to this patient (consultations + records). */
  patientUserId: string | null;
  openWidget: (question?: string, patientUserId?: string | null) => void;
  closeWidget: () => void;
  toggleWidget: () => void;
  setPatientUserId: (patientUserId: string | null) => void;
  consumePendingQuestion: () => string | null;
}

/** Global Ask 3elagi AI chat widget — open from any screen. */
export const useAsk3elagiAiWidgetStore = create<Ask3elagiAiWidgetState>(
  (set, get) => ({
    open: false,
    pendingQuestion: null,
    patientUserId: null,
    openWidget: (question, patientUserId) =>
      set({
        open: true,
        pendingQuestion: question?.trim() || get().pendingQuestion,
        patientUserId:
          patientUserId !== undefined
            ? patientUserId?.trim() || null
            : get().patientUserId,
      }),
    closeWidget: () =>
      set({ open: false, pendingQuestion: null, patientUserId: null }),
    toggleWidget: () =>
      set((s) => ({
        open: !s.open,
        pendingQuestion: s.open ? null : s.pendingQuestion,
        patientUserId: s.open ? null : s.patientUserId,
      })),
    setPatientUserId: (patientUserId) =>
      set({ patientUserId: patientUserId?.trim() || null }),
    consumePendingQuestion: () => {
      const q = get().pendingQuestion;
      if (q) set({ pendingQuestion: null });
      return q;
    },
  }),
);

export function openAsk3elagiAi(question?: string, patientUserId?: string | null) {
  useAsk3elagiAiWidgetStore.getState().openWidget(question, patientUserId);
}

export function closeAsk3elagiAi() {
  useAsk3elagiAiWidgetStore.getState().closeWidget();
}
