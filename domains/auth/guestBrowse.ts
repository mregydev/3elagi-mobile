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
 * Pass `returnTo` (e.g. `/chat/:userId`) to resume that screen after auth.
 */
export function promptAuthForConsultation(returnTo?: string | null): void {
  useGuestAuthDialogStore.getState().open(returnTo ?? null);
}
