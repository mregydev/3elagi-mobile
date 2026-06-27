import type { Router } from "expo-router";
import { isAiChatWebPath, isNormalChatWebPath } from "@/constants/webAppPaths";
import { leaveChatToHistory } from "@/utils/chatNavigation";
import { leaveMedicalForm } from "@/utils/medicalFormNavigation";

function normalizePathname(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  return path.startsWith("/") ? path : `/${path}`;
}

export function isNormalChatPath(pathname: string): boolean {
  return isNormalChatWebPath(normalizePathname(pathname));
}

export function isAiChatPath(pathname: string): boolean {
  return isAiChatWebPath(normalizePathname(pathname));
}

/**
 * Resolve the action for hardware / mobile back on the current route.
 * Returns null when the default OS behavior should run (e.g. exit app).
 */
export function getHardwareBackAction(
  pathname: string,
  router: Pick<Router, "back" | "replace" | "canGoBack">,
): (() => void) | null {
  const path = normalizePathname(pathname);

  if (isNormalChatPath(path)) {
    return leaveChatToHistory;
  }

  if (isAiChatPath(path)) {
    return () => router.replace("/(tabs)/assistant");
  }

  if (path.includes("/medical/add") || path.includes("/prescription/add")) {
    return () => leaveMedicalForm();
  }

  if (path.includes("/points/checkout")) {
    return () => {
      if (typeof router.canGoBack === "function" && router.canGoBack()) {
        router.back();
        return;
      }
      router.replace("/(tabs)/points");
    };
  }

  if (typeof router.canGoBack === "function" && router.canGoBack()) {
    return () => router.back();
  }

  return null;
}
