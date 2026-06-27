import { useEffect } from "react";
import { Platform } from "react-native";
import { useAuthStore } from "@/domains/auth/store";
import {
  announcePresenceLogin,
  announcePresenceLogout,
  connectPresenceSocket,
  disconnectPresenceSocket,
} from "@/domains/presence/socket";
import type { LoggedInUser } from "@/domains/presence/types";
import { NATIVE_WEBVIEW_BRIDGE } from "@/constants/nativeWebViewBridge";
import { isNativeWebViewShell } from "@/utils/nativeWebViewBridge";

function buildLoggedInUser(
  profile: { id: string; name: string; email: string; avatarUrl?: string },
  role: string | null,
  specialty: string | null,
  specialityId: string | null,
  doctorId: string | null,
): LoggedInUser {
  const isDoctor = role?.toLowerCase() === "doctor";
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: role ?? "patient",
    photo_url: profile.avatarUrl ?? null,
    specialty: isDoctor ? specialty : null,
    speciality_id: isDoctor ? specialityId : null,
    doctor_id: isDoctor ? doctorId : null,
  };
}

export function PresenceSocket() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);
  const role = useAuthStore((s) => s.role);
  const specialty = useAuthStore((s) => s.specialty);
  const specialityId = useAuthStore((s) => s.specialityId);
  const doctorId = useAuthStore((s) => s.doctorId);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!hydrated) return;

    if (!profile || !accessToken) {
      disconnectPresenceSocket();
      return;
    }

    const user = buildLoggedInUser(profile, role, specialty, specialityId, doctorId);
    connectPresenceSocket(user, accessToken);

    return () => {
      disconnectPresenceSocket(profile.id);
    };
  }, [hydrated, profile?.id, accessToken]);

  useEffect(() => {
    if (!hydrated || !profile || !accessToken) return;

    const user = buildLoggedInUser(profile, role, specialty, specialityId, doctorId);
    announcePresenceLogin(user, accessToken);
  }, [
    hydrated,
    profile?.id,
    profile?.name,
    profile?.email,
    profile?.avatarUrl,
    role,
    specialty,
    specialityId,
    doctorId,
    accessToken,
  ]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!hydrated || !profile || !accessToken) return;
    if (typeof document === "undefined") return;

    const user = buildLoggedInUser(profile, role, specialty, specialityId, doctorId);

    const onVisibilityChange = () => {
      if (document.hidden) {
        announcePresenceLogout(profile.id);
      } else {
        announcePresenceLogin(user, accessToken);
      }
    };

    const onWindowFocus = () => {
      announcePresenceLogin(user, accessToken);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onWindowFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [
    hydrated,
    profile?.id,
    profile?.name,
    profile?.email,
    profile?.avatarUrl,
    role,
    specialty,
    specialityId,
    doctorId,
    accessToken,
  ]);

  useEffect(() => {
    if (!isNativeWebViewShell()) return;
    if (!hydrated || !profile || !accessToken) return;

    const user = buildLoggedInUser(profile, role, specialty, specialityId, doctorId);

    const onBackground = () => announcePresenceLogout(profile.id);
    const onForeground = () => announcePresenceLogin(user, accessToken);

    window.addEventListener(NATIVE_WEBVIEW_BRIDGE.APP_BACKGROUND, onBackground);
    window.addEventListener(NATIVE_WEBVIEW_BRIDGE.APP_FOREGROUND, onForeground);

    return () => {
      window.removeEventListener(NATIVE_WEBVIEW_BRIDGE.APP_BACKGROUND, onBackground);
      window.removeEventListener(NATIVE_WEBVIEW_BRIDGE.APP_FOREGROUND, onForeground);
    };
  }, [
    hydrated,
    profile?.id,
    profile?.name,
    profile?.email,
    profile?.avatarUrl,
    role,
    specialty,
    specialityId,
    doctorId,
    accessToken,
  ]);

  return null;
}
