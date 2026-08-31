import { usePathname, useSegments } from "expo-router";
import { Bot, History, Minus, Plus, X } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardStickyView,
  useKeyboardState,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AssistantComposer } from "@/components/assistant/AssistantComposer";
import { AssistantHistoryModal } from "@/components/assistant/AssistantHistoryModal";
import { AssistantMessageBubble } from "@/components/assistant/AssistantMessageBubble";
import { GuestAiLimitError, sendGuestAiChat } from "@/domains/ai/guestApi";
import {
  GUEST_AI_MAX_MESSAGES,
  getGuestAiSentCount,
  getGuestAiSessionId,
  loadGuestActiveConversationId,
  loadGuestConversations,
  makeGuestConversationId,
  saveGuestActiveConversationId,
  saveGuestConversations,
  setGuestAiSentCount,
} from "@/domains/ai/guestSession";
import { useAiEnabled } from "@/domains/ai/aiPreference";
import type { AiConversation, AiMessage } from "@/domains/ai/types";
import { useAsk3elagiAiWidgetStore } from "@/domains/ai/widget-store";
import { promptAuthForConsultation } from "@/domains/auth/guestBrowse";
import {
  isDemoEmbedPath,
} from "@/domains/auth/demoSession";
import { useAuthStore } from "@/domains/auth/store";
import { isSignedIn } from "@/domains/auth/session";
import { getApiLang } from "@/domains/i18n/store";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import { useAiFileAttachment } from "@/hooks/useAiFileAttachment";
import type { AiFileAttachment } from "@/hooks/useAiFileAttachment";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/hooks/useI18n";
import { useWebLayout } from "@/hooks/useWebLayout";
import { flexRow } from "@/utils/rtl";
import { AI_ATTACHMENT_ONLY_PLACEHOLDER } from "@/utils/aiMessageDisplay";
import { MEDICAL_RECORD_ADD_BAR_HEIGHT } from "@/components/records/MedicalRecordAddBar";
import { MEDICAL_FORM_SAVE_BAR_HEIGHT } from "@/constants/medicalFormFooter";
import { NATIVE_TAB_BAR_HEIGHT } from "@/constants/webLayout";
import { profileSaveChromeHeight } from "@/components/profile/profileSaveChrome";
import { viewportPortal } from "@/utils/viewportPortal";

function makeLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** FAB size — used by pages that need bottom padding clearance. */
export const ASK_3ELAGI_AI_FAB_SIZE = 56;
/** Gap from the viewport edge. */
export const ASK_3ELAGI_AI_FAB_CHROME_GAP = 8;
/** Extra breathing room above the native bottom tab bar. */
export const ASK_3ELAGI_AI_FAB_TAB_BAR_GAP = 14;

function isProfileRoute(pathname: string | null, segments: string[]): boolean {
  return segments.includes("profile") || Boolean(pathname?.includes("/profile"));
}

/** Records pages dock an add-record bar — lift the FAB above it on mobile. */
function recordsAddBarFabOffset(
  pathname: string | null,
  segments: string[],
  isDesktop: boolean,
): number {
  if (isDesktop) return 0;
  const onRecordsTab =
    segments.includes("records") || Boolean(pathname?.includes("/records"));
  const onPatientRecords = Boolean(pathname?.match(/\/patients\/[^/]+\/?$/));
  const onBodyPartRecords = Boolean(pathname?.includes("/medical/body"));
  if (!onRecordsTab && !onPatientRecords && !onBodyPartRecords) return 0;
  return MEDICAL_RECORD_ADD_BAR_HEIGHT + ASK_3ELAGI_AI_FAB_CHROME_GAP;
}

/** The medical add / prescription forms dock a Save + Cancel bar — clear it. */
function medicalFormSaveBarFabOffset(pathname: string | null): number {
  if (!pathname) return 0;
  if (!/\/medical\/(add|prescription\/add)/.test(pathname)) return 0;
  return MEDICAL_FORM_SAVE_BAR_HEIGHT + ASK_3ELAGI_AI_FAB_CHROME_GAP;
}

