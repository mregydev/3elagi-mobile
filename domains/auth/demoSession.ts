import { Platform } from "react-native";
import type { DemoSlot } from "@/constants/demo";
import { isDemoSlot } from "@/constants/demo";

export const DEMO_SLOT_STORAGE_KEY = "3elagi-demo-slot";
const AUTH_KEY_PREFIX = "3elagi-auth";

/** Persist key for demo iframe panels — never writes to the main app session key. */
export function authPersistKeyForDemoSlot(slot: DemoSlot | null): string {
  return slot ? `${AUTH_KEY_PREFIX}-demo-${slot}` : AUTH_KEY_PREFIX;
}

export function readDemoSlotFromPathname(pathname: string): DemoSlot | null {
  const match = pathname.match(/^\/demo\/embed\/(mobile|laptop)\/?$/);
  const slot = match?.[1];
  return slot && isDemoSlot(slot) ? slot : null;
}

export function readDemoSlotFromSessionStorage(): DemoSlot | null {
  if (Platform.OS !== "web" || typeof sessionStorage === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(DEMO_SLOT_STORAGE_KEY);
    return stored && isDemoSlot(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function persistDemoSlot(slot: DemoSlot): void {
  if (Platform.OS !== "web" || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(DEMO_SLOT_STORAGE_KEY, slot);
  } catch {
    /* ignore quota / privacy mode */
  }
}

/** Resolved once per page load before auth store rehydrates. */
export function resolveInitialDemoSlot(): DemoSlot | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  return (
    readDemoSlotFromPathname(window.location.pathname) ??
    readDemoSlotFromSessionStorage()
  );
}

export function isDemoShellPath(pathname: string): boolean {
  return pathname === "/demo" || pathname.startsWith("/demo/");
}

export function isDemoEmbedPath(pathname: string): boolean {
  return /^\/demo\/embed\/(mobile|laptop)\/?$/.test(pathname);
}
