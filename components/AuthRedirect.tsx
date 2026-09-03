import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { navigateToWelcome } from "@/domains/auth/navigation";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";

function isDoctorPendingApproval(
  role: string | null,
  status: string | null,
): boolean {
  return (
    role?.toLowerCase() === "doctor" &&
    (status === "pending" || status === "rejected")
  );
}

/** Keeps unauthenticated users on welcome; sends signed-in users to the app. */
export function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const doctorApprovalStatus = useAuthStore((s) => s.doctorApprovalStatus);
  const signedIn = isSignedIn(profile, accessToken);

  useEffect(() => {
    if (!hydrated) return;

    const root = segments[0];
    const isPublic =
      root === "welcome" ||
      root === "auth" ||
      root === undefined;
    const isAdminRoute = root === "admin";
    const isPendingRoute = root === "doctor-pending";

    if (!signedIn) {
      if (!isPublic) {
        if (Platform.OS === "web") {
          navigateToWelcome(router);
        } else {
          router.replace("/welcome");
        }
      }
      return;
    }

    const isAdmin = role?.toLowerCase() === "admin";

    if (isAdmin) {
      if (Platform.OS !== "web") {
        router.replace("/welcome");
        return;
      }
      if (!isAdminRoute) {
        router.replace("/admin");
      }
      return;
    }

    if (isDoctorPendingApproval(role, doctorApprovalStatus)) {
      if (!isPendingRoute) {
        router.replace("/doctor-pending");
      }
      return;
    }

    if (signedIn && (root === "welcome" || root === "auth")) {
      router.replace("/(tabs)");
      return;
    }

    if (isAdminRoute) {
      router.replace("/(tabs)");
    }
  }, [
    hydrated,
    signedIn,
    segments,
    router,
    role,
    doctorApprovalStatus,
  ]);

  return null;
}
