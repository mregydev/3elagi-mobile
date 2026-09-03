import { create } from "zustand";

export type DoctorTourPhase = "main" | "profile" | null;

export type TourAnchor =
  | "nav-history"
  | "chat-test-row"
  | "chat-view-records"
  | "records-skeleton-toggle"
  | "records-skeleton-body"
  | "records-record-row"
  | "records-back"
  | "records-reset"
  | "profile-local-price"
  | "profile-outside-price"
  | "profile-calendar"
  | "profile-save";

export interface TourStep {
  id: string;
  anchor: TourAnchor;
  title: string;
  body: string;
  /** Route to open before highlighting (optional). */
  route?: string;
  /** Wait for user to tap the anchor before advancing. */
  waitForTap?: boolean;
}

interface ProductTourState {
  phase: DoctorTourPhase;
  stepIndex: number;
  active: boolean;
  testPatientUserId: string | null;
  /** Set when the tour ends so bootstrap can persist completion after the last tap step. */
  exitReason: "skip" | "complete" | null;
  completedPhase: DoctorTourPhase;
  setTestPatientUserId: (id: string | null) => void;
  startMainTour: () => void;
  startProfileTour: () => void;
  next: () => void;
  skip: () => void;
  clearExit: () => void;
  completePhase: () => void;
  advanceOnAnchorTap: (anchor: TourAnchor) => void;
}

export const MAIN_DOCTOR_TOUR: TourStep[] = [
  {
    id: "open-history",
    anchor: "nav-history",
    title: "Chat history",
    body: "Activity is expanded for you. Click Chat history here to find your test patient.",
    route: "/(tabs)",
    waitForTap: true,
  },
  {
    id: "open-test-chat",
    anchor: "chat-test-row",
    title: "Your test patient",
    body: "Click this conversation — your test patient already sent you a welcome message.",
    route: "/(tabs)/history",
    waitForTap: true,
  },
  {
    id: "view-records",
    anchor: "chat-view-records",
    title: "Medical records",
    body: "Click View Record to open this patient's medical history.",
    waitForTap: true,
  },
  {
    id: "skeleton-toggle",
    anchor: "records-skeleton-toggle",
    title: "Skeleton view",
    body: "Click Skeleton view to browse records by body region.",
    waitForTap: true,
  },
  {
    id: "skeleton-body",
    anchor: "records-skeleton-body",
    title: "Explore body regions",
    body: "Click any body region, pick an organ, and view the medical records for it.",
    waitForTap: true,
  },
];

export const PROFILE_DOCTOR_TOUR: TourStep[] = [
  {
    id: "local-price",
    anchor: "profile-local-price",
    title: "Your local price",
    body: "This is your consultation price inside Egypt or Jordan, based on your country.",
    route: "/(tabs)/profile",
  },
  {
    id: "outside-price",
    anchor: "profile-outside-price",
    title: "Price abroad",
    body: "This is what patients outside your country pay in USD.",
    route: "/(tabs)/profile",
  },
  {
    id: "calendar",
    anchor: "profile-calendar",
    title: "Availability",
    body: "Choose one or more days, set your time availability, then press Save.",
    route: "/(tabs)/profile",
  },
  {
    id: "save",
    anchor: "profile-save",
    title: "Save changes",
    body: "Always save after updating prices or availability.",
    waitForTap: true,
  },
];

export function tourRouteForStep(
  step: TourStep | null,
  testPatientUserId: string | null,
): string | undefined {
  if (!step) return undefined;
  if (step.route) return step.route;
  if (!testPatientUserId) return undefined;
  if (step.anchor === "chat-view-records") {
    return `/chat/${testPatientUserId}`;
  }
  if (
    [
      "records-skeleton-toggle",
      "records-skeleton-body",
    ].includes(step.anchor)
  ) {
    return `/patients/${testPatientUserId}`;
  }
  return undefined;
}

export const useProductTourStore = create<ProductTourState>((set, get) => ({
  phase: null,
  stepIndex: 0,
  active: false,
  testPatientUserId: null,
  exitReason: null,
  completedPhase: null,
  setTestPatientUserId: (id) => set({ testPatientUserId: id }),
  startMainTour: () =>
    set({
      phase: "main",
      stepIndex: 0,
      active: true,
      exitReason: null,
      completedPhase: null,
    }),
  startProfileTour: () =>
    set({
      phase: "profile",
      stepIndex: 0,
      active: true,
      exitReason: null,
      completedPhase: null,
    }),
  next: () => {
    const { phase, stepIndex } = get();
    const steps = phase === "profile" ? PROFILE_DOCTOR_TOUR : MAIN_DOCTOR_TOUR;
    if (stepIndex + 1 >= steps.length) {
      set({
        active: false,
        phase: null,
        stepIndex: 0,
        exitReason: "complete",
        completedPhase: phase,
      });
      return;
    }
    set({ stepIndex: stepIndex + 1, exitReason: null });
  },
  skip: () =>
    set({
      active: false,
      phase: null,
      stepIndex: 0,
      exitReason: "skip",
      completedPhase: null,
    }),
  clearExit: () => set({ exitReason: null, completedPhase: null }),
  completePhase: () =>
    set({
      active: false,
      phase: null,
      stepIndex: 0,
      exitReason: null,
      completedPhase: null,
    }),
  advanceOnAnchorTap: (anchor) => {
    const { active, phase, stepIndex } = get();
    if (!active) return;
    const step = currentTourStep(phase, stepIndex);
    if (step?.waitForTap && step.anchor === anchor) {
      get().next();
    }
  },
}));

export function currentTourStep(phase: DoctorTourPhase, index: number): TourStep | null {
  if (!phase) return null;
  const steps = phase === "profile" ? PROFILE_DOCTOR_TOUR : MAIN_DOCTOR_TOUR;
  return steps[index] ?? null;
}

export function currentTourSteps(phase: DoctorTourPhase): TourStep[] {
  if (phase === "profile") return PROFILE_DOCTOR_TOUR;
  if (phase === "main") return MAIN_DOCTOR_TOUR;
  return [];
}
