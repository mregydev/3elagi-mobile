import { Image, Platform } from "react-native";

export const ANDROID_APP_PACKAGE = "com.threelagi.mobile";

export const ANDROID_APP_URL =
  process.env.EXPO_PUBLIC_ANDROID_APP_URL ??
  "https://exp-shell-app-assets.s3.us-west-1.amazonaws.com/android/%40abdallah_medhat%2Fpoints-app-fb3663b6a90847248e58f3316982626e-signed.apk";

export const ANDROID_APP_QR = require("@/assets/images/android-app-qr.png");

type BundledAsset = number | { uri?: string; width?: number; height?: number };

function readBundledAsset(asset: BundledAsset) {
  if (typeof asset === "object" && asset !== null) {
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
    };
  }
  try {
    const resolved = Image.resolveAssetSource(asset);
    return {
      uri: resolved?.uri,
      width: resolved?.width,
      height: resolved?.height,
    };
  } catch {
    return { uri: undefined, width: undefined, height: undefined };
  }
}

const qrAsset = readBundledAsset(ANDROID_APP_QR as BundledAsset);

/** Resolved URI for web/mobile-web where bundled PNGs need a direct src. */
export const ANDROID_APP_QR_URI = qrAsset.uri;

const qrNativeWidth = qrAsset.width ?? 566;
const qrNativeHeight = qrAsset.height ?? 576;
const QR_DISPLAY_WIDTH = Platform.OS === "web" ? 220 : 200;

export const ANDROID_APP_QR_SIZE = {
  width: QR_DISPLAY_WIDTH,
  height: Math.round(QR_DISPLAY_WIDTH * (qrNativeHeight / qrNativeWidth)),
};
