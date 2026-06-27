import { useFocusEffect } from "@react-navigation/native";
import { Redirect } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { AssistantMobileView } from "@/components/assistant/AssistantMobileView";
import { AssistantWebView } from "@/components/assistant/AssistantWebView";
import type { AiFeedbackType } from "@/domains/emotions/types";
import {
  setActiveAiChatId,
  setAssistantScreenActive,
} from "@/domains/ai/push-suppression";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import { useAssistantDeepLinkId } from "@/hooks/useAssistantDeepLinkId";
import { useWebLayout } from "@/hooks/useWebLayout";

export default function AssistantScreenWeb() {
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const conversationId = useAssistantDeepLinkId();
  const signedIn = isSignedIn(profile, accessToken);
  const { isDesktop } = useWebLayout();

  const assistant = useAiAssistant();

  useFocusEffect(
    useCallback(() => {
      setAssistantScreenActive(true);
      return () => setAssistantScreenActive(false);
    }, []),
  );

  useEffect(() => {
    if (conversationId) {
      assistant.setActiveId(conversationId);
    }
  }, [conversationId, assistant.setActiveId]);

  useEffect(() => {
    if (!assistant.activeId || assistant.activeId.startsWith("draft-")) {
      setActiveAiChatId(null);
      return;
    }
    setActiveAiChatId(assistant.activeId);
  }, [assistant.activeId]);

  if (!hydrated) return null;
  if (!signedIn) return <Redirect href="/welcome" />;

  const viewProps = {
    conversations: assistant.conversations,
    activeConversation: assistant.activeConversation,
    activeId: assistant.activeId,
    loadingHistory: assistant.loadingHistory,
    sending: assistant.sending,
    error: assistant.error,
    historyError: assistant.historyError,
    canRetry: assistant.canRetry,
    onSelectConversation: assistant.setActiveId,
    onNewChat: assistant.startNewChat,
    onDeleteConversation: (id: string) => void assistant.removeConversation(id),
    onSend: (text: string) => void assistant.sendMessage(text),
    onRetry: () => void assistant.retryLast(),
    selfUserId: assistant.selfUserId,
    onToggleMessageEmotion: (messageId: string, emotion: AiFeedbackType) =>
      void assistant.toggleMessageEmotion(messageId, emotion),
  };

  if (!isDesktop) {
    return <AssistantMobileView {...viewProps} />;
  }

  return <AssistantWebView {...viewProps} />;
}
