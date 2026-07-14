import { History, Menu, Plus, RefreshCw } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
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
import { ChatMedicalRecordPills } from "@/components/chat/ChatMedicalRecordPills";
import { AssistantAvatar } from "@/components/assistant/AssistantAvatar";
import { AssistantHistoryModal } from "@/components/assistant/AssistantHistoryModal";
import { AssistantLoadingIndicator } from "@/components/assistant/AssistantLoadingIndicator";
import { AssistantMessageBubble } from "@/components/assistant/AssistantMessageBubble";
import { AssistantVoiceModeView } from "@/components/assistant/AssistantVoiceModeView";
import { AssistantCreateRecordDialog } from "@/components/assistant/AssistantCreateRecordDialog";
import { AssistantVoiceWebStyles } from "@/components/assistant/AssistantVoiceWebStyles";
import { useAppSidebar } from "@/contexts/AppSidebarContext";
import type { MedicalRecord } from "@/domains/medical/types";
import type { AiConversation, AiMessage } from "@/domains/ai/types";
import type { AiFeedbackType } from "@/domains/emotions/types";
import { useAuthStore } from "@/domains/auth/store";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useAssistantVoiceChat } from "@/hooks/useAssistantVoiceChat";
import { useAiFileAttachment } from "@/hooks/useAiFileAttachment";

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
  streaming?: boolean;
  error: string | null;
  historyError?: string | null;
  canRetry?: boolean;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onSend: (
    text: string,
    attachment?: {
      data: string;
      mimeType: string;
      name?: string;
      previewUri?: string;
      isPdf?: boolean;
    },
  ) => void;
  onRetry: () => void;
  selfUserId?: string | null;
  onToggleMessageEmotion?: (messageId: string, emotion: AiFeedbackType) => void;
  medicalImageBusy?: boolean;
  onSubmitMedicalImage?: (input: {
    uri: string;
    mimeType: string;
    fileName: string;
    webFile?: File;
    caption?: string;
    addToMedicalRecords: boolean;
    generateAiInsight: boolean;
  }) => void;
  onMedicalRecordCreated?: (record: MedicalRecord, previewUri?: string) => void;
  /** Extra bottom inset for native tab screens that need it. */
  bottomTabInset?: number;
}

