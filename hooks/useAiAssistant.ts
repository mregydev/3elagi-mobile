import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/domains/auth/store";
import { fetchAiHistory, deleteAiConversation } from "@/domains/ai/api";
import { formatAiChatError } from "@/domains/ai/errors";
import { setMessageEmotion } from "@/domains/emotions/api";
import { mapEmotionRows, type MessageEmotionItem, type MessageEmotionType, type AiFeedbackType } from "@/domains/emotions/types";
import { requestAiHistory, sendAiMessageViaSocket } from "@/domains/ai/socket";
import { getPresenceSocket, onMessageEmotionUpdated } from "@/domains/presence/socket";
import type { AiConversation, AiMessage } from "@/domains/ai/types";
import { useI18n } from "@/hooks/useI18n";

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function patchAssistantMessage(
  conversations: AiConversation[],
  conversationKey: string,
  assistantLocalId: string,
  patch: Partial<AiMessage>,
  nextConversationId?: string,
): AiConversation[] {
  return conversations.map((c) => {
    if (c.id !== conversationKey && c.id !== nextConversationId) return c;
    return {
      ...c,
      id: nextConversationId ?? c.id,
      messages: c.messages.map((m) =>
        m.id === assistantLocalId ? { ...m, ...patch } : m,
      ),
    };
  });
}

async function loadHistoryWithFallback(accessToken: string): Promise<AiConversation[]> {
  const socket = getPresenceSocket();
  if (socket?.connected) {
    try {
      return await requestAiHistory();
    } catch {
      // fall through to HTTP
    }
  }
  return fetchAiHistory(accessToken);
}

function mapConversationEmotions(conversation: AiConversation): AiConversation {
  return {
    ...conversation,
    messages: conversation.messages.map((message) => ({
      ...message,
      emotions: mapEmotionRows(
        (message as AiMessage & { emotions?: Array<{ user_id: string; emotion: MessageEmotionType }> })
          .emotions,
      ),
    })),
  };
}

