import type { MessageEmotionItem } from "@/domains/emotions";

export type Presence = "online" | "away" | "offline";

export type ChatMessageType =
  | "text"
  | "image"
  | "video"
  | "voice"
  | "medical_link"
  | "document_request"
  | "access_action"
  | "appointment_action"
  | "consultation_action";

export type ConsultationStatus = "open" | "ended" | "cancelled";
export type ConsultationActionType = "start" | "end" | "cancel";
export type ConsultationCancelReasonType =
  | "video_consultation"
  | "onsite_visit"
  | "other";

export interface ConsultationDiagnosisSummary {
  id: string;
  desc: string;
  symptoms?: { desc: string }[];
  linked_records?: {
    id: string;
    title: string;
    record_type: "lab" | "xray";
  }[];
}

export interface ConsultationActionMeta {
  consultation_id: string;
  action: ConsultationActionType;
  status: ConsultationStatus;
  reserved_points?: number;
  cancel_reason_type?: ConsultationCancelReasonType;
  cancel_reason?: string;
  diagnosis_id?: string | null;
  diagnosis_summary?: ConsultationDiagnosisSummary | null;
}

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
  /** Doctor-configured video consultation length in minutes. */
  duration_minutes?: number;
  /** AI-written, doctor-facing note about why the patient booked + relevant history. */
  patient_insight?: string;
}

export interface MedicalLinkMeta {
  record_type: "lab" | "xray" | "diagnosis" | "intake";
  record_id: string;
  title: string;
  note?: string;
}

export interface DocumentRequestMeta {
  request_id: string;
  request_type: "lab" | "xray";
  title: string;
  description?: string;
  status: "pending" | "fulfilled" | "cancelled";
  /** Medical document id when the patient uploaded the lab/x-ray result. */
  fulfilled_document_id?: string;
}

export interface ChatUser {
  id: string;
  name: string;
  photoUrl?: string | null;
  presence: Presence;
  lastSeenAt?: string;
  role?: "doctor" | "patient" | "support";
  specialty?: string;
  /** ISO 3166-1 alpha-2 (doctors). */
  country?: string;
  rating?: number;
  ratingTotal?: number;
  consultationPrice?: number;
  videoConsultationPrice?: number;
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
  documentRequest?: DocumentRequestMeta | null;
  accessAction?: AccessActionMeta | null;
  appointmentAction?: AppointmentActionMeta | null;
  consultationAction?: ConsultationActionMeta | null;
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
  documentRequest?: DocumentRequestMeta;
  accessAction?: AccessActionMeta;
  appointmentAction?: AppointmentActionMeta;
}
