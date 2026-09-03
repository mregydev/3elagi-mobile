import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { AUTH_EVENTS } from "@/domains/auth/events";
import { getPostLogoutRoute, navigateToWelcome } from "@/domains/auth/navigation";
import { isSignedIn } from "@/domains/auth/session";
import { useAuthStore } from "@/domains/auth/store";
import { on } from "@/utils/eventBus";

function isWelcomePath(pathname: string): boolean {
  return pathname === getPostLogoutRoute() || pathname.startsWith("/welcome/");
}

/** After logout on web, always navigate to the welcome landing page. */
export function WebLogoutRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const welcomeRoute = getPostLogoutRoute();
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const signedIn = isSignedIn(profile, accessToken);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    return on(AUTH_EVENTS.LOGOUT, () => {
      navigateToWelcome(router);
    });
  }, [router]);

  useEffect(() => {
    if (Platform.OS !== "web" || !hydrated || signedIn || isWelcomePath(pathname)) return;
    navigateToWelcome(router);
  }, [hydrated, signedIn, pathname, router, welcomeRoute]);

  return null;
}
