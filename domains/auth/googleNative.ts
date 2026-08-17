import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { GOOGLE_CLIENT_ID } from "@/domains/auth/google";

/**
 * Native OAuth client (Android/iOS). Must be listed in the API's allowed
 * audiences — see GOOGLE_CLIENT_MOBILE_ID / GOOGLE_MOBILE_CLIENT_ID on Cloud Run.
 */
export const GOOGLE_CLIENT_MOBILE_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_MOBILE_ID ??
  "773972750372-8ggmkp52i76ruevgvtpo0ummg1vttdeo.apps.googleusercontent.com";

// Closes the in-app browser tab once Google redirects back.
WebBrowser.maybeCompleteAuthSession();

function platformClientId(): string {
  if (Platform.OS === "android") {
    return (
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? GOOGLE_CLIENT_MOBILE_ID
    );
  }
  if (Platform.OS === "ios") {
    return (
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? GOOGLE_CLIENT_MOBILE_ID
    );
  }
  return GOOGLE_CLIENT_MOBILE_ID;
}

export function useGoogleNativeSignIn(onIdToken: (idToken: string) => void) {
  const androidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? GOOGLE_CLIENT_MOBILE_ID;
  const iosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? GOOGLE_CLIENT_MOBILE_ID;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    // Android ID tokens use the web client id as `aud`.
    clientId: GOOGLE_CLIENT_ID,
    androidClientId,
    iosClientId,
    scopes: ["openid", "email", "profile"],
  });

  // A response object is stable per attempt; guard so a re-render cannot submit
  // the same token twice.
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken =
      response.params?.id_token ?? response.authentication?.idToken ?? null;
    if (!idToken || handledRef.current === idToken) return;
    handledRef.current = idToken;
    onIdToken(idToken);
  }, [response, onIdToken]);

  const ready =
    !!request && !!GOOGLE_CLIENT_ID && !!platformClientId();

  return { ready, promptAsync };
}
