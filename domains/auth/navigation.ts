import { Platform } from "react-native";
import type { Router } from "expo-router";
import type { DoctorApprovalStatus } from "./types";

const WELCOME_ROUTE = "/welcome" as const;

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
  return "/(tabs)";
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

/** Landing page after logout (welcome home with login/signup actions). */
export function getPostLogoutRoute(): "/welcome" {
  return WELCOME_ROUTE;
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

/** Navigate to welcome after logout; retries on web when router.replace is dropped. */
export function navigateToWelcome(router: Pick<Router, "replace">): void {
  router.replace(WELCOME_ROUTE);

  if (Platform.OS !== "web" || typeof window === "undefined") return;

  const ensureWelcome = () => {
    if (isPublicWebPath(window.location.pathname)) return;
    router.replace(WELCOME_ROUTE);
  };

  queueMicrotask(ensureWelcome);
  window.setTimeout(ensureWelcome, 0);
  window.setTimeout(() => {
    if (!isPublicWebPath(window.location.pathname)) {
      window.location.replace(WELCOME_ROUTE);
    }
  }, 100);
}
