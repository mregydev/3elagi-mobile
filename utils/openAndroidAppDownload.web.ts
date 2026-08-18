import { ANDROID_APP_URL } from "@/constants/mobileApp";

/**
 * React Native Web's Linking.openURL calls window.open(url, "_blank"), which
 * mobile browsers routinely block for a cross-origin file — the tap did
 * nothing. A same-tab navigation to the APK is a plain download the browser
 * handles itself, no popup involved.
 */
export function openAndroidAppDownload(): void {
  if (typeof window === "undefined") return;
  window.location.assign(ANDROID_APP_URL);
}
