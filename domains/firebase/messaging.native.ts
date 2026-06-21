import messaging from "@react-native-firebase/messaging";
import { PermissionsAndroid, Platform } from "react-native";

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
  await requestNotificationPermission();
  return getFcmToken();
}
