export const CHAT_EVENTS = {
  MESSAGE_SENT: 'chat:message_sent',
  MESSAGE_RECEIVED: 'chat:message_received',
  CLEARED:      'chat:cleared',
} as const

export interface ChatMessageSentPayload { token: string }

export interface ChatMessageReceivedPayload {
  peerId: string;
  senderName: string;
  preview: string;
  messageId: string;
}

export interface ChatClearedPayload {}
