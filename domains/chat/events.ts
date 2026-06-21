export const CHAT_EVENTS = {
  MESSAGE_SENT: 'chat:message_sent',
  CLEARED:      'chat:cleared',
} as const

export interface ChatMessageSentPayload { token: string }
export interface ChatClearedPayload {}
