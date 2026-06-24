import { Platform } from "react-native";
import { registerPushToken as registerPushTokenApi } from "@/domains/push/api";
import { getExpoPushToken } from "@/domains/push/expoPush";

let lastRegistered: { token: string; accessToken: string } | null = null;

/** Registers the Expo push token (`ExponentPushToken[...]`) with the API. */
export async function registerPushToken(accessToken: string): Promise<string | null> {
  if (Platform.OS === "web" || !accessToken) return null;

  const token = await getExpoPushToken();
  if (!token) {
    console.warn(
      "[push] No Expo token to register — open the native app on a physical device, allow notifications, then log in again.",
    );
    return null;
  }

  if (
    lastRegistered?.token === token &&
    lastRegistered?.accessToken === accessToken
  ) {
    return token;
  }

  try {
    await registerPushTokenApi(token, accessToken);
    lastRegistered = { token, accessToken };
    console.log("[push] Expo push token registered with API");
    return token;
  } catch (error) {
    lastRegistered = null;
    console.warn("[push] API registration failed:", (error as Error).message);
    throw error;
  }
}

export function clearPushTokenRegistrationCache(): void {
  lastRegistered = null;
}
