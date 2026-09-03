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

/** Landing page after logout (welcome home with login/signup actions). */
export function getPostLogoutRoute(): "/welcome" {
  return WELCOME_ROUTE;
}

function isPublicWebPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === WELCOME_ROUTE ||
    pathname.startsWith(`${WELCOME_ROUTE}/`) ||
    pathname.startsWith("/auth")
  );
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
