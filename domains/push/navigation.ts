import { Platform } from "react-native";
import type { Router } from "expo-router";
import { isMobileAiPushDisabled } from "@/domains/ai/push-suppression";
import type { PushNotificationData } from "@/domains/push/types";

export function getPushNotificationPath(data: PushNotificationData): string {
  if (data.type === "incoming_video_call") {
    return `/video-call?sessionId=${encodeURIComponent(data.sessionId)}`;
  }
  if (data.type === "appointment_reminder") {
    if (data.meetingLink) {
      return `/video-call?meetingUrl=${encodeURIComponent(data.meetingLink)}`;
    }
    return `/video-call?sessionId=${encodeURIComponent(data.sessionId)}`;
  }
  if (data.type === "appointment_status") {
    return "/(tabs)/appointments";
  }
  if (data.type === "chat") return `/chat/${data.chatId}`;
  return `/ai/${data.chatId}`;
}

export function navigateFromPushNotification(
  router: Router,
  data: PushNotificationData,
): void {
  if (data.type === "incoming_video_call") {
    router.push({
      pathname: "/video-call",
      params: { sessionId: data.sessionId },
    });
    return;
  }

  if (data.type === "appointment_reminder") {
    router.push({
      pathname: "/video-call",
      params: data.meetingLink
        ? { meetingUrl: data.meetingLink }
        : { sessionId: data.sessionId },
    });
    return;
  }

  if (data.type === "appointment_status") {
    router.push("/(tabs)/appointments");
    return;
  }

  if (data.type === "chat") {
    router.push(`/chat/${data.chatId}`);
    return;
  }

  if (Platform.OS !== "web" && isMobileAiPushDisabled()) return;

  router.push(getPushNotificationPath(data));
}
