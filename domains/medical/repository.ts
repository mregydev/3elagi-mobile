import type { MedicalRecord } from "./types";

const seed = (ownerId: string): MedicalRecord[] => {
  const now = new Date();
  const iso = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString();
  };
  return [
    {
      id: "r1",
      ownerId,
      category: "symptom",
      title: "Headache",
      notes: "Mild headache for 2 days, worse in afternoon.",
      value: "Mild",
      date: iso(2),
      createdAt: iso(2),
    },
    {
      id: "r2",
      ownerId,
      category: "symptom",
      title: "Sore throat",
      notes: "Pain when swallowing.",
      value: "Moderate",
      date: iso(1),
      createdAt: iso(1),
    },
    {
      id: "r3",
      ownerId,
      category: "lab",
      title: "CBC — Complete Blood Count",
      notes: "WBC slightly elevated.",
      value: "WBC: 11.2 ×10⁹/L",
      date: iso(7),
      createdAt: iso(7),
    },
    {
      id: "r4",
      ownerId,
      category: "lab",
      title: "Vitamin D",
      value: "22 ng/mL (low)",
      date: iso(14),
      createdAt: iso(14),
    },
    {
      id: "r5",
      ownerId,
      category: "xray",
      title: "Chest X-Ray",
      notes: "Cleared, no abnormalities.",
      value: "Normal",
      date: iso(30),
      createdAt: iso(30),
    },
    {
      id: "r6",
      ownerId,
      category: "intake",
      title: "Smoking history",
      value: "Non-smoker",
      date: iso(0),
      createdAt: iso(0),
    },
    {
      id: "r7",
      ownerId,
      category: "intake",
      title: "Allergies",
      value: "Penicillin",
      date: iso(0),
      createdAt: iso(0),
    },
  ];
};

let store: Record<string, MedicalRecord[]> = {};

export const medicalRepository = {
  list(ownerId: string): MedicalRecord[] {
    if (!store[ownerId]) store[ownerId] = seed(ownerId);
    return [...store[ownerId]].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
    );
  },
  add(record: Omit<MedicalRecord, "id" | "createdAt">): MedicalRecord {
    const full: MedicalRecord = {
      ...record,
      id: `r-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store[record.ownerId] = [full, ...(store[record.ownerId] || [])];
    return full;
  },
  remove(ownerId: string, id: string) {
    store[ownerId] = (store[ownerId] || []).filter((r) => r.id !== id);
  },
};
