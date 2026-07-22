import { usePathname, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { useAsk3elagiAiWidgetStore } from "@/domains/ai/widget-store";
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
  const aiWidgetOpen = useAsk3elagiAiWidgetStore((s) => s.open);
  const closeAiWidget = useAsk3elagiAiWidgetStore((s) => s.closeWidget);

  const runBackAction = useCallback(() => {
    // Prefer closing the floating AI chat over navigating away.
    if (useAsk3elagiAiWidgetStore.getState().open) {
      closeAiWidget();
      return true;
    }
    const action = getHardwareBackAction(pathname, router);
    if (!action) return false;
    action();
    return true;
  }, [pathname, router, closeAiWidget]);

  const webBackGuardKey = useMemo(() => {
    if (Platform.OS !== "web" || !isMobile) return undefined;
    if (aiWidgetOpen) return "ask-3elagi-ai-widget";
    if (isNormalChatPath(pathname) || isAiChatPath(pathname)) return pathname;
    return undefined;
  }, [aiWidgetOpen, isMobile, pathname]);

  useHardwareBackHandler(runBackAction);

  useWebMobileBackHandler(runBackAction, !!webBackGuardKey, webBackGuardKey);

  return null;
}
