import { OneSignal, LogLevel } from "react-native-onesignal";
import { ONESIGNAL_APP_ID } from "@/constants/onesignal";

let initialized = false;

export function initOneSignal(): void {
  if (initialized) return;
  if (__DEV__) {
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  }
  OneSignal.initialize(ONESIGNAL_APP_ID);
  initialized = true;
  console.log("[push] OneSignal initialized");
}

export async function requestOneSignalPermission(): Promise<boolean> {
  return OneSignal.Notifications.requestPermission(true);
}

export function loginOneSignalUser(externalId: string): void {
  if (!externalId.trim()) return;
  OneSignal.login(externalId.trim());
  console.log("[push] OneSignal login:", externalId);
}

export function logoutOneSignalUser(): void {
  OneSignal.logout();
  console.log("[push] OneSignal logout");
}

export type OneSignalNotificationClickEvent = {
  notification: { additionalData?: Record<string, unknown> };
};

export type OneSignalForegroundEvent = {
  getNotification: () => { additionalData?: Record<string, unknown> };
};

export function addOneSignalClickListener(
  listener: (event: OneSignalNotificationClickEvent) => void,
): () => void {
  OneSignal.Notifications.addEventListener("click", listener);
  return () => OneSignal.Notifications.removeEventListener("click", listener);
}

export function addOneSignalForegroundListener(
  listener: (event: OneSignalForegroundEvent) => void,
): () => void {
  OneSignal.Notifications.addEventListener("foregroundWillDisplay", listener);
  return () =>
    OneSignal.Notifications.removeEventListener("foregroundWillDisplay", listener);
}
