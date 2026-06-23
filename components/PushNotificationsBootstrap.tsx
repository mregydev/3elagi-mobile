import React, { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "@/domains/auth/store";
import { AUTH_EVENTS } from "@/domains/auth/events";
import { CHAT_EVENTS, type ChatMessageReceivedPayload } from "@/domains/chat/events";
import { unregisterPushToken } from "@/domains/push/api";
import { ensureChatPushChannel } from "@/domains/push/expoPush";
import { navigateFromPushNotification } from "@/domains/push/navigation";
import {
  clearPushTokenRegistrationCache,
  registerPushToken,
} from "@/domains/push/registerPushToken";
import { parsePushNotificationData } from "@/domains/push/types";
import { emit, on } from "@/utils/eventBus";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

void ensureChatPushChannel();

function handleNotificationOpen(
  router: ReturnType<typeof useRouter>,
  data: Record<string, unknown> | undefined,
) {
  const parsed = parsePushNotificationData(data);
  if (!parsed) return;
  navigateFromPushNotification(router, parsed);
}

/**
 * Registers Expo push tokens and handles notification taps / foreground delivery.
 */
export function PushNotificationsBootstrap() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const tokenRef = useRef<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    if (Platform.OS === "web" || !hydrated || !accessToken) return;

    void registerPushToken(accessToken)
      .then((token) => {
        if (token) tokenRef.current = token;
      })
      .catch((error) => {
        if (__DEV__) {
          console.warn("[push] Token registration failed:", (error as Error).message);
        }
      });
  }, [hydrated, accessToken]);

  useEffect(() => {
    if (Platform.OS === "web" || !hydrated || !accessToken) return;

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void registerPushToken(accessToken)
          .then((token) => {
            if (token) tokenRef.current = token;
          })
          .catch(() => {});
      }
    });

    return () => sub.remove();
  }, [hydrated, accessToken]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const tokenSub = Notifications.addPushTokenListener(({ data: token }) => {
      tokenRef.current = token;
      const currentAccessToken = accessTokenRef.current;
      if (!currentAccessToken) return;
      void registerPushToken(currentAccessToken).catch(() => {});
    });

    return () => tokenSub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" || !accessToken) return;

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const parsed = parsePushNotificationData(
        content.data as Record<string, unknown>,
      );
      if (parsed?.type !== "chat") return;

      const event: ChatMessageReceivedPayload = {
        peerId: parsed.chatId,
        senderName: typeof content.title === "string" ? content.title : "New message",
        preview: typeof content.body === "string" ? content.body : "New message",
        messageId: parsed.messageId,
      };
      emit(CHAT_EVENTS.MESSAGE_RECEIVED, event);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationOpen(
        router,
        response.notification.request.content.data as Record<string, unknown>,
      );
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      handleNotificationOpen(
        router,
        response.notification.request.content.data as Record<string, unknown>,
      );
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [accessToken, router]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const unsubscribe = on(AUTH_EVENTS.LOGOUT, () => {
      const token = tokenRef.current;
      const sessionToken = accessTokenRef.current;
      tokenRef.current = null;
      accessTokenRef.current = null;
      clearPushTokenRegistrationCache();
      if (!token || !sessionToken) return;
      void unregisterPushToken(token, sessionToken).catch(() => {});
    });

    return unsubscribe;
  }, []);

  return null;
}
