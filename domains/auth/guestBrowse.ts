import { useGuestAuthDialogStore } from "@/domains/auth/guestAuthDialogStore";

/** Tab segments guests may open without signing in. */
export const GUEST_ALLOWED_TABS = new Set(["index", "our-doctors"]);

/** Root segments guests may open (browse + auth + marketing). */
export function isGuestAllowedRoot(
  root: string | undefined,
  tabSegment?: string,
): boolean {
  if (
    root === undefined ||
    root === "welcome" ||
    root === "auth" ||
    root === "contact"
  ) {
    return true;
  }
  // Public doctor profile only — not doctor tooling routes.
  if (root === "doctor") {
    return !!tabSegment && tabSegment !== "intake-exams";
  }
  if (root === "(tabs)") {
    if (!tabSegment || tabSegment === "index") return true;
    return GUEST_ALLOWED_TABS.has(tabSegment);
  }
  return false;
}

/**
 * Prompt guests to log in / sign up (design-system dialog).
 * Used when tapping a doctor or starting a consultation while logged out.
 */
export function promptAuthForConsultation(
  _router?: unknown,
  _isRTL?: boolean,
): void {
  useGuestAuthDialogStore.getState().open();
}