/** Profile pages dock a Save bar — lift the FAB above it. */
function profileSaveBarFabOffset(
  pathname: string | null,
  segments: string[],
  isDesktop: boolean,
): number {
  if (!isProfileRoute(pathname, segments)) return 0;
  return (
    profileSaveChromeHeight({ withLogout: !isDesktop }) +
    ASK_3ELAGI_AI_FAB_CHROME_GAP
  );
}

/** Chat screens dock a composer (mic + input) — floating FAB is hidden;
 * ChatComposer renders an inline Ask AI control above the input instead. */
function hideFabOnChatRoute(
  pathname: string | null,
  segments: string[],
): boolean {
  if (pathname && /(^|\/)chat(\/|$)/.test(pathname)) return true;
  return segments.some((s) => s === "chat");
}
/** Distinct red so the floating Ask 3elagi AI control stands out from primary CTAs. */
const ASK_3ELAGI_AI_FAB_RED = "#e11d48";
const ASK_3ELAGI_AI_FAB_RED_SOFT = "rgba(255, 255, 255, 0.18)";
const ASK_3ELAGI_AI_FAB_ON_RED = "#ffffff";
const ASK_3ELAGI_AI_FAB_ON_RED_MUTED = "rgba(255, 255, 255, 0.82)";
const ASK_3ELAGI_AI_FAB_RED_SHADOW =
  "0 10px 28px rgba(225, 29, 72, 0.45), 0 4px 12px rgba(15, 23, 42, 0.18)";

function shouldHideOnRoute(pathname: string | null, segments: string[]): boolean {
  const root = segments[0];
  if (!root || root === "welcome" || root === "auth") return true;
  if (root === "admin") return true;
  if (root === "video-call") return true;
  if (root === "doctor-pending") return true;
  // Outer dual-panel demo shell only — iframe apps (patient / doctor) keep Ask AI.
  if (pathname === "/demo") return true;
  if (pathname && isDemoEmbedPath(pathname)) return true;
  if (pathname?.includes("/assistant") || segments.includes("assistant")) {
    return true;
  }
  return false;
}

/** Doctor patient profile route → scope AI to that patient. */
function patientUserIdFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = pathname.match(/\/patients\/([0-9a-fA-F-]{36})(?:\/|$)/);
  return match?.[1] ?? null;
}

