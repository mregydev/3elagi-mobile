import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";

/** Keeps unauthenticated users on welcome; sends signed-in users to the app. */
export function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const signedIn = isSignedIn(profile, accessToken);

  useEffect(() => {
    if (!hydrated) return;

    const root = segments[0];
    const isPublic =
      root === "welcome" ||
      root === "auth" ||
      root === undefined;

    if (!signedIn) {
      if (!isPublic) {
        router.replace("/welcome");
      }
      return;
    }

    if (signedIn && (root === "welcome" || root === "auth")) {
      router.replace("/(tabs)");
    }
  }, [hydrated, signedIn, segments, router]);

  return null;
}
