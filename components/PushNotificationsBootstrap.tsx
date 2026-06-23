import React, { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/domains/auth/store";
import { AUTH_EVENTS } from "@/domains/auth/events";
import { CHAT_EVENTS, type ChatMessageReceivedPayload } from "@/domains/chat/events";
import { navigateFromPushNotification } from "@/domains/push/navigation";
import {
  addOneSignalClickListener,
  addOneSignalForegroundListener,
  initOneSignal,
  loginOneSignalUser,
  logoutOneSignalUser,
  requestOneSignalPermission,
} from "@/domains/push/onesignal";
import { parsePushNotificationData } from "@/domains/push/types";
import { emit, on } from "@/utils/eventBus";

function handleNotificationOpen(
  router: ReturnType<typeof useRouter>,
  data: Record<string, unknown> | undefined,
) {
  const parsed = parsePushNotificationData(data);
  if (!parsed) return;
  navigateFromPushNotification(router, parsed);
}

/**
 * Initializes OneSignal and links the signed-in user via external_id for server push.
 */
export function PushNotificationsBootstrap() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (Platform.OS === "web") return;
    initOneSignal();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" || !hydrated || !accessToken || !profile?.id) return;

    void requestOneSignalPermission().then(() => {
      loginOneSignalUser(profile.id);
    });
  }, [hydrated, accessToken, profile?.id]);

  const onClick = useCallback(
    (event: { notification: { additionalData?: Record<string, unknown> } }) => {
      handleNotificationOpen(router, event.notification.additionalData);
    },
    [router],
  );

  const onForeground = useCallback((event: { getNotification: () => { additionalData?: Record<string, unknown> } }) => {
    const data = event.getNotification().additionalData;
    const parsed = parsePushNotificationData(data);
    if (parsed?.type !== "chat") return;

    const eventPayload: ChatMessageReceivedPayload = {
      peerId: parsed.chatId,
      senderName: "New message",
      preview: "New message",
      messageId: parsed.messageId,
    };
    emit(CHAT_EVENTS.MESSAGE_RECEIVED, eventPayload);
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const removeClick = addOneSignalClickListener(onClick);
    const removeForeground = addOneSignalForegroundListener(onForeground);
    return () => {
      removeClick();
      removeForeground();
    };
  }, [onClick, onForeground]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const unsubscribe = on(AUTH_EVENTS.LOGOUT, () => {
      logoutOneSignalUser();
    });
    return unsubscribe;
  }, []);

  return null;
}