export function AssistantMobileView({
  conversations,
  activeConversation,
  activeId,
  loadingHistory,
  sending,
  streaming = false,
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
  medicalImageBusy = false,
  onMedicalRecordCreated,
  bottomTabInset = 0,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { openSidebar } = useAppSidebar();
  const isEn = !isRTL;
  const isDoctor = useAuthStore((s) => s.role?.toLowerCase() === "doctor");
  const accessToken = useAuthStore((s) => s.accessToken);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [createRecordOpen, setCreateRecordOpen] = useState(false);
  const [dictatedText, setDictatedText] = useState<string | null>(null);
  const listRef = useRef<FlatList<AiMessage>>(null);
  const isNearBottomRef = useRef(true);
  const initialScrollPendingRef = useRef(true);
  const messages =
    activeConversation?.messages ??
    (sending || medicalImageBusy
      ? conversations.find((c) => c.messages.some((m) => m.pending))?.messages ?? []
      : []);
  const lastMessage = messages[messages.length - 1];

  const scrollToBottom = useCallback((animated = true) => {
    if (!listRef.current) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
      if (Platform.OS === "web") {
        const candidate = listRef.current as unknown as {
          getScrollableNode?: () => HTMLElement;
          getNativeScrollRef?: () => { getScrollableNode?: () => HTMLElement };
        };
        const node =
          candidate.getScrollableNode?.() ??
          candidate.getNativeScrollRef?.()?.getScrollableNode?.();
        if (node) node.scrollTop = node.scrollHeight;
      }
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
    scrollToBottomWithRetries(false);
    initialScrollPendingRef.current = false;
  }, [activeId, loadingHistory, messages.length, scrollToBottomWithRetries]);

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

  const voice = useAssistantVoiceChat({
    messages,
    sending,
    streaming,
    onSend,
  });

  const aiFile = useAiFileAttachment();
  const handleSend = useCallback(
    (text: string) => {
      isNearBottomRef.current = true;
      voice.armAutoSpeak();
      onSend(text, aiFile.attachment ?? undefined);
      aiFile.clear();
      scrollToBottomWithRetries(false);
    },
    [onSend, scrollToBottomWithRetries, voice, aiFile],
  );

  const handleNewChat = () => {
    onNewChat();
    setHistoryOpen(false);
  };

  const renderEmpty = () => (
    <View style={styles.centerEmpty}>
      <AssistantAvatar height={36} isTalking={voice.isTalking} webClassName="assistant-avatar" />
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
            isRTL={isRTL}
            selfUserId={selfUserId}
            spokenWordIndex={
              voice.spokenHighlight?.messageId === item.id
                ? voice.spokenHighlight.wordIndex
                : null
            }
            isReadingAloud={
              voice.spokenHighlight?.messageId === item.id && voice.isTalking
            }
            onReadAloud={() =>
              void voice.readAloudMessage(item.id, item.content)
            }
            onFeedback={
              onToggleMessageEmotion
                ? (emotion) => onToggleMessageEmotion(item.id, emotion)
                : undefined
            }
          />
        )}
        ListEmptyComponent={renderEmpty}
        extraData={`${messages.length}:${lastMessageId}:${lastMessage?.content?.length ?? 0}:${sending}:${voice.spokenHighlight?.wordIndex ?? -1}:${voice.isTalking}`}
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
      <AssistantVoiceWebStyles />
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
          <Pressable
            onPress={openSidebar}
            hitSlop={10}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel={t.tabs.menu}
          >
            <Menu color={colors.foreground} size={20} />
          </Pressable>
          <Pressable onPress={() => setHistoryOpen(true)} hitSlop={10} style={styles.headerBtn}>
            <History color={colors.primary} size={20} />
          </Pressable>
          <AssistantAvatar
            height={22}
            isTalking={voice.isTalking}
            webClassName="assistant-avatar"
          />
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

      <View style={styles.body}>
        {voice.isVoiceMode ? (
          <AssistantVoiceModeView
            isRecording={voice.isRecording}
            isTranscribing={voice.isTranscribing}
            isTalking={voice.isTalking}
            sending={sending}
            streaming={streaming}
            voiceError={voice.voiceError ?? error ?? historyError ?? null}
            liveTranscript={voice.liveTranscript}
            speechLocale={voice.speechLocale}
            onSpeechLocaleChange={voice.setSpeechLocale}
            onSend={() => void voice.sendRecording(voice.liveTranscript)}
            onExit={() => void voice.exitVoiceMode()}
            onClearError={voice.clearVoiceError}
          />
        ) : (
          renderMessages()
        )}
      </View>

      {!voice.isVoiceMode ? (
      <View style={styles.footer}>
        {(error || historyError || voice.voiceError) ? (
          error && !canRetry ? (
            <View
              style={[
                styles.errorBar,
                { backgroundColor: colors.destructive + "18" },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error ?? voice.voiceError}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={
                error
                  ? onRetry
                  : voice.voiceError
                    ? voice.clearVoiceError
                    : undefined
              }
              style={[
                styles.errorBar,
                { backgroundColor: colors.destructive + "18" },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error ?? historyError ?? voice.voiceError}
              </Text>
              {error || historyError ? (
                <RefreshCw size={14} color={colors.destructive} />
              ) : null}
            </Pressable>
          )
        ) : null}

        {!isDoctor ? (
          <ChatMedicalRecordPills
            isRTL={isRTL}
            onAddMedicalRecord={() => setCreateRecordOpen(true)}
            disabled={loadingHistory || medicalImageBusy}
          />
        ) : null}

        <AssistantComposer
          compact
          isRTL={isRTL}
          sending={sending || medicalImageBusy}
          disabled={loadingHistory || medicalImageBusy}
          bottomInset={bottomTabInset}
          isDictating={voice.isDictating}
          micLoading={voice.isDictating && voice.isTranscribing}
          onMicPress={() =>
            voice.toggleDictation((text) => setDictatedText(text))
          }
          aiAttachment={
            aiFile.attachment
              ? {
                  previewUri: aiFile.attachment.previewUri,
                  name: aiFile.attachment.name,
                  isPdf: aiFile.attachment.isPdf,
                }
              : null
          }
          onAttachAiFile={() => void aiFile.pickFile()}
          aiAttachLoading={aiFile.loading}
          onRemoveAiAttachment={aiFile.clear}
          dictatedText={dictatedText}
          onDictatedTextConsumed={() => setDictatedText(null)}
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
      ) : null}

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

      {accessToken ? (
        <AssistantCreateRecordDialog
          visible={createRecordOpen}
          token={accessToken}
          onClose={() => setCreateRecordOpen(false)}
          onCreated={(record, previewUri) => {
            onMedicalRecordCreated?.(record, previewUri);
            setCreateRecordOpen(false);
          }}
        />
      ) : null}
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
