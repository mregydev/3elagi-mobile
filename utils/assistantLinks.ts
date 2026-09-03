import { router } from "expo-router";

/** Navigate in-app for assistant markdown links; return false to block default. */
export function handleAssistantLink(url: string): boolean {
  const path = normalizeAssistantLinkPath(url);
  if (path.startsWith("/medical/")) {
    const id = path.replace("/medical/", "").split("?")[0];
    if (id) {
      router.push({ pathname: "/medical/[id]", params: { id } });
      return false;
    }
  }
  if (path.startsWith("/doctor/")) {
    const doctorId = path.replace("/doctor/", "").split("?")[0];
    if (doctorId) {
      router.push({ pathname: "/doctor/[doctorId]", params: { doctorId } });
      return false;
    }
  }
  return true;
}

function normalizeAssistantLinkPath(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("/")) {
    return trimmed.split("?")[0];
  }
  try {
    const parsed = new URL(trimmed, "https://3elagi.local");
    return parsed.pathname;
  } catch {
    return trimmed;
  }
}
