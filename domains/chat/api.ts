import { API_BASE } from "@/constants/api";
import type { MessageEmotionType } from "@/domains/emotions";
import { mapEmotionRows } from "@/domains/emotions";
import type {
  AccessActionMeta,
  ChatMessage,
  ChatMessageType,
  ChatUser,
  MedicalLinkMeta,
  SendMessageInput,
} from "./types";

export interface ChatContactRow {
  id: string;
  email: string;
  role: "doctor" | "patient" | "admin" | "clinic_admin";
  name: string;
  photo_url?: string | null;
  specialty?: string | null;
  doctor_id?: string | null;
  message_price?: number | null;
  rating_average?: number | null;
  rating_total?: number | null;
}

export interface MessageRow {
  id: string;
  type?: ChatMessageType;
  content: string;
  creator: string;
  recipient: string;
  datetime: string;
  attachment_url?: string | null;
  attachment_meta?: MedicalLinkMeta | AccessActionMeta | null;
  read_at?: string | null;
  edited_at?: string | null;
  points_balance?: number;
  emotions?: Array<{ user_id: string; emotion: MessageEmotionType }>;
}

export interface ConversationRow {
  peer_id: string;
  peer: ChatContactRow;
  last_message: MessageRow;
  unread_count?: number;
}

function mapContact(row: ChatContactRow): ChatUser {
  return {
    id: row.id,
    name: row.name,
    photoUrl: row.photo_url,
    presence: "offline",
    role: row.role === "doctor" ? "doctor" : row.role === "patient" ? "patient" : undefined,
    specialty: row.specialty?.trim() || undefined,
    rating: row.rating_average ?? undefined,
    ratingTotal: row.rating_total ?? undefined,
    messagePrice: row.message_price ?? undefined,
    doctorEntityId: row.doctor_id ?? undefined,
  };
}

export function mapMessageRow(
  row: MessageRow,
  peerId: string,
  selfId: string,
): ChatMessage {
  return {
    id: row.id,
    conversationId: peerId,
    senderId: row.creator === selfId ? "me" : row.creator,
    text: row.content,
    createdAt: row.datetime,
    type: row.type ?? "text",
    attachmentUrl: row.attachment_url ?? null,
    medicalLink:
      row.type === "medical_link"
        ? (row.attachment_meta as MedicalLinkMeta | undefined) ?? null
        : null,
    accessAction:
      row.type === "access_action"
        ? (row.attachment_meta as AccessActionMeta | undefined) ?? null
        : null,
    editedAt: row.edited_at ?? null,
    pointsBalance: row.points_balance,
    emotions: mapEmotionRows(row.emotions),
  };
}

export async function fetchChatContacts(token: string): Promise<ChatUser[]> {
  const res = await fetch(`${API_BASE}/users/contacts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => [])) as ChatContactRow[];
  if (!res.ok || !Array.isArray(data)) {
    throw new Error(
      (data as { message?: string })?.message ?? `Failed to load contacts (${res.status})`,
    );
  }
  return data.map(mapContact);
}

export async function fetchContactById(
  token: string,
  userId: string,
): Promise<ChatUser> {
  const res = await fetch(`${API_BASE}/users/contacts/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as ChatContactRow & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message ?? `Failed to load contact (${res.status})`);
  }
  return mapContact(data);
}

export async function fetchConversations(
  token: string,
  selfId: string,
): Promise<{ peerId: string; user: ChatUser; lastMessage: ChatMessage; unreadCount: number }[]> {
  const res = await fetch(`${API_BASE}/messages/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => [])) as ConversationRow[];
  if (!res.ok || !Array.isArray(data)) {
    throw new Error(
      (data as { message?: string })?.message ?? `Failed to load conversations (${res.status})`,
    );
  }
  return data.map((row) => ({
    peerId: row.peer_id,
    user: mapContact(row.peer),
    lastMessage: mapMessageRow(row.last_message, row.peer_id, selfId),
    unreadCount: row.unread_count ?? 0,
  }));
}

export async function fetchMessagesWithPeer(
  token: string,
  peerId: string,
  selfId: string,
): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/messages/with/${peerId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => [])) as MessageRow[];
  if (!res.ok || !Array.isArray(data)) {
    throw new Error(
      (data as { message?: string })?.message ?? `Failed to load messages (${res.status})`,
    );
  }
  return data.map((row) => mapMessageRow(row, peerId, selfId));
}

export async function sendChatMessage(
  token: string,
  input: SendMessageInput,
  selfId: string,
): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient_id: input.recipientId,
      type: input.type ?? "text",
      content: input.content,
      attachment_url: input.attachmentUrl,
      attachment_meta: input.accessAction ?? input.medicalLink,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as MessageRow & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Failed to send message (${res.status})`);
  }
  return mapMessageRow(data, input.recipientId, selfId);
}

export async function markMessagesRead(
  token: string,
  peerId: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/messages/with/${peerId}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? `Failed to mark read (${res.status})`);
  }
}

export async function deleteChatMessage(
  token: string,
  messageId: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/messages/${messageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? `Failed to delete message (${res.status})`);
  }
}

export async function editChatMessage(
  token: string,
  messageId: string,
  content: string,
  peerId: string,
  selfId: string,
): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE}/messages/${messageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  const data = (await res.json().catch(() => ({}))) as MessageRow & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Failed to edit message (${res.status})`);
  }
  return mapMessageRow(data, peerId, selfId);
}

export async function editChatMedicalMessage(
  token: string,
  messageId: string,
  peerId: string,
  selfId: string,
  input: { content: string; medicalLink: MedicalLinkMeta },
): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE}/messages/${messageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: input.content,
      attachment_meta: input.medicalLink,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as MessageRow & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Failed to update medical record (${res.status})`);
  }
  return mapMessageRow(data, peerId, selfId);
}
