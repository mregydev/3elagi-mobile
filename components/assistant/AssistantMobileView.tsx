import { Bot, History, Plus, RefreshCw } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  KeyboardEvents,
} from "react-native-keyboard-controller";
import { AssistantComposer } from "@/components/assistant/AssistantComposer";
import { AssistantHistoryModal } from "@/components/assistant/AssistantHistoryModal";
import { AssistantLoadingIndicator } from "@/components/assistant/AssistantLoadingIndicator";
import { AssistantMessageBubble } from "@/components/assistant/AssistantMessageBubble";
import type { AiConversation, AiMessage } from "@/domains/ai/types";
import type { AiFeedbackType } from "@/domains/emotions/types";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

const DISCLAIMER_EN =
  "For information only — not medical advice.";
const DISCLAIMER_AR =
  "للمعلومات فقط — وليس استشارة طبية.";

interface Props {
  conversations: AiConversation[];
  activeConversation: AiConversation | null;
  activeId: string | null;
  loadingHistory: boolean;
  sending: boolean;
  error: string | null;
  historyError?: string | null;
  canRetry?: boolean;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onSend: (text: string) => void;
  onRetry: () => void;
  selfUserId?: string | null;
  onToggleMessageEmotion?: (messageId: string, emotion: AiFeedbackType) => void;
}

