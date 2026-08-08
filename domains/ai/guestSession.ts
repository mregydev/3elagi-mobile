import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_ID_KEY = "3elagi-ai-guest-id";
const GUEST_COUNT_KEY = "3elagi-ai-guest-sent-count";

/** Max user messages before asking guests to log in / sign up. */
export const GUEST_AI_MAX_MESSAGES = 3;

function makeGuestId(): string {
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

let memoryGuestId: string | null = null;
let memorySentCount: number | null = null;

export async function getGuestAiSessionId(): Promise<string> {
  if (memoryGuestId) return memoryGuestId;
  try {
    const stored = await AsyncStorage.getItem(GUEST_ID_KEY);
    if (stored && stored.length >= 8) {
      memoryGuestId = stored;
      return stored;
    }
  } catch {
    // ignore
  }
  const next = makeGuestId();
  memoryGuestId = next;
  void AsyncStorage.setItem(GUEST_ID_KEY, next);
  return next;
}

export async function getGuestAiSentCount(): Promise<number> {
  if (memorySentCount != null) return memorySentCount;
  try {
    const raw = await AsyncStorage.getItem(GUEST_COUNT_KEY);
    const n = raw ? Number(raw) : 0;
    memorySentCount = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    memorySentCount = 0;
  }
  return memorySentCount;
}

export async function setGuestAiSentCount(count: number): Promise<void> {
  const next = Math.max(0, Math.floor(count));
  memorySentCount = next;
  void AsyncStorage.setItem(GUEST_COUNT_KEY, String(next));
}

export async function clearGuestAiSentCount(): Promise<void> {
  memorySentCount = 0;
  void AsyncStorage.removeItem(GUEST_COUNT_KEY);
}
