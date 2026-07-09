import type { ChatMessage } from "./types";

export function messagePreviewText(
  message: ChatMessage | undefined,
  isRTL: boolean,
): string {
  if (!message) return "";
  switch (message.type) {
    case "image":
      return isRTL ? "📷 صورة" : "📷 Photo";
    case "video":
      return isRTL ? "🎬 فيديو" : "🎬 Video";
    case "voice":
      return isRTL ? "🎤 رسالة صوتية" : "🎤 Voice message";
    case "medical_link":
      return `📋 ${message.medicalLink?.title ?? message.text}`;
    case "access_action":
      return message.text;
    case "appointment_action":
      return message.text;
    case "consultation_action": {
      const meta = message.consultationAction;
      if (!meta) return message.text;
      if (meta.action === "start") {
        return isRTL ? "بدأت الاستشارة" : "Consultation started";
      }
      if (meta.action === "end") {
        return isRTL ? "انتهت الاستشارة" : "Consultation ended";
      }
      return isRTL ? "أُلغيت الاستشارة" : "Consultation cancelled";
    }
    default:
      return message.text;
  }
}
