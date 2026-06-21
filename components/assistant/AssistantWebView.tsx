import { Bot, Plus, RefreshCw, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useRef } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AssistantComposer } from "@/components/assistant/AssistantComposer";
import { AssistantLoadingIndicator } from "@/components/assistant/AssistantLoadingIndicator";
import { AssistantMessageBubble } from "@/components/assistant/AssistantMessageBubble";
import type { AiConversation, AiMessage } from "@/domains/ai/types";
import type { AiFeedbackType } from "@/domains/emotions/types";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";

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

const DISCLAIMER_EN =
  "AI responses are for informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment.";
const DISCLAIMER_AR =
  "ردود الذكاء الاصطناعي للمعلومات فقط وليست بديلاً عن الاستشارة الطبية أو التشخيص أو العلاج.";

export function AssistantWebView({
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
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

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

  useEffect(() => {
    if (!sending) return;
    scrollToBottom(false);
  }, [
    sending,
    messages.length,
    lastMessage?.content,
    lastMessage?.pending,
    scrollToBottom,
  ]);

  const handleContentSizeChange = useCallback(() => {
    if (initialScrollPendingRef.current || sending || isNearBottomRef.current) {
      scrollToBottom(false);
    }
  }, [scrollToBottom, sending]);

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
    },
    [onSend],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.historyPanel,
          {
            borderRightColor: colors.border,
            borderLeftColor: colors.border,
            backgroundColor: colors.card,
          },
          isRTL ? styles.historyRtl : styles.historyLtr,
        ]}
      >
        <View style={styles.historyHeader}>
          <Text style={[styles.historyTitle, { color: colors.foreground }]}>
            {isEn ? "Chats" : "المحادثات"}
          </Text>
          <Pressable
            onPress={onNewChat}
            style={[styles.newBtn, { backgroundColor: colors.primary }]}
          >
            <Plus color={colors.primaryForeground} size={16} />
            <Text style={[styles.newBtnText, { color: colors.primaryForeground }]}>
              {isEn ? "New" : "جديد"}
            </Text>
          </Pressable>
        </View>
        {loadingHistory ? (
          <View style={styles.historyLoading}>
            <AssistantLoadingIndicator compact variant="history" />
          </View>
        ) : historyError ? (
          <Text style={[styles.emptyHistory, { color: colors.destructive }]}>
            {historyError}
          </Text>
        ) : conversations.length === 0 ? (
          <Text style={[styles.emptyHistory, { color: colors.mutedForeground }]}>
            {isEn ? "No conversations yet" : "لا توجد محادثات بعد"}
          </Text>
        ) : (
          <ScrollView contentContainerStyle={styles.historyList}>
            {conversations.map((c) => {
              const selected = c.id === activeId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => onSelectConversation(c.id)}
                  style={[
                    styles.historyItem,
                    {
                      backgroundColor: selected
                        ? colors.muted
                        : "transparent",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.historyItemTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    {c.title}
                  </Text>
                  {!c.id.startsWith("draft-") ? (
                    <Pressable
                      onPress={() => onDeleteConversation(c.id)}
                      hitSlop={8}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={14} color={colors.mutedForeground} />
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.conversation}>
        <View
          style={[
            styles.conversationHeader,
            {
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top, 12),
            },
          ]}
        >
          <View style={styles.headerTitleRow}>
            <Bot color={colors.primary} size={22} />
            <Text style={[styles.conversationTitle, { color: colors.foreground }]}>
              {isEn ? "Medical AI Assistant" : "المساعد الطبي الذكي"}
            </Text>
          </View>
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            {isEn ? DISCLAIMER_EN : DISCLAIMER_AR}
          </Text>
        </View>

        {loadingHistory && messages.length === 0 ? (
          <View style={styles.historyLoadingMain}>
            <AssistantLoadingIndicator variant="history" />
          </View>
        ) : !activeConversation && !sending && messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Bot color={colors.primary} size={48} />
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
                  ? "Try: Which patients have I treated? What diagnoses did I add?"
                  : "جرّب: من المرضى الذين عالجتهم؟ ما التشخيصات التي أضفتها؟"
                : isEn
                  ? "Try: What allergies do I have? Which doctor diagnosed my migraine?"
                  : "جرّب: ما حساسيتي؟ من الذي شخّص صداعي النصفي؟"}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AssistantMessageBubble
                message={item}
                selfUserId={selfUserId}
                onFeedback={
                  onToggleMessageEmotion
                    ? (emotion) => onToggleMessageEmotion(item.id, emotion)
                    : undefined
                }
              />
            )}
            contentContainerStyle={styles.messages}
            extraData={messages.length}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={handleContentSizeChange}
          />
        )}

        {error ? (
          <View
            style={[
              styles.errorBar,
              { backgroundColor: colors.destructive + "18" },
            ]}
          >
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
            {canRetry ? (
              <Pressable onPress={onRetry} style={styles.retryBtn}>
                <RefreshCw size={14} color={colors.destructive} />
                <Text style={[styles.retryText, { color: colors.destructive }]}>
                  {isEn ? "Retry" : "إعادة"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <AssistantComposer
          sending={sending}
          disabled={loadingHistory}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", minHeight: 0 },
  historyPanel: {
    width: 280,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    minHeight: 0,
  },
  historyLtr: { borderRightWidth: StyleSheet.hairlineWidth, borderLeftWidth: 0 },
  historyRtl: { borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: 0 },
  historyHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  historyTitle: { fontSize: 16, fontWeight: "700" },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newBtnText: { fontSize: 13, fontWeight: "600" },
  historyList: { paddingHorizontal: 10, paddingBottom: 16, gap: 6 },
  historyItem: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyItemTitle: { flex: 1, fontSize: 14, fontWeight: "500" },
  deleteBtn: { padding: 4 },
  emptyHistory: { padding: 16, fontSize: 14 },
  historyLoading: {
    marginTop: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  historyLoadingMain: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  conversation: { flex: 1, minWidth: 0, minHeight: 0 },
  conversationHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  conversationTitle: { fontSize: 20, fontWeight: "700" },
  disclaimer: { fontSize: 12, lineHeight: 18 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  emptyBody: { fontSize: 15, lineHeight: 22, textAlign: "center" },
  messages: { paddingVertical: 16, flexGrow: 1 },
  errorBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  errorText: { flex: 1, fontSize: 13 },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  retryText: { fontSize: 13, fontWeight: "600" },
});
