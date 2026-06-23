import { useEffect } from "react";
import { mapEmotionRows } from "@/domains/emotions/types";
import { useAuthStore } from "@/domains/auth/store";
import { useChatStore } from "@/domains/chat/store";
import {
  getPresenceSocket,
  onChatMessageDeleted,
  onChatMessageNew,
  onChatMessageUpdated,
  onChatStopTyping,
  onChatTyping,
  onMessageEmotionUpdated,
} from "@/domains/presence/socket";

export function ChatMessageSync() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const selfId = useAuthStore((s) => s.profile?.id ?? null);
  const activeChatPeerId = useChatStore((s) => s.activeChatPeerId);
  const handleIncomingMessage = useChatStore((s) => s.handleIncomingMessage);
  const handleIncomingMessageDelete = useChatStore((s) => s.handleIncomingMessageDelete);
  const handleIncomingMessageUpdate = useChatStore((s) => s.handleIncomingMessageUpdate);
  const updateMessageEmotions = useChatStore((s) => s.updateMessageEmotions);
  const setPeerTyping = useChatStore((s) => s.setPeerTyping);

  useEffect(() => {
    if (!accessToken || !selfId) return;

    const attachMessageHandlers = () => {
      onChatMessageNew((payload) => {
        handleIncomingMessage(payload, accessToken, selfId);
      });
      onChatMessageDeleted((payload) => {
        handleIncomingMessageDelete(payload, accessToken, selfId);
      });
      onChatMessageUpdated((payload) => {
        handleIncomingMessageUpdate(payload, accessToken, selfId);
      });
    };

    attachMessageHandlers();

    const socket = getPresenceSocket();
    const onConnect = () => attachMessageHandlers();
    socket?.on("connect", onConnect);

    return () => {
      socket?.off("connect", onConnect);
    };
  }, [accessToken, selfId, handleIncomingMessage, handleIncomingMessageDelete, handleIncomingMessageUpdate]);

  useEffect(() => {
    onMessageEmotionUpdated((payload) => {
      if (payload.message_source !== "chat") return;
      updateMessageEmotions(
        payload.message_id,
        mapEmotionRows(payload.emotions),
      );
    });
    return () => onMessageEmotionUpdated(null);
  }, [updateMessageEmotions]);

  useEffect(() => {
    onChatTyping((payload) => {
      if (payload.peer_id === selfId) return;
      if (activeChatPeerId && payload.peer_id !== activeChatPeerId) return;
      setPeerTyping(payload.peer_id, true);
    });
    onChatStopTyping((payload) => {
      if (payload.peer_id === selfId) return;
      setPeerTyping(payload.peer_id, false);
    });
    return () => {
      onChatTyping(null);
      onChatStopTyping(null);
    };
  }, [selfId, activeChatPeerId, setPeerTyping]);

  return null;
}
