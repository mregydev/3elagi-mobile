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

export function subscribeToFcmTokenRefresh(_onToken: (token: string) => void): () => void {
  return () => {};
}

export function subscribeToForegroundFcm(
  _onMessage: (data: {
    peerId: string;
    senderName: string;
    preview: string;
    messageId: string;
  }) => void,
): () => void {
  return () => {};
}

export function subscribeToNotificationOpen(_onOpen: (peerId: string) => void): () => void {
  return () => {};
}
