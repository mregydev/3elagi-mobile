import { Platform } from "react-native";
import { API_BASE } from "@/constants/api";

export const usesCookieAuth = Platform.OS === "web";

let webAccessToken: string | null = null;

export function getWebAccessToken(): string | null {
  return webAccessToken;
}

export function setWebAccessToken(token: string | null) {
  webAccessToken = token?.trim() || null;
}

export function authClientHeaders(accessToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (usesCookieAuth) return headers;
  headers["X-Auth-Client"] = "native";
  if (accessToken?.trim()) {
    headers.Authorization = `Bearer ${accessToken.trim()}`;
  }
  return headers;
}

export function withAuthRequestInit(
  accessToken?: string | null,
  init?: RequestInit,
): RequestInit {
  const baseHeaders = authClientHeaders(accessToken);
  const extra = init?.headers
    ? Object.fromEntries(new Headers(init.headers as HeadersInit).entries())
    : {};
  return {
    ...init,
    credentials: usesCookieAuth ? "include" : "omit",
    headers: {
      ...baseHeaders,
      ...extra,
    },
  };
}

export async function fetchWebAccessToken(): Promise<string | null> {
  if (!usesCookieAuth) return null;
  const res = await fetch(`${API_BASE}/auth/access-token`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    setWebAccessToken(null);
    return null;
  }
  const token =
    typeof data?.access_token === "string" ? data.access_token.trim() : null;
  setWebAccessToken(token);
  return token;
}

export async function refreshAuthSession(refreshToken?: string | null) {
  const res = await fetch(`${API_BASE}/auth/refresh`, withAuthRequestInit(null, {
    method: "POST",
    body: usesCookieAuth
      ? undefined
      : JSON.stringify({ refresh_token: refreshToken ?? undefined }),
  }));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ??
        data?.error ??
        `Refresh failed (${res.status})`,
    );
  }
  const access =
    typeof data?.access_token === "string" ? data.access_token.trim() : null;
  if (usesCookieAuth) {
    setWebAccessToken(access);
  }
  return {
    accessToken: access,
    refreshToken:
      typeof data?.refresh_token === "string" ? data.refresh_token.trim() : refreshToken ?? null,
    raw: data as Record<string, unknown>,
  };
}

export async function logoutAuthSession(refreshToken?: string | null) {
  await fetch(`${API_BASE}/auth/logout`, withAuthRequestInit(null, {
    method: "POST",
    body: usesCookieAuth
      ? undefined
      : JSON.stringify({ refresh_token: refreshToken ?? undefined }),
  })).catch(() => undefined);
  setWebAccessToken(null);
}
