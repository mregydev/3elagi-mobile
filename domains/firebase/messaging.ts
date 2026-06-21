/** Web stub — push messaging is native-only. */
export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function getFcmToken(): Promise<string | null> {
  return null;
}

export async function initFirebaseMessaging(): Promise<string | null> {
  return null;
}
