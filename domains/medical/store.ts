import { create } from "zustand";
import { medicalRepository } from "./repository";
import type { MedicalCategory, MedicalRecord } from "./types";

interface MedicalState {
  records: MedicalRecord[];
  load: (ownerId: string) => void;
  add: (input: {
    ownerId: string;
    category: MedicalCategory;
    title: string;
    value?: string;
    notes?: string;
    date?: string;
  }) => void;
  remove: (ownerId: string, id: string) => void;
}

export const useMedicalStore = create<MedicalState>((set) => ({
  records: [],
  load: (ownerId) => set({ records: medicalRepository.list(ownerId) }),
  add: (input) => {
    medicalRepository.add({
      ownerId: input.ownerId,
      category: input.category,
      title: input.title,
      value: input.value,
      notes: input.notes,
      date: input.date || new Date().toISOString(),
    });
    set({ records: medicalRepository.list(input.ownerId) });
  },
  remove: (ownerId, id) => {
    medicalRepository.remove(ownerId, id);
    set({ records: medicalRepository.list(ownerId) });
  },
}));
