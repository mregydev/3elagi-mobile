import type { Router } from "expo-router";
import type { PushNotificationData } from "@/domains/push/types";

export function navigateFromPushNotification(
  router: Router,
  data: PushNotificationData,
): void {
  if (data.type === "chat") {
    router.push(`/chat/${data.chatId}`);
    return;
  }

  router.push({
    pathname: "/(tabs)/assistant",
    params: { chatId: data.chatId },
  });
}
