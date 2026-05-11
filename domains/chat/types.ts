export type Presence = "online" | "away" | "offline";

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl: string;
  presence: Presence;
  lastSeenAt?: string;
  role?: "doctor" | "patient" | "support";
  specialty?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  user: ChatUser;
  lastMessage?: ChatMessage;
  unreadCount: number;
}
