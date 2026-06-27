import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { shouldSuppressAiPush } from "@/domains/ai/push-suppression";
import {
  clearPushTokenRegistrationCache,
  registerPushToken,
} from "@/domains/push/registerPushToken";
import { unregisterPushToken } from "@/domains/push/api";
import { ensureChatPushChannel } from "@/domains/push/expoPush";
import type { PushBootstrapContext, PushProvider } from "@/domains/push/providers/types";

function shouldSuppressForegroundAiPush(data: Record<string, unknown> | undefined): boolean {
  if (data?.type !== "ai") return false;
  const chatId = String(
    data.chatId ?? data.chat_id ?? data.threadId ?? data.thread_id ?? "",
  );
  return shouldSuppressAiPush(chatId);
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as Record<string, unknown>;
    if (shouldSuppressForegroundAiPush(data)) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }
    return {
      // ponytail: suppress system popup in foreground; in-app banner handles chat instead
      shouldShowAlert: false,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: true,
    };
  },
});

// ponytail: module-level set prevents double-navigation when subscribe() re-runs
const handledInitialIds = new Set<string>();

export class ExpoPushProvider implements PushProvider {
  readonly id = "expo" as const;

  init(): void {
    if (Platform.OS === "web") return;
    void ensureChatPushChannel();
  }

  async register(accessToken: string): Promise<string | null> {
    if (Platform.OS === "web") return null;
    return registerPushToken(accessToken);
  }

  onLogout(accessToken?: string | null, token?: string | null): void {
    clearPushTokenRegistrationCache();
    if (!token || !accessToken) return;
    void unregisterPushToken(token, accessToken).catch(() => {});
  }

  subscribe(
    ctx: PushBootstrapContext,
    onForegroundChat: (payload: {
      peerId: string;
      senderName: string;
      preview: string;
      messageId: string;
    }) => void,
    onOpen: (data: Record<string, unknown> | undefined) => void,
  ): () => void {
    if (Platform.OS === "web") return () => {};

    const tokenSub = Notifications.addPushTokenListener(() => {
      if (ctx.accessToken) {
        void registerPushToken(ctx.accessToken).catch(() => {});
      }
    });

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active" && ctx.accessToken) {
        void registerPushToken(ctx.accessToken).catch(() => {});
      }
    });

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const data = content.data as Record<string, unknown>;
      if (shouldSuppressForegroundAiPush(data)) return;
      if (data?.type !== "chat") return;
      onForegroundChat({
        peerId: String(
          data.chatId ?? data.chat_id ?? data.threadId ?? data.thread_id ?? "",
        ),
        senderName: typeof content.title === "string" ? content.title : "New message",
        preview: typeof content.body === "string" ? content.body : "New message",
        messageId: String(data.messageId ?? ""),
      });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      onOpen(response.notification.request.content.data as Record<string, unknown>);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (handledInitialIds.has(id)) return;
      handledInitialIds.add(id);
      onOpen(response.notification.request.content.data as Record<string, unknown>);
    });

    return () => {
      tokenSub.remove();
      appStateSub.remove();
      receivedSub.remove();
      responseSub.remove();
    };
  }
}
