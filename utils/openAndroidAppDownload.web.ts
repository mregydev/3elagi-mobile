import { ANDROID_APP_URL } from "@/constants/mobileApp";

/** Trigger APK download in the mobile browser (avoids unreliable Linking.openURL on web). */
export function openAndroidAppDownload(): void {
  if (typeof window === "undefined") return;
  window.location.assign(ANDROID_APP_URL);
}
