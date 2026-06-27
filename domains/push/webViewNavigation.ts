import type { PushNotificationData } from "@/domains/push/types";
import { getPushNotificationPath } from "@/domains/push/navigation";

type WebAppNavigator = (path: string) => void;

let navigate: WebAppNavigator | null = null;
let pendingPath: string | null = null;

export function setWebAppNavigator(fn: WebAppNavigator | null): void {
  navigate = fn;
  if (fn && pendingPath) {
    fn(pendingPath);
    pendingPath = null;
  }
}

export function navigateWebAppPath(path: string): void {
  if (navigate) {
    navigate(path);
    return;
  }
  pendingPath = path;
}

export function navigateFromPushToWebApp(data: PushNotificationData): void {
  navigateWebAppPath(getPushNotificationPath(data));
}
