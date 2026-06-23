import React, { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "@/domains/auth/store";
import { CHAT_EVENTS, type ChatMessageReceivedPayload } from "@/domains/chat/events";
import { unregisterPushToken } from "@/domains/push/api";
import { getExpoPushToken } from "@/domains/push/expoPush";
import { navigateFromPushNotification } from "@/domains/push/navigation";
import {
  clearPushTokenRegistrationCache,
  registerPushToken,
} from "@/domains/push/registerPushToken";
import { parsePushNotificationData } from "@/domains/push/types";
import { emit } from "@/utils/eventBus";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

  useEffect(() => {
    if (Platform.OS === "web" || !hydrated || !accessToken) return;

    void registerPushToken(accessToken).catch((error) => {
      if (__DEV__) {
        console.warn("[push] Token registration failed:", (error as Error).message);
      }
    });

    void getExpoPushToken().then((token) => {
      tokenRef.current = token;
    });
  }, [hydrated, accessToken]);

  useEffect(() => {
    if (Platform.OS === "web" || !hydrated || !accessToken) return;

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void registerPushToken(accessToken).catch(() => {});
      }
    });

    return () => sub.remove();
  }, [hydrated, accessToken]);

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
    return () => clearPushTokenRegistrationCache();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" || !accessToken) return;
    return () => {
      const token = tokenRef.current;
      if (!token) return;
      void unregisterPushToken(token, accessToken).catch(() => {});
    };
  }, [accessToken]);

  return null;
}
