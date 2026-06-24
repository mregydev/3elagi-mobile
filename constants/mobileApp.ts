export const ANDROID_APP_PACKAGE = "com.threelagi.mobile";

export const ANDROID_APP_URL =
  process.env.EXPO_PUBLIC_ANDROID_APP_URL ??
  `https://play.google.com/store/apps/details?id=${ANDROID_APP_PACKAGE}`;

export const ANDROID_APP_QR = require("@/assets/images/android-app-qr.png");
