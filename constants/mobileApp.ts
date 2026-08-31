import { Image } from "react-native";

export const ANDROID_APP_PACKAGE = "com.threelagi.mobile";

/** Google Drive page for the latest Android APK build. */
export const ANDROID_APP_URL =
  process.env.EXPO_PUBLIC_ANDROID_APP_URL ??
  "https://drive.google.com/file/d/1S5Eu8AWMWydfHR1vWPTpzZ_9Y6CqDw59/view";

export const ANDROID_INSTALL_PROMPT = require("@/assets/images/android-install-prompt.png");

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

const installAsset = readBundledAsset(ANDROID_INSTALL_PROMPT as BundledAsset);

export const ANDROID_INSTALL_PROMPT_URI = installAsset.uri;

const installNativeWidth = installAsset.width ?? 720;
const installNativeHeight = installAsset.height ?? 400;
const INSTALL_DISPLAY_WIDTH = 280;

export const ANDROID_INSTALL_PROMPT_SIZE = {
  width: INSTALL_DISPLAY_WIDTH,
  height: Math.round(
    INSTALL_DISPLAY_WIDTH * (installNativeHeight / installNativeWidth),
  ),
};
