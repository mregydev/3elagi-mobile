export type AiMessageRole = "user" | "assistant";

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
  pending?: boolean;
  error?: boolean;
  emotions?: import("@/domains/emotions/types").MessageEmotionItem[];
}

export interface AiConversation {
  id: string;
  title: string;
  patientContextId?: string | null;
  createdAt: string;
  updatedAt: string;
  messages: AiMessage[];
}

export interface AiChatResponse {
  conversationId: string;
  messageId: string;
  content: string;
  cacheHit: boolean;
}

export type AiStreamEvent =
  | { type: "ack"; conversationId?: string }
  | { type: "token"; content?: string }
  | {
      type: "done";
      conversationId?: string;
      messageId?: string;
      cacheHit?: boolean;
      content?: string;
    }
  | { type: "error"; error?: string; code?: string };