export function AssistantMobileView({
  conversations,
  activeConversation,
  activeId,
  loadingHistory,
  sending,
  error,
  historyError,
  canRetry = true,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onSend,
  onRetry,
  selfUserId,
  onToggleMessageEmotion,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isRTL } = useI18n();
  const isEn = !isRTL;
  const isDoctor = useAuthStore((s) => s.role?.toLowerCase() === "doctor");
  const [historyOpen, setHistoryOpen] = useState(false);
  const listRef = useRef<FlatList<AiMessage>>(null);
  const isNearBottomRef = useRef(true);
  const initialScrollPendingRef = useRef(true);
  const messages =
    activeConversation?.messages ??
    (sending
      ? conversations.find((c) => c.messages.some((m) => m.pending))?.messages ?? []
      : []);
  const lastMessage = messages[messages.length - 1];

  const scrollToBottom = useCallback((animated = true) => {
    if (!listRef.current) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const scrollToBottomWithRetries = useCallback(
    (animated = false) => {
      scrollToBottom(animated);
      for (const delay of [50, 150, 300, 500, 800]) {
        setTimeout(() => scrollToBottom(animated), delay);
      }
    },
    [scrollToBottom],
  );

  useEffect(() => {
    initialScrollPendingRef.current = true;
    isNearBottomRef.current = true;
  }, [activeId]);

  useEffect(() => {
    if (loadingHistory || messages.length === 0) return;
    if (!initialScrollPendingRef.current) return;
    scrollToBottom(false);
    const timer = setTimeout(() => scrollToBottom(false), 100);
    initialScrollPendingRef.current = false;
    return () => clearTimeout(timer);
  }, [activeId, loadingHistory, messages.length, scrollToBottom]);

  const lastMessageId = lastMessage?.id;

  useEffect(() => {
    if (!sending) return;
    scrollToBottomWithRetries(false);
  }, [
    sending,
    messages.length,
    lastMessageId,
    lastMessage?.content,
    lastMessage?.pending,
    scrollToBottomWithRetries,
  ]);

  useEffect(() => {
    if (!lastMessageId) return;
    if (sending || isNearBottomRef.current) {
      scrollToBottomWithRetries(false);
    }
  }, [lastMessageId, sending, scrollToBottomWithRetries]);

  useEffect(() => {
    const showSub = KeyboardEvents.addListener("keyboardWillShow", () => {
      if (sending || isNearBottomRef.current) scrollToBottomWithRetries(true);
    });
    const didShowSub = KeyboardEvents.addListener("keyboardDidShow", () => {
      if (sending || isNearBottomRef.current) scrollToBottomWithRetries(false);
    });
    return () => {
      showSub.remove();
      didShowSub.remove();
    };
  }, [scrollToBottomWithRetries, sending]);

  const handleContentSizeChange = useCallback(() => {
    if (initialScrollPendingRef.current || sending || isNearBottomRef.current) {
      scrollToBottomWithRetries(false);
    }
  }, [scrollToBottomWithRetries, sending]);

  const handleScroll = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      if (sending) return;
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      isNearBottomRef.current = distanceFromBottom < 80;
    },
    [sending],
  );

  const handleSend = useCallback(
    (text: string) => {
      isNearBottomRef.current = true;
      onSend(text);
      scrollToBottomWithRetries(false);
    },
    [onSend, scrollToBottomWithRetries],
  );

  const handleNewChat = () => {
    onNewChat();
    setHistoryOpen(false);
  };

  const renderEmpty = () => (
    <View style={styles.centerEmpty}>
      <Bot color={colors.primary} size={36} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {isDoctor
          ? isEn
            ? "Ask about your practice"
            : "اسأل عن ممارستك الطبية"
          : isEn
            ? "Ask about your records"
            : "اسأل عن سجلاتك"}
      </Text>
      <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
        {isDoctor
          ? isEn
            ? "Which patients have I treated? What diagnoses did I add?"
            : "من المرضى الذين عالجتهم؟ ما التشخيصات التي أضفتها؟"
          : isEn
            ? "What allergies do I have?"
            : "ما هي حساسيتي؟"}
      </Text>
    </View>
  );

  const renderMessages = () => {
    if (loadingHistory && messages.length === 0) {
      return (
        <View style={styles.center}>
          <AssistantLoadingIndicator variant="history" />
        </View>
      );
    }

    return (
      <FlatList
        ref={listRef}
        style={styles.list}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AssistantMessageBubble
            message={item}
            compact
            selfUserId={selfUserId}
            onFeedback={
              onToggleMessageEmotion
                ? (emotion) => onToggleMessageEmotion(item.id, emotion)
                : undefined
            }
          />
        )}
        ListEmptyComponent={renderEmpty}
        extraData={`${messages.length}:${lastMessageId}:${lastMessage?.content?.length ?? 0}:${sending}`}
        contentContainerStyle={
          messages.length === 0 ? styles.messagesEmpty : styles.messages
        }
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onLayout={() => {
          if (sending || initialScrollPendingRef.current) {
            scrollToBottomWithRetries(false);
          }
        }}
        onContentSizeChange={handleContentSizeChange}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 4,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        <View style={[styles.headerRow, isRTL && styles.headerRowRtl]}>
          <Pressable onPress={() => setHistoryOpen(true)} hitSlop={10} style={styles.headerBtn}>
            <History color={colors.primary} size={20} />
          </Pressable>
          <Bot color={colors.primary} size={20} />
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isEn ? "AI Assistant" : "المساعد الذكي"}
          </Text>
          <Pressable onPress={handleNewChat} hitSlop={10} style={styles.headerBtn}>
            <Plus color={colors.primary} size={20} />
          </Pressable>
        </View>
        <Text
          numberOfLines={1}
          style={[styles.disclaimer, { color: colors.mutedForeground }]}
        >
          {isEn ? DISCLAIMER_EN : DISCLAIMER_AR}
        </Text>
      </View>

      <View style={styles.body}>{renderMessages()}</View>

      <View style={styles.footer}>
        {(error || historyError) ? (
          error && !canRetry ? (
            <View
              style={[
                styles.errorBar,
                { backgroundColor: colors.destructive + "18" },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={error ? onRetry : undefined}
              style={[
                styles.errorBar,
                { backgroundColor: colors.destructive + "18" },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error ?? historyError}
              </Text>
              {error || historyError ? (
                <RefreshCw size={14} color={colors.destructive} />
              ) : null}
            </Pressable>
          )
        ) : null}

        <AssistantComposer
          compact
          sending={sending}
          disabled={loadingHistory}
          bottomInset={0}
          placeholder={
            isDoctor
              ? isEn
                ? "Ask about your patients, diagnoses, records…"
                : "اسأل عن مرضاك، التشخيصات، السجلات…"
              : isEn
                ? "Ask about allergies, labs, prescriptions…"
                : "اسأل عن الحساسية، التحاليل، الأدوية…"
          }
          onSend={handleSend}
        />
      </View>

      <AssistantHistoryModal
        visible={historyOpen}
        conversations={conversations}
        activeId={activeId}
        loading={loadingHistory}
        onClose={() => setHistoryOpen(false)}
        onSelect={onSelectConversation}
        onNewChat={handleNewChat}
        onDelete={onDeleteConversation}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  headerRowRtl: { flexDirection: "row-reverse" },
  headerBtn: { width: 28, alignItems: "center" },
  title: { flex: 1, fontSize: 17, fontWeight: "700", textAlign: "center" },
  disclaimer: { fontSize: 11, lineHeight: 14 },
  body: { flex: 1, minHeight: 0 },
  list: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 6,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, textAlign: "center" },
  messages: { paddingTop: 8, paddingBottom: 32 },
  messagesEmpty: {
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  centerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 6,
    minHeight: 320,
  },
  footer: {
    flexShrink: 0,
  },
  errorBar: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 12 },
});
