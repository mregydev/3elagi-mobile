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
    if (Platform.OS === "ios") {
      const registered = messaging().isDeviceRegisteredForRemoteMessages;
      if (!registered) {
        await messaging().registerDeviceForRemoteMessages();
      }
    }
    const token = await messaging().getToken();
    if (__DEV__ && token) {
      console.log("[push] FCM token acquired via Firebase Messaging");
    }
    return token;
  } catch (error) {
    if (__DEV__) {
      console.warn("[push] messaging().getToken() failed:", (error as Error).message);
    }
    return null;
  }
}

export async function initFirebaseMessaging(): Promise<string | null> {
  await ensureChatNotificationChannel();
  const granted = await requestNotificationPermission();
  if (!granted) return null;
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
    const peerId = data.chatId ?? data.chat_id ?? data.peer_id;
    if (data.type !== "chat" || !peerId) return;

    const senderName =
      typeof remoteMessage.notification?.title === "string"
        ? remoteMessage.notification.title
        : typeof data.sender_name === "string"
          ? data.sender_name
          : "New message";
    const preview =
      typeof remoteMessage.notification?.body === "string"
        ? remoteMessage.notification.body
        : typeof data.body === "string"
          ? data.body
          : "New message";

    onMessage({
      peerId: String(peerId),
      senderName,
      preview,
      messageId: String(data.messageId ?? data.message_id ?? ""),
    });
  });
}

export function subscribeToNotificationOpen(
  onOpen: (peerId: string) => void,
): () => void {
  const readPeerId = (data: Record<string, string | undefined> | undefined) =>
    data?.chatId ?? data?.chat_id ?? data?.peer_id;

  const unsubOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
    const peerId = readPeerId(remoteMessage.data);
    if (peerId) onOpen(String(peerId));
  });

  void messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      const peerId = readPeerId(remoteMessage?.data);
      if (peerId) onOpen(String(peerId));
    });

  return unsubOpened;
}
