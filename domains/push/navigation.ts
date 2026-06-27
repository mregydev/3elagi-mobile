import { Platform } from "react-native";
import type { Router } from "expo-router";
import { isMobileAiPushDisabled } from "@/domains/ai/push-suppression";
import type { PushNotificationData } from "@/domains/push/types";

export function getPushNotificationPath(data: PushNotificationData): string {
  if (data.type === "chat") return `/chat/${data.chatId}`;
  return `/ai/${data.chatId}`;
}

export function navigateFromPushNotification(
  router: Router,
  data: PushNotificationData,
): void {
  if (data.type === "chat") {
    router.push(`/chat/${data.chatId}`);
    return;
  }

  if (Platform.OS !== "web" && isMobileAiPushDisabled()) return;

  router.push(getPushNotificationPath(data));
}
