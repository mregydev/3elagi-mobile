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
  /** Short instruction for bottom-bar steps. */
  message: string;
  /** Rich popover title (contextual steps). */
  title?: string;
  /** Rich popover body (contextual steps). */
  description?: string;
  /** Primary button label on contextual popovers. */
  primaryCta?: string;
  /** Tooltip placement strategy. */
  placement?: "bottom" | "contextual";
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
    message: "Click on Chat history",
    route: "/(tabs)",
    waitForTap: true,
  },
  {
    id: "open-test-chat",
    anchor: "chat-test-row",
    message: "Click on your test patient",
    route: "/(tabs)/history",
    waitForTap: true,
  },
  {
    id: "view-records",
    anchor: "chat-view-records",
    message: "View the patient's medical record",
    title: "View the patient's medical record",
    description:
      "Access medical history, files, and attachments before starting the consultation.",
    primaryCta: "View Record",
    placement: "contextual",
    waitForTap: true,
  },
  {
    id: "skeleton-toggle",
    anchor: "records-skeleton-toggle",
    message: "Click on Skeleton view",
    waitForTap: true,
  },
  {
    id: "skeleton-body",
    anchor: "records-skeleton-body",
    message: "Click a body part, then pick an organ",
    waitForTap: true,
  },
];

export const PROFILE_DOCTOR_TOUR: TourStep[] = [
  {
    id: "local-price",
    anchor: "profile-local-price",
    message: "Set your local consultation price",
    route: "/(tabs)/profile",
  },
  {
    id: "outside-price",
    anchor: "profile-outside-price",
    message: "Set your price for patients abroad",
    route: "/(tabs)/profile",
  },
  {
    id: "calendar",
    anchor: "profile-calendar",
    message: "Choose your available days and times",
    route: "/(tabs)/profile",
  },
  {
    id: "save",
    anchor: "profile-save",
    message: "Click Save when you're done",
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

function tourPathHas(path: string, segment: string): boolean {
  return path.includes(`/${segment}`) || path.endsWith(segment);
}

/** True when the app is already on the screen the tour step wants to open. */
export function isTourRouteActive(pathname: string | null, route: string): boolean {
  if (!pathname) return false;
  const path = pathname.replace(/\/$/, "") || "/";
  const target = route.replace(/\/$/, "") || "/";

  if (path === target) return true;

  if (target === "/(tabs)") {
    return (
      path === "/" ||
      path === "/(tabs)" ||
      (path.includes("(tabs)") &&
        !tourPathHas(path, "history") &&
        !tourPathHas(path, "records") &&
        !tourPathHas(path, "profile") &&
        !tourPathHas(path, "patients") &&
        !tourPathHas(path, "chat"))
    );
  }

  if (target === "/(tabs)/history") return tourPathHas(path, "history");
  if (target === "/(tabs)/profile") return tourPathHas(path, "profile");

  const chatMatch = target.match(/^\/chat\/([^/]+)$/);
  if (chatMatch) return new RegExp(`^/chat/${chatMatch[1]}$`).test(path);

  const patientMatch = target.match(/^\/patients\/([^/]+)$/);
  if (patientMatch) return new RegExp(`^/patients/${patientMatch[1]}$`).test(path);

  return path.includes(target.slice(1));
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
