import { Platform } from "react-native";
import { getExpoPushToken } from "@/domains/push/expoPush";
import { registerPushToken as registerPushTokenApi } from "@/domains/push/api";

let lastRegistered: { token: string; accessToken: string } | null = null;

/** Registers the Expo push token with the API (idempotent per session). */
export async function registerPushToken(accessToken: string): Promise<void> {
  if (Platform.OS === "web" || !accessToken) return;

  const token = await getExpoPushToken();
  if (!token) return;

  if (
    lastRegistered?.token === token &&
    lastRegistered?.accessToken === accessToken
  ) {
    return;
  }

  await registerPushTokenApi(token, accessToken);
  lastRegistered = { token, accessToken };
  if (__DEV__) console.log("[push] Expo push token registered with API");
}

export function clearPushTokenRegistrationCache(): void {
  lastRegistered = null;
}
