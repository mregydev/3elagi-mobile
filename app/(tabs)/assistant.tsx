import { Redirect, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { AssistantMobileView } from "@/components/assistant/AssistantMobileView";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useAiAssistant } from "@/hooks/useAiAssistant";

export default function AssistantScreen() {
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const { chatId } = useLocalSearchParams<{ chatId?: string }>();
  const signedIn = isSignedIn(profile, accessToken);
  const assistant = useAiAssistant();

  useEffect(() => {
    if (typeof chatId !== "string" || !chatId) return;
    assistant.setActiveId(chatId);
  }, [chatId, assistant.setActiveId]);

  if (!hydrated) return null;
  if (!signedIn) return <Redirect href="/welcome" />;

  return (
    <AssistantMobileView
      conversations={assistant.conversations}
      activeConversation={assistant.activeConversation}
      activeId={assistant.activeId}
      loadingHistory={assistant.loadingHistory}
      sending={assistant.sending}
      error={assistant.error}
      historyError={assistant.historyError}
      canRetry={assistant.canRetry}
      onSelectConversation={assistant.setActiveId}
      onNewChat={assistant.startNewChat}
      onDeleteConversation={(id) => void assistant.removeConversation(id)}
      onSend={(text) => void assistant.sendMessage(text)}
      onRetry={() => void assistant.retryLast()}
      selfUserId={assistant.selfUserId}
      onToggleMessageEmotion={(messageId, emotion) =>
        void assistant.toggleMessageEmotion(messageId, emotion)
      }
    />
  );
}
