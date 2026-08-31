export const ANDROID_APP_PACKAGE = "com.threelagi.mobile";

/** Google Drive page for the latest Android APK build. */
export const ANDROID_APP_URL =
  process.env.EXPO_PUBLIC_ANDROID_APP_URL ??
  "https://drive.google.com/file/d/1S5Eu8AWMWydfHR1vWPTpzZ_9Y6CqDw59/view";

/** Supabase public storage — Android install prompt screenshot. */
export const ANDROID_INSTALL_PROMPT_URL =
  process.env.EXPO_PUBLIC_ANDROID_INSTALL_PROMPT_URL ??
  "https://hjluqxfmvpvtjvwzqxgi.supabase.co/storage/v1/object/public/files/static/android-install-prompt.png";

export const ANDROID_INSTALL_PROMPT_SIZE = {
  width: 280,
  height: 156,
};
