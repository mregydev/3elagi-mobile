import { usePathname, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import {
  useHardwareBackHandler,
  useWebMobileBackHandler,
} from "@/hooks/useHardwareBackHandler";
import { useWebLayout } from "@/hooks/useWebLayout";
import {
  getHardwareBackAction,
  isAiChatPath,
  isNormalChatPath,
} from "@/utils/hardwareBackNavigation";

/** Global hardware / mobile-browser back handling for stack and deep-link routes. */
export function HardwareBackHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile } = useWebLayout();

  const runBackAction = useCallback(() => {
    const action = getHardwareBackAction(pathname, router);
    if (!action) return false;
    action();
    return true;
  }, [pathname, router]);

  const webBackGuardKey = useMemo(() => {
    if (Platform.OS !== "web" || !isMobile) return undefined;
    if (isNormalChatPath(pathname) || isAiChatPath(pathname)) return pathname;
    return undefined;
  }, [isMobile, pathname]);

  useHardwareBackHandler(runBackAction);

  useWebMobileBackHandler(runBackAction, !!webBackGuardKey, webBackGuardKey);

  return null;
}
