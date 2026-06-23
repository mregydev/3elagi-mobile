import messaging from "@react-native-firebase/messaging";
import { PermissionsAndroid, Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const CHAT_ANDROID_CHANNEL_ID = "chat-messages";

export async function ensureChatNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHAT_ANDROID_CHANNEL_ID, {
    name: "Chat messages",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "ios") {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  return true;
}

export async function getFcmToken(): Promise<string | null> {
  try {
    return await messaging().getToken();
  } catch {
    return null;
  }
}

export async function initFirebaseMessaging(): Promise<string | null> {
  await ensureChatNotificationChannel();
  await requestNotificationPermission();
  return getFcmToken();
}

export function subscribeToFcmTokenRefresh(
  onToken: (token: string) => void,
): () => void {
  return messaging().onTokenRefresh(onToken);
}

export function subscribeToForegroundFcm(
  onMessage: (data: {
    peerId: string;
    senderName: string;
    preview: string;
    messageId: string;
  }) => void,
): () => void {
  return messaging().onMessage(async (remoteMessage) => {
    const data = remoteMessage.data ?? {};
    if (data.type !== "chat" || !data.peer_id) return;

    const senderName =
      typeof data.sender_name === "string"
        ? data.sender_name
        : typeof data.title === "string"
          ? data.title.replace(/ sends a new message$/, "")
          : "Someone";
    const preview = typeof data.body === "string" ? data.body : "New message";

    onMessage({
      peerId: String(data.peer_id),
      senderName,
      preview,
      messageId: String(data.message_id ?? ""),
    });
  });
}

export function subscribeToNotificationOpen(
  onOpen: (peerId: string) => void,
): () => void {
  const unsubOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
    const peerId = remoteMessage.data?.peer_id;
    if (peerId) onOpen(String(peerId));
  });

  void messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      const peerId = remoteMessage?.data?.peer_id;
      if (peerId) onOpen(String(peerId));
    });

  return unsubOpened;
}
