import type { MessageEmotionItem } from "@/domains/emotions";

export type Presence = "online" | "away" | "offline";

export type ChatMessageType =
  | "text"
  | "image"
  | "video"
  | "voice"
  | "medical_link"
  | "access_action"
  | "appointment_action";

export type AccessActionType =
  | "grant_records"
  | "revoke_records"
  | "patient_block"
  | "doctor_block"
  | "patient_unblock"
  | "doctor_unblock";

export interface AccessActionMeta {
  action: AccessActionType;
}

export type AppointmentActionType = "request" | "confirm" | "reject" | "cancel";

export interface AppointmentActionMeta {
  appointment_id: string;
  action: AppointmentActionType;
  date: string;
  time: string;
  status?: string;
  meeting_link?: string | null;
}

export interface MedicalLinkMeta {
  record_type: "lab" | "xray" | "diagnosis" | "intake";
  record_id: string;
  title: string;
  note?: string;
}

export interface ChatUser {
  id: string;
  name: string;
  photoUrl?: string | null;
  presence: Presence;
  lastSeenAt?: string;
  role?: "doctor" | "patient" | "support";
  specialty?: string;
  rating?: number;
  ratingTotal?: number;
  messagePrice?: number;
  doctorEntityId?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  type: ChatMessageType;
  attachmentUrl?: string | null;
  localAttachmentUrl?: string | null;
  medicalLink?: MedicalLinkMeta | null;
  accessAction?: AccessActionMeta | null;
  appointmentAction?: AppointmentActionMeta | null;
  pending?: boolean;
  failed?: boolean;
  editedAt?: string | null;
  pointsBalance?: number;
  emotions?: MessageEmotionItem[];
}

export interface Conversation {
  id: string;
  user: ChatUser;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface SendMessageInput {
  recipientId: string;
  type?: ChatMessageType;
  content?: string;
  attachmentUrl?: string;
  medicalLink?: MedicalLinkMeta;
  accessAction?: AccessActionMeta;
  appointmentAction?: AppointmentActionMeta;
}
