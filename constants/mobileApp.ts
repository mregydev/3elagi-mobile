export const ANDROID_APP_PACKAGE = "com.threelagi.mobile";

export const ANDROID_APP_URL =
  process.env.EXPO_PUBLIC_ANDROID_APP_URL ??
  "https://exp-shell-app-assets.s3.us-west-1.amazonaws.com/android/%40abdallah_medhat%2Fpoints-app-fb3663b6a90847248e58f3316982626e-signed.apk";

export const ANDROID_APP_QR = require("@/assets/images/android-app-qr.png");

/** Resolved URI for web/mobile-web where bundled `require()` can fail to paint. */
export const ANDROID_APP_QR_URI: string | undefined = (() => {
  try {
    const { Image } = require("react-native") as typeof import("react-native");
    return Image.resolveAssetSource(ANDROID_APP_QR)?.uri;
  } catch {
    return undefined;
  }
})();

export const ANDROID_APP_QR_SIZE = { width: 220, height: Math.round(220 * (536 / 552)) };
