import React, { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useAuthStore } from "@/domains/auth/store";
import { AUTH_EVENTS } from "@/domains/auth/events";
import { getPushProvider } from "@/domains/push/push-provider.factory";
import { parsePushNotificationData } from "@/domains/push/types";
import { navigateFromPushToWebApp } from "@/domains/push/webViewNavigation";
import { emit, on } from "@/utils/eventBus";
import { CHAT_EVENTS } from "@/domains/chat/events";

/** Push registration + tap navigation for the native WebView shell (no expo-router). */
export function NativePushBootstrap() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const profile = useAuthStore((s) => s.profile);
  const provider = getPushProvider();
  const tokenRef = useRef<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    provider.init();
  }, [provider]);

  useEffect(() => {
    if (Platform.OS === "web" || !hydrated || !accessToken) return;

    let cancelled = false;

    const attemptRegister = (label: string) => {
      void provider
        .register(accessToken)
        .then((token) => {
          if (cancelled) return;
          if (token) {
            tokenRef.current = token;
            console.log(`[push] Expo push token registered (${label})`);
          }
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          console.warn(
            "[push] Token registration failed:",
            (err as Error)?.message ?? err,
          );
        });
    };

    attemptRegister("initial");
    const retryTimer = setTimeout(() => attemptRegister("retry"), 5000);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [hydrated, accessToken, provider]);

  const handleOpen = useCallback(
    (data: Record<string, unknown> | undefined) => {
      const parsed = parsePushNotificationData(data);
      if (!parsed) return;
      navigateFromPushToWebApp(parsed);
    },
    [],
  );

  const handleForegroundChat = useCallback(
    (payload: {
      peerId: string;
      senderName: string;
      preview: string;
      messageId: string;
    }) => {
      emit(CHAT_EVENTS.MESSAGE_RECEIVED, payload);
    },
    [],
  );

  useEffect(() => {
    if (Platform.OS === "web" || !accessToken) return;

    return provider.subscribe(
      {
        hydrated,
        accessToken,
        profileId: profile?.id,
      },
      handleForegroundChat,
      handleOpen,
    );
  }, [
    accessToken,
    hydrated,
    profile?.id,
    provider,
    handleForegroundChat,
    handleOpen,
  ]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const unsubscribe = on(AUTH_EVENTS.LOGOUT, () => {
      provider.onLogout(accessTokenRef.current, tokenRef.current);
      tokenRef.current = null;
      accessTokenRef.current = null;
    });

    return unsubscribe;
  }, [provider]);

  return null;
}
