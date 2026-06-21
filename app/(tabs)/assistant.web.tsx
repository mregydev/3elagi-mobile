import { Redirect } from "expo-router";
import React from "react";
import { AssistantWebView } from "@/components/assistant/AssistantWebView";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { useAiAssistant } from "@/hooks/useAiAssistant";

export default function AssistantScreenWeb() {
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const signedIn = isSignedIn(profile, accessToken);

  const assistant = useAiAssistant();

  if (!hydrated) return null;
  if (!signedIn) return <Redirect href="/welcome" />;

  return (
    <AssistantWebView
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