function Ask3elagiAiPanel() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const dir = flexRow(isRTL);
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardState((s) => s.isVisible);
  const pathname = usePathname();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isDesktop } = useWebLayout();
  const isNative = Platform.OS !== "web";
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const signedIn = hydrated && isSignedIn(profile, accessToken);
  const closeWidget = useAsk3elagiAiWidgetStore((s) => s.closeWidget);
  const consumePendingQuestion = useAsk3elagiAiWidgetStore(
    (s) => s.consumePendingQuestion,
  );
  const scopedPatientUserId = useAsk3elagiAiWidgetStore((s) => s.patientUserId);
  const setPatientUserId = useAsk3elagiAiWidgetStore((s) => s.setPatientUserId);
  const assistant = useAiAssistant();
  const aiFile = useAiFileAttachment();
  const listRef = useRef<FlatList>(null);
  const [guestConversations, setGuestConversations] = useState<AiConversation[]>([]);
  const [guestActiveId, setGuestActiveId] = useState<string | null>(null);
  const [guestSending, setGuestSending] = useState(false);
  const [guestSentCount, setGuestSentCountState] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const sentPendingRef = useRef(false);
  const patientUserId =
    scopedPatientUserId ?? patientUserIdFromPath(pathname);

  const guestActiveConversation = guestConversations.find(
    (c) => c.id === guestActiveId,
  );
  const messages = signedIn
    ? (assistant.activeConversation?.messages ?? [])
    : (guestActiveConversation?.messages ?? []);
  const busy = signedIn
    ? assistant.sending || assistant.streaming
    : guestSending;
  const loadingHistory = signedIn ? assistant.loadingHistory : false;

  useEffect(() => {
    const fromPath = patientUserIdFromPath(pathname);
    if (fromPath) setPatientUserId(fromPath);
  }, [pathname, setPatientUserId]);

  useEffect(() => {
    if (signedIn) return;
    void getGuestAiSentCount().then(setGuestSentCountState);
    void (async () => {
      const [rows, activeId] = await Promise.all([
        loadGuestConversations(),
        loadGuestActiveConversationId(),
      ]);
      setGuestConversations(rows);
      setGuestActiveId(activeId ?? rows[0]?.id ?? null);
    })();
  }, [signedIn]);

  const persistGuestState = useCallback(
    (rows: AiConversation[], activeId: string | null) => {
      setGuestConversations(rows);
      setGuestActiveId(activeId);
      void saveGuestConversations(rows);
      void saveGuestActiveConversationId(activeId);
    },
    [],
  );

  const patchGuestConversation = useCallback(
    (
      conversationId: string,
      patch: Partial<AiConversation> | ((c: AiConversation) => AiConversation),
    ) => {
      setGuestConversations((prev) => {
        const rows = prev.map((c) => {
          if (c.id !== conversationId) return c;
          return typeof patch === "function" ? patch(c) : { ...c, ...patch };
        });
        void saveGuestConversations(rows);
        return rows;
      });
    },
    [],
  );

  const ensureGuestConversation = useCallback((): {
    id: string;
    messages: AiMessage[];
  } => {
    if (guestActiveId && guestConversations.some((c) => c.id === guestActiveId)) {
      const conv = guestConversations.find((c) => c.id === guestActiveId)!;
      return { id: guestActiveId, messages: conv.messages };
    }
    const id = makeGuestConversationId();
    const draft: AiConversation = {
      id,
      title: "New chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    const rows = [draft, ...guestConversations];
    persistGuestState(rows, id);
    return { id, messages: [] };
  }, [guestActiveId, guestConversations, persistGuestState]);

  const scrollToLatest = useCallback((animated = false) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const sendGuestMessage = useCallback(
    async (value: string, attachment?: AiFileAttachment | null) => {
      const question = value.trim();
      if ((!question && !attachment) || guestSending) return;

      const alreadySent = await getGuestAiSentCount();
      if (alreadySent >= GUEST_AI_MAX_MESSAGES) {
        promptAuthForConsultation();
        return;
      }

      const { id: conversationId, messages: priorMessages } = ensureGuestConversation();
      const displayContent =
        question || (attachment ? AI_ATTACHMENT_ONLY_PLACEHOLDER : "");
      const attImageUri =
        attachment && !attachment.isPdf && attachment.mimeType.startsWith("image/")
          ? `data:${attachment.mimeType};base64,${attachment.data}`
          : undefined;
      const attFileName =
        attachment && (attachment.isPdf || !attachment.mimeType.startsWith("image/"))
          ? attachment.name
          : undefined;

      const userMsg: AiMessage = {
        id: makeLocalId("guest-user"),
        role: "user",
        content: displayContent,
        createdAt: new Date().toISOString(),
        imageUri: attImageUri,
        fileName: attFileName,
      };
      const assistantLocalId = makeLocalId("guest-ai");
      const pendingAssistant: AiMessage = {
        id: assistantLocalId,
        role: "assistant",
        content: "",
        pending: true,
        createdAt: new Date().toISOString(),
      };

      setGuestSending(true);
      patchGuestConversation(conversationId, (c) => ({
        ...c,
        title:
          c.title === "New chat" && displayContent
            ? displayContent.slice(0, 80)
            : c.title,
        updatedAt: new Date().toISOString(),
        messages: [...c.messages, userMsg, pendingAssistant],
      }));

      try {
        const guestId = await getGuestAiSessionId();
        const history = priorMessages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .filter((m) => !m.pending && m.content.trim())
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));
        const result = await sendGuestAiChat({
          guestId,
          message: question || AI_ATTACHMENT_ONLY_PLACEHOLDER,
          history,
          locale: getApiLang(),
          attachment,
        });
        await setGuestAiSentCount(result.used);
        setGuestSentCountState(result.used);
        patchGuestConversation(conversationId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantLocalId
              ? { ...m, pending: false, content: result.content }
              : m,
          ),
        }));
      } catch (e) {
        if (e instanceof GuestAiLimitError) {
          patchGuestConversation(conversationId, (c) => ({
            ...c,
            messages: c.messages.filter(
              (m) => m.id !== userMsg.id && m.id !== assistantLocalId,
            ),
          }));
          promptAuthForConsultation();
          return;
        }
        const errText =
          e instanceof Error ? e.message : t.auth.genericError;
        patchGuestConversation(conversationId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantLocalId
              ? { ...m, pending: false, content: errText }
              : m,
          ),
        }));
      } finally {
        setGuestSending(false);
      }
    },
    [
      ensureGuestConversation,
      guestSending,
      patchGuestConversation,
      t.auth.genericError,
    ],
  );

  useEffect(() => {
    if (sentPendingRef.current) return;
    const pending = consumePendingQuestion();
    if (!pending?.trim()) return;
    sentPendingRef.current = true;
    if (signedIn) {
      void assistant.sendMessage(pending.trim(), patientUserId ?? undefined);
    } else {
      void sendGuestMessage(pending.trim());
    }
  }, [
    consumePendingQuestion,
    assistant,
    patientUserId,
    signedIn,
    sendGuestMessage,
  ]);

  // Scroll to last message when the panel opens / history finishes loading.
  useEffect(() => {
    if (loadingHistory) return;
    scrollToLatest(false);
    const t1 = setTimeout(() => scrollToLatest(false), 80);
    const t2 = setTimeout(() => scrollToLatest(false), 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [
    loadingHistory,
    assistant.activeId,
    messages.length,
    scrollToLatest,
  ]);

  useEffect(() => {
    if (messages.length === 0) return;
    scrollToLatest(true);
  }, [messages.length, assistant.streaming, guestSending, scrollToLatest]);

  const handleSend = useCallback(
    (value: string) => {
      const question = value.trim();
      if (busy) return;

      if (signedIn) {
        if (!question && !aiFile.attachment) return;
        void assistant.sendMessage(
          question,
          patientUserId ?? undefined,
          aiFile.attachment ?? undefined,
        );
        aiFile.clear();
        return;
      }

      if (!question && !aiFile.attachment) return;
      const attachment = aiFile.attachment;
      aiFile.clear();
      void sendGuestMessage(question, attachment);
    },
    [
      aiFile,
      assistant,
      busy,
      patientUserId,
      sendGuestMessage,
      signedIn,
    ],
  );

  const onNewChat = () => {
    aiFile.clear();
    sentPendingRef.current = true;
    setHistoryOpen(false);
    if (signedIn) {
      assistant.startNewChat();
      return;
    }
    const id = makeGuestConversationId();
    const draft: AiConversation = {
      id,
      title: "New chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    persistGuestState([draft, ...guestConversations], id);
  };

  const historyConversations = signedIn
    ? assistant.conversations
    : guestConversations;
  const historyActiveId = signedIn ? assistant.activeId : guestActiveId;
  const historyLoading = signedIn ? assistant.loadingHistory : false;

  const onSelectHistory = (id: string) => {
    if (signedIn) {
      assistant.setActiveId(id);
      return;
    }
    setGuestActiveId(id);
    void saveGuestActiveConversationId(id);
  };

  const onDeleteHistory = (id: string) => {
    if (signedIn) {
      void assistant.removeConversation(id);
      return;
    }
    const next = guestConversations.filter((c) => c.id !== id);
    const nextActive =
      guestActiveId === id ? (next[0]?.id ?? null) : guestActiveId;
    persistGuestState(next, nextActive);
  };

  const panelStyle = isDesktop
    ? {
        top: undefined as number | undefined,
        bottom: Math.max(insets.bottom, 12) + ASK_3ELAGI_AI_FAB_CHROME_GAP,
        ...(isRTL
          ? { left: 16, right: undefined as number | undefined }
          : { right: 16, left: undefined as number | undefined }),
        width: windowWidth * 0.3,
        maxWidth: windowWidth * 0.3,
        height: Math.min(windowHeight * 0.75, 640),
        borderRadius: 18,
      }
    : {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: windowWidth,
        maxWidth: windowWidth,
        height: windowHeight,
        borderRadius: 0,
        paddingTop: insets.top,
        // Safe area when keyboard closed; sticky composer sits on keyboard when open.
        paddingBottom:
          isNative && keyboardVisible ? 0 : Math.max(insets.bottom, 8),
      };

  const webShadow =
    Platform.OS === "web"
      ? ({
          boxShadow: isDesktop
            ? "0 16px 48px rgba(15, 23, 42, 0.22), 0 4px 14px rgba(15, 23, 42, 0.12)"
            : "0 8px 28px rgba(15, 23, 42, 0.18)",
        } as const)
      : null;

  const PanelShell = isNative ? View : KeyboardAvoidingView;
  const panelShellProps = isNative
    ? {}
    : ({ behavior: "padding" as const });

  return (
    <PanelShell
      {...panelShellProps}
      style={
        [
          styles.panel,
          panelStyle,
          webShadow,
          Platform.OS === "web" ? ({ position: "fixed" } as const) : null,
        ] as object
      }
    >
      <View
        style={[
          styles.panelInner,
          {
            backgroundColor: colors.card,
            borderColor: ASK_3ELAGI_AI_FAB_RED,
            borderWidth: isDesktop ? 2 : 0,
            borderRadius: panelStyle.borderRadius,
          },
        ]}
      >
      <View
        style={[
          styles.panelHeader,
          {
            flexDirection: dir,
            borderBottomColor: "rgba(255, 255, 255, 0.22)",
            backgroundColor: ASK_3ELAGI_AI_FAB_RED,
          },
        ]}
      >
        <View style={[styles.headerLeft, { flexDirection: dir, flex: 1 }]}>
          <View
            style={[styles.iconBubble, { backgroundColor: ASK_3ELAGI_AI_FAB_RED_SOFT }]}
          >
            <Bot size={16} color={ASK_3ELAGI_AI_FAB_ON_RED} />
          </View>
          <Text
            style={[styles.title, { color: ASK_3ELAGI_AI_FAB_ON_RED, flexShrink: 1 }]}
            numberOfLines={1}
          >
            {t.records.ask3elagiAi}
          </Text>
        </View>
        <View style={[styles.headerActions, { flexDirection: dir }]}>
          <Pressable
            onPress={() => setHistoryOpen(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t.tabs.history}
            style={styles.iconBtn}
          >
            <History size={18} color={ASK_3ELAGI_AI_FAB_ON_RED_MUTED} />
          </Pressable>
          <Pressable
            onPress={onNewChat}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t.records.ask3elagiAiNewChat}
            style={[
              styles.newChatBtn,
              { backgroundColor: ASK_3ELAGI_AI_FAB_RED_SOFT, flexDirection: dir },
            ]}
          >
            <Plus size={14} color={ASK_3ELAGI_AI_FAB_ON_RED} />
            <Text style={[styles.newChatLabel, { color: ASK_3ELAGI_AI_FAB_ON_RED }]}>
              {t.records.ask3elagiAiNewChat}
            </Text>
          </Pressable>
          {isDesktop ? (
            <Pressable
              onPress={closeWidget}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Minimize"
              style={styles.iconBtn}
            >
              <Minus size={18} color={ASK_3ELAGI_AI_FAB_ON_RED_MUTED} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={closeWidget}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.iconBtn}
          >
            <X size={18} color={ASK_3ELAGI_AI_FAB_ON_RED_MUTED} />
          </Pressable>
        </View>
      </View>

      {loadingHistory ? (
        <View style={[styles.chatLoading, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          key={signedIn ? (assistant.activeId ?? "new") : (guestActiveId ?? "guest")}
          keyExtractor={(item) => item.id}
          style={[styles.chatList, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.chatListContent}
          onContentSizeChange={() => scrollToLatest(false)}
          onLayout={() => scrollToLatest(false)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          renderItem={({ item }) => (
            <AssistantMessageBubble
              message={item}
              compact
              selfUserId={assistant.selfUserId}
              isRTL={isRTL}
            />
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              {t.records.ask3elagiAiPlaceholder}
            </Text>
          }
        />
      )}

      {!signedIn ? (
        <Text
          style={[
            styles.guestQuota,
            { color: colors.mutedForeground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t.ai.guestMessagesLeft(
            Math.max(0, GUEST_AI_MAX_MESSAGES - guestSentCount),
            GUEST_AI_MAX_MESSAGES,
          )}
        </Text>
      ) : null}

      <KeyboardStickyView enabled={isNative} offset={{ closed: 0, opened: 0 }}>
        <AssistantComposer
          key={signedIn ? (assistant.activeId ?? "widget-new") : "widget-guest"}
          compact
          isRTL={isRTL}
          sending={busy}
          disabled={loadingHistory}
          placeholder={t.records.ask3elagiAiPlaceholder}
          onSend={handleSend}
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
          onScanAiFile={
            aiFile.canScan ? () => void aiFile.scanFile() : undefined
          }
          aiAttachLoading={aiFile.loading}
          onRemoveAiAttachment={aiFile.clear}
        />
      </KeyboardStickyView>

      <AssistantHistoryModal
        visible={historyOpen}
        conversations={historyConversations}
        activeId={historyActiveId}
        loading={historyLoading}
        onClose={() => setHistoryOpen(false)}
        onSelect={onSelectHistory}
        onNewChat={onNewChat}
        onDelete={onDeleteHistory}
      />
      </View>
    </PanelShell>
  );
}

/** Global floating Ask 3elagi AI chat — mount once in the root layout. */
export function Ask3elagiAiWidget() {
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useWebLayout();
  const pathname = usePathname();
  const segments = useSegments();
  const hydrated = useAuthStore((s) => s.hydrated);
  const profile = useAuthStore((s) => s.profile);
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const open = useAsk3elagiAiWidgetStore((s) => s.open);
  const openWidget = useAsk3elagiAiWidgetStore((s) => s.openWidget);
  const closeWidget = useAsk3elagiAiWidgetStore((s) => s.closeWidget);

  const aiEnabled = useAiEnabled();
  const signedIn = hydrated && isSignedIn(profile, accessToken);
  const roleOk =
    role?.toLowerCase() === "patient" || role?.toLowerCase() === "doctor";
  /** Guests + patient/doctor accounts; hide for admin / unsupported roles when signed in. */
  const canUseWidget = (!signedIn || roleOk) && aiEnabled;
  const hidden = shouldHideOnRoute(pathname, segments as string[]);
  // Circle icon-only on native + mobile web; labeled pill on desktop web.
  const iconOnlyFab = Platform.OS !== "web" || !isDesktop;

  useEffect(() => {
    if (!canUseWidget || hidden) closeWidget();
  }, [canUseWidget, hidden, closeWidget]);

  // Escape key closes the floating AI chat (web / mobile browser).
  useEffect(() => {
    if (Platform.OS !== "web" || !open || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeWidget();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeWidget]);

  if (!hydrated || !canUseWidget || hidden) return null;

  const edge = 16;
  const addBarLift = recordsAddBarFabOffset(
    pathname,
    segments as string[],
    isDesktop,
  );
  const profileLift = profileSaveBarFabOffset(
    pathname,
    segments as string[],
    isDesktop,
  );
  const hideFab = hideFabOnChatRoute(pathname, segments as string[]);
  const medicalFormLift = medicalFormSaveBarFabOffset(pathname);
  // Native tab screens sit under the bottom bar; lift the FAB clear of it,
  // plus a gap so the two never touch (the base already covers the inset).
  const tabBarLift =
    Platform.OS !== "web" && (segments as string[]).includes("(tabs)")
      ? NATIVE_TAB_BAR_HEIGHT + ASK_3ELAGI_AI_FAB_TAB_BAR_GAP
      : 0;
  const bottom =
    Math.max(insets.bottom, ASK_3ELAGI_AI_FAB_CHROME_GAP) +
    tabBarLift +
    addBarLift +
    profileLift +
    medicalFormLift;
  // Bottom-right in English (LTR), bottom-left in Arabic (RTL).
  const sideStyle = isRTL
    ? { left: edge, right: undefined as number | undefined }
    : { right: edge, left: undefined as number | undefined };

  const content = (
    <View style={styles.host} pointerEvents="box-none">
      {open ? <Ask3elagiAiPanel /> : null}

      {!open && !hideFab ? (
        <Pressable
          onPress={() => openWidget(undefined, patientUserIdFromPath(pathname))}
          style={[
            iconOnlyFab ? styles.fabCircle : styles.fab,
            sideStyle,
            {
              bottom,
              backgroundColor: ASK_3ELAGI_AI_FAB_RED,
              shadowColor: ASK_3ELAGI_AI_FAB_RED,
            },
            Platform.OS === "web"
              ? ({ boxShadow: ASK_3ELAGI_AI_FAB_RED_SHADOW } as const)
              : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t.records.ask3elagiAi}
        >
          {iconOnlyFab ? (
            <Bot size={26} color="#fff" />
          ) : (
            <>
              <Bot size={22} color="#fff" />
              <Text style={styles.fabLabel} numberOfLines={1}>
                {t.records.ask3elagiAi}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );

  return viewportPortal(content);
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 10000,
    ...(Platform.OS === "web"
      ? ({
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          pointerEvents: "box-none",
        } as const)
      : null),
  },
  fab: {
    position: Platform.OS === "web" ? ("fixed" as const) : "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: ASK_3ELAGI_AI_FAB_SIZE,
    paddingHorizontal: 16,
    borderRadius: 28,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
    zIndex: 10001,
  },
  fabCircle: {
    position: Platform.OS === "web" ? ("fixed" as const) : "absolute",
    width: ASK_3ELAGI_AI_FAB_SIZE,
    height: ASK_3ELAGI_AI_FAB_SIZE,
    borderRadius: ASK_3ELAGI_AI_FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
    zIndex: 10001,
  },
  fabLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    maxWidth: 140,
  },
  panel: {
    position: "absolute",
    // Shadow lives on the outer shell; inner clips rounded corners.
    overflow: "visible",
    shadowColor: "#0f172a",
    shadowOpacity: 0.32,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 14 },
    elevation: 28,
  },
  panelInner: {
    flex: 1,
    overflow: "hidden",
  },
  panelHeader: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerLeft: { alignItems: "center", gap: 8, minWidth: 0 },
  headerActions: { alignItems: "center", gap: 4, flexShrink: 0 },
  iconBtn: { padding: 4 },
  newChatBtn: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  newChatLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "800" },
  chatList: { flex: 1 },
  chatListContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexGrow: 1,
  },
  chatLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHint: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  guestQuota: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingTop: 6,
  },
});
