import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { EXPO_EAS_PROJECT_ID, EXPO_PUSH_CHANNEL_ID } from "@/constants/expoPush";

export const CHAT_PUSH_CHANNEL_ID = EXPO_PUSH_CHANNEL_ID;

function resolveExpoProjectId(): string {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    EXPO_EAS_PROJECT_ID
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

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return status === "granted";
}

/** Returns an Expo push token (`ExponentPushToken[...]`). */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web" || !Device.isDevice) return null;

  const projectId = resolveExpoProjectId();
  if (__DEV__) {
    console.log(`[push] Resolving Expo token (projectId=${projectId})`);
  }

  await ensureChatPushChannel();
  const granted = await requestPushPermission();
  if (!granted) {
    if (__DEV__) console.warn("[push] Notification permission denied");
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    if (__DEV__) {
      console.log(`[push] Expo token acquired: ${token.data.slice(0, 32)}...`);
    }
    return token.data;
  } catch (error) {
    console.warn(
      "[push] getExpoPushTokenAsync failed:",
      (error as Error).message,
      "— ensure FCM V1 credentials are set in EAS (eas credentials) and rebuild the app.",
    );
    return null;
  }
}