export function useAiAssistant() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const selfUserId = useAuthStore((s) => s.profile?.id ?? null);
  const { isRTL } = useI18n();
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [rateLimitReached, setRateLimitReached] = useState(false);
  const [canRetry, setCanRetry] = useState(true);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  const updateMessageEmotions = useCallback(
    (messageId: string, emotions: MessageEmotionItem[]) => {
      setConversations((prev) =>
        prev.map((conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId ? { ...message, emotions } : message,
          ),
        })),
      );
    },
    [],
  );

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const loadHistory = useCallback(async () => {
    if (!accessToken) return;
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const rows = (await loadHistoryWithFallback(accessToken)).map(mapConversationEmotions);
      setConversations(rows);
      setActiveId((current) => current ?? rows[0]?.id ?? null);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Failed to load history",
      );
    } finally {
      setLoadingHistory(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setChatError(null);
    setRateLimitReached(false);
    setCanRetry(true);
  }, []);

  const removeConversation = useCallback(
    async (conversationId: string) => {
      if (!accessToken || conversationId.startsWith("draft-")) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeId === conversationId) setActiveId(null);
        return;
      }
      await deleteAiConversation(accessToken, conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeId === conversationId) setActiveId(null);
    },
    [accessToken, activeId],
  );

  const sendMessage = useCallback(
    async (text: string, patientUserId?: string) => {
      if (!accessToken || !text.trim()) return;
      const question = text.trim();
      setLastQuestion(question);
      setChatError(null);
      setRateLimitReached(false);
      setCanRetry(true);
      setSending(true);
      setStreaming(true);

      const userMessage: AiMessage = {
        id: makeId("user"),
        role: "user",
        content: question,
        createdAt: new Date().toISOString(),
      };
      const assistantLocalId = makeId("assistant");
      const assistantMessage: AiMessage = {
        id: assistantLocalId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        pending: true,
      };

      const isDraft = !activeId || activeId.startsWith("draft-");
      const conversationKey = isDraft ? makeId("draft") : activeId!;
      const serverConversationId = isDraft ? undefined : activeId ?? undefined;

      if (isDraft) {
        const draft: AiConversation = {
          id: conversationKey,
          title: question.slice(0, 80) || "New chat",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [userMessage, assistantMessage],
        };
        setConversations((prev) => [draft, ...prev]);
        setActiveId(conversationKey);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationKey
              ? {
                  ...c,
                  updatedAt: new Date().toISOString(),
                  messages: [...c.messages, userMessage, assistantMessage],
                }
              : c,
          ),
        );
      }

      let resolvedConversationId = serverConversationId;
      let assistantContent = "";
      let ackReceived = false;

      try {
        await sendAiMessageViaSocket(
          {
            message: question,
            chatId: serverConversationId,
            patientUserId,
          },
          (event) => {
            if (event.type === "ack" && event.conversationId) {
              ackReceived = true;
              resolvedConversationId = event.conversationId;
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === conversationKey || c.id === event.conversationId
                    ? { ...c, id: event.conversationId! }
                    : c,
                ),
              );
              setActiveId(event.conversationId);
            }
            if (event.type === "token" && event.content) {
              assistantContent += event.content;
              setConversations((prev) =>
                patchAssistantMessage(
                  prev,
                  conversationKey,
                  assistantLocalId,
                  { content: assistantContent },
                  resolvedConversationId,
                ),
              );
            }
            if (event.type === "done") {
              if (event.conversationId) {
                resolvedConversationId = event.conversationId;
                setActiveId(event.conversationId);
              }
              const finalContent = event.content ?? assistantContent;
              assistantContent = finalContent;
              setConversations((prev) =>
                patchAssistantMessage(
                  prev,
                  conversationKey,
                  assistantLocalId,
                  {
                    id: event.messageId ?? assistantLocalId,
                    pending: false,
                    content: finalContent,
                  },
                  event.conversationId,
                ),
              );
            }
            if (event.type === "error") {
              const formatted = formatAiChatError(
                event.error,
                event.code,
                isRTL,
              );
              setRateLimitReached(formatted.isRateLimit);
              setCanRetry(formatted.canRetry);
            }
          },
        );

        setConversations((prev) =>
          patchAssistantMessage(
            prev,
            conversationKey,
            assistantLocalId,
            { pending: false, content: assistantContent },
            resolvedConversationId,
          ),
        );
      } catch (err) {
        const code =
          err instanceof Error && "code" in err
            ? (err as Error & { code?: string }).code
            : undefined;
        const formatted = formatAiChatError(
          err instanceof Error ? err.message : undefined,
          code,
          isRTL,
        );
        setChatError(formatted.message);
        setRateLimitReached(formatted.isRateLimit);
        setCanRetry(formatted.canRetry);

        if (!ackReceived) {
          setConversations((prev) => {
            const next = prev
              .map((c) => {
                if (c.id !== conversationKey && c.id !== resolvedConversationId) {
                  return c;
                }
                return {
                  ...c,
                  messages: c.messages.filter(
                    (m) => m.id !== userMessage.id && m.id !== assistantLocalId,
                  ),
                };
              })
              .filter((c) => c.messages.length > 0);
            if (isDraft && next.every((c) => c.id !== conversationKey)) {
              setActiveId(next[0]?.id ?? null);
            }
            return next;
          });
        } else {
          setConversations((prev) =>
            patchAssistantMessage(
              prev,
              conversationKey,
              assistantLocalId,
              {
                pending: false,
                error: true,
                content: formatted.message,
              },
              resolvedConversationId,
            ),
          );
        }
      } finally {
        setSending(false);
        setStreaming(false);
      }
    },
    [accessToken, activeId, isRTL],
  );

  useEffect(() => {
    onMessageEmotionUpdated((payload) => {
      if (payload.message_source !== "ai") return;
      updateMessageEmotions(payload.message_id, mapEmotionRows(payload.emotions));
    });
    return () => onMessageEmotionUpdated(null);
  }, [updateMessageEmotions]);

  const toggleMessageEmotion = useCallback(
    async (messageId: string, emotion: AiFeedbackType) => {
      if (!accessToken) return;
      try {
        const result = await setMessageEmotion(accessToken, messageId, "ai", emotion);
        updateMessageEmotions(messageId, mapEmotionRows(result.emotions));
      } catch (e) {
        Alert.alert(
          isRTL ? "تعذر الإضافة" : "Could not react",
          e instanceof Error ? e.message : isRTL ? "حاول مرة أخرى." : "Please try again.",
        );
      }
    },
    [accessToken, isRTL, updateMessageEmotions],
  );

  const retryLast = useCallback(async () => {
    if (!lastQuestion || !canRetry) return;
    await sendMessage(lastQuestion);
  }, [lastQuestion, sendMessage, canRetry]);

  return {
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    loadingHistory,
    sending,
    streaming,
    error: chatError,
    historyError,
    rateLimitReached,
    canRetry,
    loadHistory,
    startNewChat,
    removeConversation,
    sendMessage,
    retryLast,
    lastQuestion,
    selfUserId,
    toggleMessageEmotion,
  };
}
