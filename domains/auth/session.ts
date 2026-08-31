import { Platform } from "react-native";
import { getWebAccessToken, usesCookieAuth } from "@/domains/auth/http";

/** True when the user has a persisted session that can call the API. */
export function isSignedIn(
  profile: { id: string } | null | undefined,
  accessToken: string | null | undefined,
): boolean {
  if (!profile) return false;
  if (usesCookieAuth) return true;
  return !!accessToken;
}

/** Token used for Bearer auth and WebSocket handshakes. */
export function resolveAccessToken(stored: string | null | undefined): string | null {
  if (!usesCookieAuth) return stored?.trim() || null;
  return getWebAccessToken();
}
