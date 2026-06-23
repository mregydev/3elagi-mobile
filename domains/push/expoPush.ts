import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const CHAT_PUSH_CHANNEL_ID = "chat-messages";

function resolveExpoProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined
  );
}

export async function ensureChatPushChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHAT_PUSH_CHANNEL_ID, {
    name: "Chat messages",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function requestPushPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (!Device.isDevice) {
    if (__DEV__) console.warn("[push] Push tokens require a physical device");
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/** Returns an Expo push token (`ExponentPushToken[...]`). */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web" || !Device.isDevice) return null;

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    if (__DEV__) console.warn("[push] Missing EAS projectId in app.json extra.eas");
    return null;
  }

  await ensureChatPushChannel();
  const granted = await requestPushPermission();
  if (!granted) return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    if (__DEV__) {
      console.warn("[push] getExpoPushTokenAsync failed:", (error as Error).message);
    }
    return null;
  }
}
