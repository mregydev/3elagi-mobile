import { Platform } from "react-native";
import type { Router } from "expo-router";
import type { DoctorApprovalStatus } from "./types";

const WELCOME_ROUTE = "/welcome" as const;
const MAIN_ROUTE = "/(tabs)" as const;

/** Route to open right after a successful login or signup. */
export function getPostAuthRoute(
  role: string | null,
  doctorApprovalStatus: DoctorApprovalStatus | null,
): "/admin" | "/doctor-pending" | "/(tabs)" {
  const normalizedRole = role?.toLowerCase();
  if (normalizedRole === "admin" && Platform.OS === "web") {
    return "/admin";
  }
  if (
    normalizedRole === "doctor" &&
    (doctorApprovalStatus === "pending" || doctorApprovalStatus === "rejected")
  ) {
    return "/doctor-pending";
  }
  return MAIN_ROUTE;
}

/**
 * After login: same destinations as signup (no Egypt/Jordan country gate for now).
 */
export function getPostLoginRoute(
  role: string | null,
  doctorApprovalStatus: DoctorApprovalStatus | null,
): "/admin" | "/doctor-pending" | "/(tabs)" {
  return getPostAuthRoute(role, doctorApprovalStatus);
}

/** Landing page after logout — main home browse (not welcome). */
export function getPostLogoutRoute(): "/(tabs)" {
  return MAIN_ROUTE;
}

/** Paths guests may stay on (browse + welcome + auth flows). */
export function isPublicWebPath(pathname: string): boolean {
  if (
    pathname === "/" ||
    pathname === WELCOME_ROUTE ||
    pathname.startsWith(`${WELCOME_ROUTE}/`) ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/doctor/") ||
    pathname === "/contact" ||
    pathname.startsWith("/contact/")
  ) {
    return true;
  }
  // Guest browse tabs: home + our doctors.
  if (
    pathname === "/(tabs)" ||
    pathname.startsWith("/(tabs)/our-doctors") ||
    pathname === "/our-doctors" ||
    pathname.startsWith("/our-doctors/")
  ) {
    return true;
  }
  // Expo Router may expose home as bare "/" under tabs already covered above.
  return false;
}

/** Navigate to main home after logout; retries on web when router.replace is dropped. */
export function navigateToWelcome(router: Pick<Router, "replace">): void {
  const dest = getPostLogoutRoute();
  router.replace(dest);

  if (Platform.OS !== "web" || typeof window === "undefined") return;

  const ensureHome = () => {
    if (isPublicWebPath(window.location.pathname)) return;
    router.replace(dest);
  };

  queueMicrotask(ensureHome);
  window.setTimeout(ensureHome, 0);
  window.setTimeout(() => {
    if (!isPublicWebPath(window.location.pathname)) {
      window.location.replace("/");
    }
  }, 100);
}
