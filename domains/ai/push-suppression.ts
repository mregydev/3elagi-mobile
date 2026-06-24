import { AppState } from "react-native";

let assistantScreenActive = false;
let activeAiChatId: string | null = null;

export function setAssistantScreenActive(active: boolean): void {
  assistantScreenActive = active;
  if (!active) activeAiChatId = null;
}

export function setActiveAiChatId(chatId: string | null): void {
  activeAiChatId = chatId;
}

/** Suppress AI push in foreground when the user is already on that conversation. */
export function shouldSuppressAiPush(chatId: string): boolean {
  if (!chatId || !assistantScreenActive) return false;
  if (AppState.currentState !== "active") return false;
  if (!activeAiChatId) return false;
  return activeAiChatId === chatId;
}

export function isAssistantScreenActive(): boolean {
  return assistantScreenActive;
}
