/** Web stub — OneSignal push is native-only. */
export function initOneSignal(): void {}

export async function requestOneSignalPermission(): Promise<boolean> {
  return false;
}

export function loginOneSignalUser(_externalId: string): void {}

export function logoutOneSignalUser(): void {}

export type OneSignalNotificationClickEvent = {
  notification: { additionalData?: Record<string, unknown> };
};

export type OneSignalForegroundEvent = {
  getNotification: () => { additionalData?: Record<string, unknown> };
};

export function addOneSignalClickListener(
  _listener: (event: OneSignalNotificationClickEvent) => void,
): () => void {
  return () => {};
}

export function addOneSignalForegroundListener(
  _listener: (event: OneSignalForegroundEvent) => void,
): () => void {
  return () => {};
}
